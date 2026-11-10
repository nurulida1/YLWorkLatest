
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Model;
using YLWorks.Services;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class HardwareRequestController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public HardwareRequestController(
            AppDbContext context,
            NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // =========================================================
        // 1. HELPERS
        // =========================================================

        private Guid? GetCurrentUserId()
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue("sub");

            return Guid.TryParse(userId, out var id) ? id : null;
        }

        private bool IsRequestManager()
        {
            return User.IsInRole("Admin") ||
                   User.IsInRole("IT") ||
                   User.IsInRole("Inventory");
        }

        private IQueryable<HardwareRequest> RequestQuery()
        {
            return _context.HardwareRequests
                .Include(x => x.Items)
                    .ThenInclude(x => x.Inventory)
                .Include(x => x.RequestedBy)
                .Include(x => x.ApprovedBy)
                .Include(x => x.AssignedTo)
                .Include(x => x.ResponsibleDepartment)
                .Include(x => x.Project);
        }

        private bool IsNonInventoryRequest(string requestType)
        {
            return requestType == "ITSupport" ||
                   requestType == "BugReport";
        }

        // =========================================================
        // 2. DEPARTMENT ROUTING
        // =========================================================

        private string? GetResponsibleDepartment(string requestType)
        {
            return requestType switch
            {
                "Hardware" => "IT",
                "ITSupport" => "IT",
                "BugReport" => "IT",
                "SiteMaterial" => "Purchasing & Logistic",
                _ => null
            };
        }

        private async Task<Department?> GetResponsibleDepartmentAsync(
            string requestType)
        {
            var departmentName = GetResponsibleDepartment(requestType);

            if (string.IsNullOrWhiteSpace(departmentName))
                return null;

            return await _context.Departments
                .FirstOrDefaultAsync(d =>
                    d.IsActive &&
                    d.Name.ToLower() == departmentName.ToLower());
        }

        // =========================================================
        // 3. HOD AUTHORIZATION
        // =========================================================

        private async Task<bool> CanManageRequestAsync(
            HardwareRequest request,
            Guid userId)
        {
            if (IsRequestManager())
                return true;

            if (!request.ResponsibleDepartmentId.HasValue)
                return false;

            return await _context.Departments.AnyAsync(d =>
                d.Id == request.ResponsibleDepartmentId.Value &&
                d.IsActive &&
                d.HodId == userId);
        }

        // =========================================================
        // 4. NOTIFICATIONS
        // =========================================================

        private async Task NotifyUserAsync(
            Guid userId,
            string title,
            string message,
            string type,
            Guid requestId)
        {
            await _notificationService.CreateAsync(
                userId,
                title,
                message,
                type,
                $"/hardware-request/{requestId}"
            );
        }

        private async Task NotifyHodsAsync(
            HardwareRequest request,
            string title,
            string message,
            string type)
        {
            if (!request.ResponsibleDepartmentId.HasValue)
                return;

            var hodId = await _context.Departments
                .Where(d =>
                    d.Id == request.ResponsibleDepartmentId.Value &&
                    d.IsActive)
                .Select(d => d.HodId)
                .FirstOrDefaultAsync();

            if (!hodId.HasValue)
                return;

            if (hodId.Value == request.RequestedById)
                return;

            await NotifyUserAsync(
                hodId.Value,
                title,
                message,
                type,
                request.Id
            );
        }

        private async Task NotifyRequesterAsync(
            HardwareRequest request,
            string title,
            string message,
            string type)
        {
            await NotifyUserAsync(
                request.RequestedById,
                title,
                message,
                type,
                request.Id
            );
        }

        private string GetTypeLabel(string requestType)
        {
            return requestType switch
            {
                "SiteMaterial" => "Site Material",
                "ITSupport" => "IT Support",
                "BugReport" => "Bug Report",
                "Hardware" => "Hardware",
                _ => "Request"
            };
        }

        // =========================================================
        // 5. CREATE REQUEST
        // POST: api/HardwareRequest/Create
        // =========================================================

        [HttpPost("Create")]
        public async Task<IActionResult> Create(
            [FromBody] CreateHardwareRequestDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized("Invalid user account.");

            if (string.IsNullOrWhiteSpace(dto.RequestType))
                return BadRequest("Request type is required.");

            var allowedTypes = new[]
            {
                "Hardware",
                "SiteMaterial",
                "ITSupport",
                "BugReport"
            };

            if (!allowedTypes.Contains(dto.RequestType))
                return BadRequest("Invalid request type.");

            if (string.IsNullOrWhiteSpace(dto.Subject))
                return BadRequest("Subject is required.");

            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest("Description is required.");

            Project? linkedProject = null;

            if (dto.ProjectId.HasValue)
            {
                linkedProject = await _context.Projects
                    .FirstOrDefaultAsync(x => x.Id == dto.ProjectId.Value);

                if (linkedProject == null)
                    return BadRequest("Selected project was not found.");
            }

            // Hardware and Site Material require items.
            // IT Support and Bug Report do not.
            if (!IsNonInventoryRequest(dto.RequestType) &&
                (dto.Items == null || !dto.Items.Any()))
            {
                return BadRequest(
                    "Please add at least one item for hardware or site material requests.");
            }

            // Bug Report validation.
            if (dto.RequestType == "BugReport")
            {
                if (string.IsNullOrWhiteSpace(dto.AffectedModule))
                    return BadRequest("Affected module is required.");

                if (string.IsNullOrWhiteSpace(dto.BugCategory))
                    return BadRequest("Bug category is required.");

                if (string.IsNullOrWhiteSpace(dto.StepsToReproduce))
                    return BadRequest("Steps to reproduce are required.");

                if (string.IsNullOrWhiteSpace(dto.ExpectedResult))
                    return BadRequest("Expected result is required.");

                if (string.IsNullOrWhiteSpace(dto.ActualResult))
                    return BadRequest("Actual result is required.");
            }

            // Automatically determine responsible department.
            var responsibleDepartment =
                await GetResponsibleDepartmentAsync(dto.RequestType);

            if (responsibleDepartment == null)
            {
                return BadRequest(
                    $"No active department is configured for {dto.RequestType} requests.");
            }

            if (!responsibleDepartment.HodId.HasValue)
            {
                return BadRequest(
                    $"Please assign an HOD to the {responsibleDepartment.Name} department before submitting this request.");
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var request = new HardwareRequest
                {
                    Id = Guid.NewGuid(),

                    RequestType = dto.RequestType,
                    Subject = dto.Subject.Trim(),
                    Description = dto.Description.Trim(),

                    Priority = string.IsNullOrWhiteSpace(dto.Priority)
                        ? "Normal"
                        : dto.Priority,

                    Status = "Pending",

                    RequestedById = currentUserId.Value,

                    ResponsibleDepartmentId = responsibleDepartment.Id,

                    ProjectId = linkedProject?.Id,
                    ProjectName = linkedProject?.ProjectTitle ?? dto.ProjectName,
                    SiteName = dto.SiteName,
                    Location = dto.Location,
                    LocationDetails = dto.LocationDetails,
                    NeededBy = dto.NeededBy,

                    // Bug Report Information
                    AffectedModule = dto.RequestType == "BugReport"
                        ? dto.AffectedModule?.Trim()
                        : null,

                    BugCategory = dto.RequestType == "BugReport"
                        ? dto.BugCategory?.Trim()
                        : null,

                    StepsToReproduce = dto.RequestType == "BugReport"
                        ? dto.StepsToReproduce?.Trim()
                        : null,

                    ExpectedResult = dto.RequestType == "BugReport"
                        ? dto.ExpectedResult?.Trim()
                        : null,

                    ActualResult = dto.RequestType == "BugReport"
                        ? dto.ActualResult?.Trim()
                        : null,

                    Items = new List<HardwareRequestItem>()
                };

                // Only process items for Hardware and Site Material.
                if (!IsNonInventoryRequest(dto.RequestType) &&
                    dto.Items != null)
                {
                    foreach (var itemDto in dto.Items)
                    {
                        if (itemDto.RequestedQuantity <= 0)
                        {
                            return BadRequest(
                                "Item quantity must be greater than zero.");
                        }

                        Inventory? inventory = null;

                        if (itemDto.InventoryId.HasValue)
                        {
                            inventory = await _context.Inventories
                                .FirstOrDefaultAsync(x =>
                                    x.Id == itemDto.InventoryId.Value);

                            if (inventory == null)
                            {
                                return BadRequest(
                                    $"Inventory item {itemDto.InventoryId} was not found.");
                            }
                        }

                        var itemName = inventory?.ItemName ??
                                       itemDto.ItemName?.Trim();

                        if (string.IsNullOrWhiteSpace(itemName))
                            return BadRequest("Item name is required.");

                        request.Items.Add(new HardwareRequestItem
                        {
                            Id = Guid.NewGuid(),

                            InventoryId = inventory?.Id,

                            ItemName = itemName,
                            ItemCode = inventory?.ItemCode ?? itemDto.ItemCode,
                            Description = itemDto.Description,
                            Unit = inventory?.Unit ?? itemDto.Unit,

                            RequestedQuantity = itemDto.RequestedQuantity,
                            ApprovedQuantity = 0,
                            IssuedQuantity = 0,
                            ReservedQuantity = 0,

                            Status = "Pending",
                            Remarks = itemDto.Remarks
                        });
                    }
                }

                _context.HardwareRequests.Add(request);

                await _context.SaveChangesAsync();

                var requesterName = await _context.Users
                    .Where(x => x.Id == currentUserId.Value)
                    .Select(x => x.FullName)
                    .FirstOrDefaultAsync() ?? "An employee";

                await NotifyHodsAsync(
                    request,
                    $"New {GetTypeLabel(request.RequestType)} Request",
                    $"{requesterName} submitted a new {GetTypeLabel(request.RequestType).ToLower()} request: {request.Subject}.",
                    "HardwareRequest"
                );

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = "Request submitted successfully.",
                    requestId = request.Id,
                    status = request.Status,
                    requestType = request.RequestType,
                    responsibleDepartment = responsibleDepartment.Name
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message = "Failed to create request.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // 6. GET MY REQUESTS
        // GET: api/HardwareRequest/MyRequests
        // =========================================================

        [HttpGet("MyRequests")]
        public async Task<IActionResult> GetMyRequests()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var requests = await RequestQuery()
                .Where(x => x.RequestedById == currentUserId.Value)
                .OrderByDescending(x => x.NeededBy)
                .ThenByDescending(x => x.Id)
                .Select(x => new
                {
                    x.Id,
                    x.RequestType,
                    x.Subject,
                    x.Description,
                    x.Priority,
                    x.Status,

                    // Bug Report Information
                    x.AffectedModule,
                    x.BugCategory,
                    x.StepsToReproduce,
                    x.ExpectedResult,
                    x.ActualResult,

                    x.ResponsibleDepartmentId,
                    ResponsibleDepartment = x.ResponsibleDepartment != null
                        ? x.ResponsibleDepartment.Name
                        : null,

                    x.ProjectId,

                    ProjectName = x.Project != null
    ? x.Project.ProjectTitle
    : x.ProjectName,

                    Project = x.Project == null
    ? null
    : new
    {
        x.Project.Id,
        x.Project.ProjectCode,
        x.Project.ProjectTitle,
        x.Project.Status
    },
                    x.SiteName,
                    x.Location,
                    x.LocationDetails,
                    x.NeededBy,
                    x.ApprovedAt,
                    x.CompletedAt,
                    x.AdminRemarks,
                    x.RejectionReason,

                    RequestedBy = x.RequestedBy != null
                        ? x.RequestedBy.FullName
                        : null,

                    AssignedTo = x.AssignedTo != null
                        ? x.AssignedTo.FullName
                        : null,

                    Items = x.Items.Select(i => new
                    {
                        i.Id,
                        i.InventoryId,
                        i.ItemName,
                        i.ItemCode,
                        i.Description,
                        i.Unit,
                        i.RequestedQuantity,
                        i.ApprovedQuantity,
                        i.IssuedQuantity,
                        i.ReservedQuantity,
                        i.Status,
                        i.Remarks
                    })
                })
                .ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // 7. GET ALL REQUESTS
        // GET: api/HardwareRequest/All
        // =========================================================

        [HttpGet("All")]
        public async Task<IActionResult> GetAll()
        {
            if (!IsRequestManager())
                return Forbid();

            var requests = await RequestQuery()
                .OrderByDescending(x => x.Id)
                .Select(x => new
                {
                    x.Id,
                    x.RequestType,
                    x.Subject,
                    x.Description,
                    x.Priority,
                    x.Status,

                    // Bug Report Information
                    x.AffectedModule,
                    x.BugCategory,
                    x.StepsToReproduce,
                    x.ExpectedResult,
                    x.ActualResult,

                    x.ResponsibleDepartmentId,
                    ResponsibleDepartment = x.ResponsibleDepartment != null
                        ? x.ResponsibleDepartment.Name
                        : null,

                    x.ProjectId,

                    ProjectName = x.Project != null
    ? x.Project.ProjectTitle
    : x.ProjectName,

                    Project = x.Project == null
    ? null
    : new
    {
        x.Project.Id,
        x.Project.ProjectCode,
        x.Project.ProjectTitle,
        x.Project.Status
    },
                    x.SiteName,
                    x.Location,
                    x.LocationDetails,
                    x.NeededBy,
                    x.ApprovedAt,
                    x.CompletedAt,
                    x.AdminRemarks,
                    x.RejectionReason,

                    RequestedById = x.RequestedById,

                    RequestedBy = x.RequestedBy != null
                        ? x.RequestedBy.FullName
                        : null,

                    ApprovedBy = x.ApprovedBy != null
                        ? x.ApprovedBy.FullName
                        : null,

                    AssignedToId = x.AssignedToId,

                    AssignedTo = x.AssignedTo != null
                        ? x.AssignedTo.FullName
                        : null,

                    Items = x.Items.Select(i => new
                    {
                        i.Id,
                        i.InventoryId,
                        i.ItemName,
                        i.ItemCode,
                        i.Description,
                        i.Unit,
                        i.RequestedQuantity,
                        i.ApprovedQuantity,
                        i.IssuedQuantity,
                        i.ReservedQuantity,
                        i.Status,
                        i.Remarks
                    })
                })
                .ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // 8. GET REQUEST DETAILS
        // GET: api/HardwareRequest/{id}
        // =========================================================

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await RequestQuery()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            var isRequester =
                request.RequestedById == currentUserId.Value;

            var canManage = await CanManageRequestAsync(
                request,
                currentUserId.Value
            );

            var isAssignedStaff =
                request.AssignedToId == currentUserId.Value;

            if (!isRequester && !canManage && !isAssignedStaff)
                return Forbid();

            return Ok(new
            {
                request.Id,
                request.RequestType,
                request.Subject,
                request.Description,
                request.Priority,
                request.Status,

                // Bug Report Information
                request.AffectedModule,
                request.BugCategory,
                request.StepsToReproduce,
                request.ExpectedResult,
                request.ActualResult,

                request.ResponsibleDepartmentId,
                ResponsibleDepartment =
                    request.ResponsibleDepartment?.Name,

                request.ProjectId,
                ProjectName = request.Project?.ProjectTitle ?? request.ProjectName,

                Project = request.Project == null
    ? null
    : new
    {
        request.Project.Id,
        request.Project.ProjectCode,
        request.Project.ProjectTitle,
        request.Project.Status
    },
                request.SiteName,
                request.Location,
                request.LocationDetails,
                request.NeededBy,
                request.ApprovedAt,
                request.CompletedAt,
                request.AdminRemarks,
                request.RejectionReason,

                RequestedById = request.RequestedById,
                RequestedBy = request.RequestedBy?.FullName,

                ApprovedBy = request.ApprovedBy?.FullName,

                AssignedToId = request.AssignedToId,
                AssignedTo = request.AssignedTo?.FullName,

                Items = request.Items.Select(i => new
                {
                    i.Id,
                    i.InventoryId,
                    i.ItemName,
                    i.ItemCode,
                    i.Description,
                    i.Unit,
                    i.RequestedQuantity,
                    i.ApprovedQuantity,
                    i.IssuedQuantity,
                    i.ReservedQuantity,
                    i.Status,
                    i.Remarks,

                    AvailableStock = i.Inventory == null
                        ? (decimal?)null
                        : i.Inventory.Quantity -
                          i.Inventory.ReservedQuantity
                })
            });
        }

        // =========================================================
        // 9. APPROVE REQUEST AND RESERVE STOCK
        // POST: api/HardwareRequest/{id}/Approve
        // =========================================================


        [HttpPost("{id:guid}/Approve")]
        public async Task<IActionResult> Approve(
            Guid id,
            [FromBody] ApproveHardwareRequestDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var request = await _context.HardwareRequests
                    .Include(x => x.Items)
                    .ThenInclude(x => x.Inventory)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (request == null)
                    return NotFound("Request not found.");

                if (!await CanManageRequestAsync(request, currentUserId.Value))
                    return Forbid();

                if (request.Status != "Pending")
                    return BadRequest("Only pending requests can be approved.");

                // ==========================================
                // IT SUPPORT / BUG REPORT APPROVAL
                // ==========================================

                if (IsNonInventoryRequest(request.RequestType))
                {
                    var assignedToId = dto.AssignedToId ?? currentUserId.Value;

                    var supportAssignedStaff = await _context.Users
                        .FirstOrDefaultAsync(x =>
                            x.Id == assignedToId &&
                            x.IsActive &&
                            x.Status == "Approved");

                    if (supportAssignedStaff == null)
                    {
                        return BadRequest(
                            "Assigned staff was not found or is inactive.");
                    }

                    request.Status = "Approved";
                    request.ApprovedById = currentUserId.Value;
                    request.ApprovedAt = DateTimeHelper.Now();
                    request.AdminRemarks = dto.Remarks;
                    request.AssignedToId = supportAssignedStaff.Id;

                    await _context.SaveChangesAsync();

                    var isBugReport = request.RequestType == "BugReport";

                    // Notify assigned staff.
                    await NotifyUserAsync(
                        supportAssignedStaff.Id,
                        isBugReport
                            ? "New Bug Report Assigned"
                            : "New IT Support Request Assigned",
                        isBugReport
                            ? $"You have been assigned to bug report '{request.Subject}'."
                            : $"You have been assigned to IT support request '{request.Subject}'.",
                        "HardwareRequest",
                        request.Id
                    );

                    // Notify requester.
                    await NotifyRequesterAsync(
                        request,
                        isBugReport
                            ? "Bug Report Accepted"
                            : "IT Support Request Approved",
                        isBugReport
                            ? $"Your bug report '{request.Subject}' has been accepted and assigned for investigation."
                            : $"Your IT support request '{request.Subject}' has been approved.",
                        "Approval"
                    );

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        success = true,
                        message = isBugReport
                            ? $"Bug report accepted and assigned to {supportAssignedStaff.FullName}."
                            : $"IT support request approved and assigned to {supportAssignedStaff.FullName}.",
                        status = request.Status,
                        assignedTo = supportAssignedStaff.FullName
                    });
                }

                // ==========================================
                // HARDWARE / SITE MATERIAL APPROVAL
                // ==========================================

                foreach (var item in request.Items)
                {
                    var approval = dto.Items?
                        .FirstOrDefault(x => x.RequestItemId == item.Id);

                    var approvedQuantity = approval?.ApprovedQuantity
                                           ?? item.RequestedQuantity;

                    if (approvedQuantity < 0 ||
                        approvedQuantity > item.RequestedQuantity)
                    {
                        return BadRequest(
                            $"Invalid approved quantity for {item.ItemName}.");
                    }

                    // Reserve inventory stock.
                    if (item.InventoryId.HasValue && approvedQuantity > 0)
                    {
                        var inventory = item.Inventory;

                        if (inventory == null)
                        {
                            return BadRequest(
                                $"Inventory item for {item.ItemName} was not found.");
                        }

                        var availableStock =
                            inventory.Quantity - inventory.ReservedQuantity;

                        if (approvedQuantity > availableStock)
                        {
                            return BadRequest(new
                            {
                                message = $"Insufficient stock for {item.ItemName}.",
                                requested = item.RequestedQuantity,
                                approved = approvedQuantity,
                                available = availableStock
                            });
                        }

                        inventory.ReservedQuantity += approvedQuantity;
                        item.ReservedQuantity = approvedQuantity;
                    }

                    item.ApprovedQuantity = approvedQuantity;

                    item.Status = approvedQuantity == 0
                        ? "Rejected"
                        : "Approved";

                    item.Remarks = approval?.Remarks ?? item.Remarks;
                }

                // ==========================================
                // SET REQUEST STATUS
                // ==========================================

                request.Status = request.Items.Any(
                    x => x.ApprovedQuantity > 0)
                    ? "Approved"
                    : "Rejected";

                request.ApprovedById = currentUserId.Value;
                request.ApprovedAt = DateTimeHelper.Now();
                request.AdminRemarks = dto.Remarks;

                // ==========================================
                // ASSIGN STAFF IF APPROVED
                // ==========================================

                User? assignedStaff = null;

                if (request.Status == "Approved")
                {
                    var assignedToId = dto.AssignedToId ?? currentUserId.Value;

                    assignedStaff = await _context.Users
                        .FirstOrDefaultAsync(x =>
                            x.Id == assignedToId &&
                            x.IsActive &&
                            x.Status == "Approved");

                    if (assignedStaff == null)
                    {
                        return BadRequest(
                            "Assigned staff was not found or is inactive.");
                    }

                    request.AssignedToId = assignedStaff.Id;
                }

                await _context.SaveChangesAsync();

                // ==========================================
                // NOTIFY ASSIGNED STAFF
                // ==========================================

                if (assignedStaff != null)
                {
                    await NotifyUserAsync(
                        assignedStaff.Id,
                        "New Request Assigned",
                        $"You have been assigned to request '{request.Subject}'.",
                        "HardwareRequest",
                        request.Id
                    );
                }

                // ==========================================
                // NOTIFY REQUESTER
                // ==========================================

                await NotifyRequesterAsync(
                    request,
                    request.Status == "Approved"
                        ? "Request Approved"
                        : "Request Rejected",

                    request.Status == "Approved"
                        ? $"Your request '{request.Subject}' has been approved."
                        : $"Your request '{request.Subject}' was rejected because no quantities were approved.",

                    request.Status == "Approved"
                        ? "Approval"
                        : "Rejection"
                );

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = request.Status == "Approved"
                        ? $"Request approved and assigned to {assignedStaff?.FullName}. Stock reserved."
                        : "All requested quantities were rejected.",
                    status = request.Status,
                    assignedTo = assignedStaff?.FullName
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message = "Failed to approve request.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // 10. REJECT REQUEST
        // POST: api/HardwareRequest/{id}/Reject
        // =========================================================

        [HttpPost("{id:guid}/Reject")]
        public async Task<IActionResult> Reject(
            Guid id,
            [FromBody] RejectHardwareRequestDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await _context.HardwareRequests
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            if (!await CanManageRequestAsync(request, currentUserId.Value))
                return Forbid();

            if (request.Status != "Pending")
                return BadRequest("Only pending requests can be rejected.");

            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest("Rejection reason is required.");

            request.Status = "Rejected";
            request.RejectionReason = dto.Reason.Trim();
            request.ApprovedById = currentUserId.Value;
            request.ApprovedAt = DateTimeHelper.Now();

            await _context.SaveChangesAsync();

            await NotifyRequesterAsync(
                request,
                request.RequestType == "BugReport"
                    ? "Bug Report Rejected"
                    : "Request Rejected",
                $"Your {GetTypeLabel(request.RequestType).ToLower()} '{request.Subject}' has been rejected. Reason: {request.RejectionReason}",
                "Rejection"
            );

            return Ok(new
            {
                success = true,
                message = "Request rejected."
            });
        }

        // =========================================================
        // 11. ASSIGN REQUEST TO STAFF
        // POST: api/HardwareRequest/{id}/Assign
        // =========================================================

        [HttpPost("{id:guid}/Assign")]
        public async Task<IActionResult> Assign(
            Guid id,
            [FromBody] AssignHardwareRequestDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var request = await _context.HardwareRequests
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            if (!await CanManageRequestAsync(request, currentUserId.Value))
                return Forbid();

            if (request.Status == "Rejected" ||
                request.Status == "Cancelled" ||
                request.Status == "Resolved")
            {
                return BadRequest("This request cannot be assigned.");
            }

            var staff = await _context.Users
                .FirstOrDefaultAsync(x =>
                    x.Id == dto.AssignedToId &&
                    x.IsActive &&
                    x.Status == "Approved");

            if (staff == null)
                return BadRequest(
                    "Assigned staff was not found or is inactive.");

            request.AssignedToId = dto.AssignedToId;

            await _context.SaveChangesAsync();

            await NotifyUserAsync(
                staff.Id,
                request.RequestType == "BugReport"
                    ? "Bug Report Assigned"
                    : "New Request Assigned",
                $"You have been assigned to {GetTypeLabel(request.RequestType).ToLower()} '{request.Subject}'.",
                "HardwareRequest",
                request.Id
            );

            await NotifyRequesterAsync(
                request,
                "Request Assigned",
                $"Your {GetTypeLabel(request.RequestType).ToLower()} '{request.Subject}' has been assigned to {staff.FullName}.",
                "HardwareRequest"
            );

            return Ok(new
            {
                success = true,
                message = "Request assigned successfully.",
                assignedTo = staff.FullName
            });
        }

        // =========================================================
        // 12. ISSUE STOCK
        // POST: api/HardwareRequest/{id}/Issue
        // =========================================================

        [HttpPost("{id:guid}/Issue")]
        public async Task<IActionResult> Issue(
            Guid id,
            [FromBody] IssueHardwareRequestDto dto)
        {
            if (!IsRequestManager())
                return Forbid();

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var request = await _context.HardwareRequests
                    .Include(x => x.Items)
                    .ThenInclude(x => x.Inventory)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (request == null)
                    return NotFound("Request not found.");

                if (IsNonInventoryRequest(request.RequestType))
                {
                    return BadRequest(
                        $"{GetTypeLabel(request.RequestType)} requests do not use the stock issuing process.");
                }

                if (request.Status != "Approved" &&
                    request.Status != "PartiallyIssued")
                {
                    return BadRequest(
                        "Only approved requests can have items issued.");
                }

                if (dto.Items == null || !dto.Items.Any())
                    return BadRequest("Please provide the items to issue.");

                foreach (var issueDto in dto.Items)
                {
                    var item = request.Items.FirstOrDefault(
                        x => x.Id == issueDto.RequestItemId);

                    if (item == null)
                        return BadRequest("Request item not found.");

                    if (issueDto.IssuedQuantity <= 0)
                        return BadRequest(
                            "Issued quantity must be greater than zero.");

                    var remainingApproved =
                        item.ApprovedQuantity - item.IssuedQuantity;

                    if (issueDto.IssuedQuantity > remainingApproved)
                    {
                        return BadRequest(
                            $"Cannot issue more than the approved remaining quantity for {item.ItemName}.");
                    }

                    if (item.InventoryId.HasValue)
                    {
                        var inventory = item.Inventory;

                        if (inventory == null)
                        {
                            return BadRequest(
                                $"Inventory record for {item.ItemName} was not found.");
                        }

                        if (issueDto.IssuedQuantity > item.ReservedQuantity ||
                            issueDto.IssuedQuantity > inventory.ReservedQuantity)
                        {
                            return BadRequest(
                                $"Reserved stock is insufficient for {item.ItemName}.");
                        }

                        if (issueDto.IssuedQuantity > inventory.Quantity)
                        {
                            return BadRequest(
                                $"Physical stock is insufficient for {item.ItemName}.");
                        }

                        inventory.Quantity -= issueDto.IssuedQuantity;
                        inventory.ReservedQuantity -= issueDto.IssuedQuantity;
                        item.ReservedQuantity -= issueDto.IssuedQuantity;
                    }

                    item.IssuedQuantity += issueDto.IssuedQuantity;

                    item.Status =
                        item.IssuedQuantity >= item.ApprovedQuantity
                            ? "Issued"
                            : "PartiallyIssued";

                    item.Remarks = issueDto.Remarks ?? item.Remarks;
                }

                var allIssued = request.Items.All(x =>
                    x.IssuedQuantity >= x.ApprovedQuantity);

                request.Status = allIssued
                    ? "Issued"
                    : "PartiallyIssued";

                if (allIssued)
                    request.CompletedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();

                await NotifyRequesterAsync(
                    request,
                    "Items Issued",
                    allIssued
                        ? $"All approved items for '{request.Subject}' have been issued."
                        : $"Some items for '{request.Subject}' have been issued.",
                    "HardwareRequest"
                );

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = allIssued
                        ? "All approved items have been issued."
                        : "Items issued. Some approved quantities are still pending.",
                    status = request.Status
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message = "Failed to issue items.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // 13. UPDATE IT SUPPORT / BUG REPORT STATUS
        // POST: api/HardwareRequest/{id}/UpdateStatus
        // =========================================================

        [HttpPost("{id:guid}/UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(
            Guid id,
            [FromBody] UpdateHardwareRequestStatusDto dto)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var allowedStatuses = new[]
            {
                "InProgress",
                "Resolved"
            };

            if (!allowedStatuses.Contains(dto.Status))
                return BadRequest("Invalid status.");

            var request = await _context.HardwareRequests
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            // This endpoint is only for IT Support and Bug Reports.
            if (!IsNonInventoryRequest(request.RequestType))
            {
                return BadRequest(
                    "This status update endpoint is for IT support and bug report requests.");
            }

            var canManage = await CanManageRequestAsync(
                request,
                currentUserId.Value
            );

            var isAssignedStaff =
                request.AssignedToId == currentUserId.Value;

            if (!canManage && !isAssignedStaff)
                return Forbid();

            if (request.Status == "Rejected" ||
                request.Status == "Cancelled" ||
                request.Status == "Resolved")
            {
                return BadRequest("This request cannot be updated.");
            }

            if (request.Status != "Approved" &&
                request.Status != "InProgress")
            {
                return BadRequest(
                    "Only approved or in-progress requests can be updated.");
            }

            request.Status = dto.Status;

            if (!string.IsNullOrWhiteSpace(dto.Remarks))
                request.AdminRemarks = dto.Remarks.Trim();

            if (dto.Status == "Resolved")
                request.CompletedAt = DateTimeHelper.Now();

            await _context.SaveChangesAsync();

            var isBugReport = request.RequestType == "BugReport";

            await NotifyRequesterAsync(
                request,
                dto.Status == "Resolved"
                    ? (isBugReport
                        ? "Bug Report Resolved"
                        : "IT Support Request Resolved")
                    : (isBugReport
                        ? "Bug Report In Progress"
                        : "IT Support Request In Progress"),

                dto.Status == "Resolved"
                    ? $"Your {GetTypeLabel(request.RequestType).ToLower()} '{request.Subject}' has been resolved."
                    : $"Your {GetTypeLabel(request.RequestType).ToLower()} '{request.Subject}' is now in progress.",

                "HardwareRequest"
            );

            return Ok(new
            {
                success = true,
                message = $"{GetTypeLabel(request.RequestType)} status updated.",
                status = request.Status
            });
        }

        // =========================================================
        // 14. CANCEL REQUEST
        // POST: api/HardwareRequest/{id}/Cancel
        // =========================================================

        [HttpPost("{id:guid}/Cancel")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var request = await _context.HardwareRequests
                    .Include(x => x.Items)
                    .ThenInclude(x => x.Inventory)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (request == null)
                    return NotFound("Request not found.");

                if (!IsRequestManager() &&
                    request.RequestedById != currentUserId.Value)
                {
                    return Forbid();
                }

                if (request.Status == "Issued" ||
                    request.Status == "Resolved" ||
                    request.Status == "Rejected" ||
                    request.Status == "Cancelled")
                {
                    return BadRequest(
                        "This request can no longer be cancelled.");
                }

                foreach (var item in request.Items)
                {
                    if (item.Inventory != null &&
                        item.ReservedQuantity > 0)
                    {
                        item.Inventory.ReservedQuantity -=
                            item.ReservedQuantity;

                        item.ReservedQuantity = 0;
                        item.Status = "Cancelled";
                    }
                }

                request.Status = "Cancelled";

                await _context.SaveChangesAsync();

                if (request.AssignedToId.HasValue &&
                    request.AssignedToId.Value != currentUserId.Value)
                {
                    await NotifyUserAsync(
                        request.AssignedToId.Value,
                        "Request Cancelled",
                        $"{GetTypeLabel(request.RequestType)} '{request.Subject}' has been cancelled.",
                        "HardwareRequest",
                        request.Id
                    );
                }

                await NotifyHodsAsync(
                    request,
                    "Request Cancelled",
                    $"{GetTypeLabel(request.RequestType)} '{request.Subject}' has been cancelled.",
                    "HardwareRequest"
                );

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = "Request cancelled and reserved stock released."
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message = "Failed to cancel request.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // 15. GET INCOMING REQUESTS
        // GET: api/HardwareRequest/Incoming
        // =========================================================

        [HttpGet("Incoming")]
        public async Task<IActionResult> GetIncomingRequests()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var query = RequestQuery();

            if (!IsRequestManager())
            {
                query = query.Where(x =>
                    x.AssignedToId == currentUserId.Value

                    ||

                    (
                        x.ResponsibleDepartmentId.HasValue &&
                        _context.Departments.Any(d =>
                            d.Id == x.ResponsibleDepartmentId.Value &&
                            d.IsActive &&
                            d.HodId == currentUserId.Value
                        )
                    )
                );
            }

            var requests = await query
                .Where(x => x.Status != "Draft")
                .OrderByDescending(x => x.Id)
                .Select(x => new
                {
                    x.Id,
                    x.RequestType,
                    x.Subject,
                    x.Description,
                    x.Priority,
                    x.Status,

                    // Bug Report Information
                    x.AffectedModule,
                    x.BugCategory,
                    x.StepsToReproduce,
                    x.ExpectedResult,
                    x.ActualResult,

                    x.ResponsibleDepartmentId,

                    ResponsibleDepartment = x.ResponsibleDepartment != null
                        ? x.ResponsibleDepartment.Name
                        : null,

                    x.ProjectId,

                    ProjectName = x.Project != null
    ? x.Project.ProjectTitle
    : x.ProjectName,

                    Project = x.Project == null
    ? null
    : new
    {
        x.Project.Id,
        x.Project.ProjectCode,
        x.Project.ProjectTitle,
        x.Project.Status
    },
                    x.SiteName,
                    x.Location,
                    x.LocationDetails,
                    x.NeededBy,
                    x.ApprovedAt,
                    x.CompletedAt,
                    x.AdminRemarks,
                    x.RejectionReason,

                    RequestedById = x.RequestedById,

                    RequestedBy = x.RequestedBy != null
                        ? x.RequestedBy.FullName
                        : null,

                    ApprovedBy = x.ApprovedBy != null
                        ? x.ApprovedBy.FullName
                        : null,

                    AssignedToId = x.AssignedToId,

                    AssignedTo = x.AssignedTo != null
                        ? x.AssignedTo.FullName
                        : null,

                    Items = x.Items.Select(i => new
                    {
                        i.Id,
                        i.InventoryId,
                        i.ItemName,
                        i.ItemCode,
                        i.Description,
                        i.Unit,
                        i.RequestedQuantity,
                        i.ApprovedQuantity,
                        i.IssuedQuantity,
                        i.ReservedQuantity,
                        i.Status,
                        i.Remarks
                    })
                })
                .ToListAsync();

            return Ok(requests);
        }
    }
}
