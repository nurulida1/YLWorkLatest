
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

        // Existing manager roles retain their permissions.
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
                .Include(x => x.ResponsibleDepartment);
        }

        // =========================================================
        // 2. DEPARTMENT ROUTING
        // =========================================================

        // Change these names if your Department.Name values differ.
        private string? GetResponsibleDepartment(string requestType)
        {
            return requestType switch
            {
                "Hardware" => "IT",
                "ITSupport" => "IT",
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
            // Admin, IT and Inventory retain existing access.
            if (IsRequestManager())
                return true;

            if (!request.ResponsibleDepartmentId.HasValue)
                return false;

            // Only the HOD of the responsible department
            // can manage this request.
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

            // Do not notify the requester if they are also the HOD.
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
                "Hardware" => "Hardware",
                _ => "Hardware"
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
                "ITSupport"
            };

            if (!allowedTypes.Contains(dto.RequestType))
                return BadRequest("Invalid request type.");

            if (string.IsNullOrWhiteSpace(dto.Subject))
                return BadRequest("Subject is required.");

            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest("Description is required.");

            if (dto.RequestType != "ITSupport" &&
                (dto.Items == null || !dto.Items.Any()))
            {
                return BadRequest(
                    "Please add at least one item for hardware or site material requests.");
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

                    // Department routing
                    ResponsibleDepartmentId = responsibleDepartment.Id,

                    ProjectId = dto.ProjectId,
                    ProjectName = dto.ProjectName,
                    SiteName = dto.SiteName,
                    Location = dto.Location,
                    LocationDetails = dto.LocationDetails,
                    NeededBy = dto.NeededBy,

                    Items = new List<HardwareRequestItem>()
                };

                if (dto.Items != null)
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

                // Notify the responsible HOD.
                await NotifyHodsAsync(
                    request,
                    $"New {GetTypeLabel(request.RequestType)} Request",
                    $"{requesterName} submitted a new request: {request.Subject}.",
                    "HardwareRequest"
                );

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = "Request submitted successfully.",
                    requestId = request.Id,
                    status = request.Status,
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

                    x.ResponsibleDepartmentId,
                    ResponsibleDepartment = x.ResponsibleDepartment != null
                        ? x.ResponsibleDepartment.Name
                        : null,

                    x.ProjectId,
                    x.ProjectName,
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

                    x.ResponsibleDepartmentId,
                    ResponsibleDepartment = x.ResponsibleDepartment != null
                        ? x.ResponsibleDepartment.Name
                        : null,

                    x.ProjectId,
                    x.ProjectName,
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

            // Check whether the current user is:
            // 1. The original requester
            // 2. An authorized manager or responsible HOD
            // 3. The staff member assigned to this request
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

                request.ResponsibleDepartmentId,
                ResponsibleDepartment =
                    request.ResponsibleDepartment?.Name,

                request.ProjectId,
                request.ProjectName,
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

                // Manager or responsible HOD.
                if (!await CanManageRequestAsync(request, currentUserId.Value))
                    return Forbid();

                if (request.Status != "Pending")
                    return BadRequest("Only pending requests can be approved.");

                // ==========================================
                // IT SUPPORT APPROVAL
                // ==========================================

                if (request.RequestType == "ITSupport")
                {
                    var assignedToId = dto.AssignedToId ?? currentUserId.Value;

                    var itAssignedStaff = await _context.Users
                        .FirstOrDefaultAsync(x =>
                            x.Id == assignedToId &&
                            x.IsActive &&
                            x.Status == "Approved");

                    if (itAssignedStaff == null)
                    {
                        return BadRequest(
                            "Assigned staff was not found or is inactive.");
                    }

                    request.Status = "Approved";
                    request.ApprovedById = currentUserId.Value;
                    request.ApprovedAt = DateTimeHelper.Now();
                    request.AdminRemarks = dto.Remarks;
                    request.AssignedToId = itAssignedStaff.Id;

                    await _context.SaveChangesAsync();

                    await NotifyUserAsync(
                        itAssignedStaff.Id,
                        "New Request Assigned",
                        $"You have been assigned to IT support request '{request.Subject}'.",
                        "HardwareRequest",
                        request.Id
                    );

                    await NotifyRequesterAsync(
                        request,
                        "IT Support Request Approved",
                        $"Your IT support request '{request.Subject}' has been approved.",
                        "Approval"
                    );

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        success = true,
                        message = $"IT support request approved and assigned to {itAssignedStaff.FullName}.",
                        status = request.Status,
                        assignedTo = itAssignedStaff.FullName
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

                User? assignedStaff = null;

                // ==========================================
                // ASSIGN STAFF IF APPROVED
                // ==========================================

                if (request.Status == "Approved")
                {
                    // If no staff is selected, assign to the approver.
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
                // NOTIFY REQUESTER (ONLY ONCE)
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
                return BadRequest(
                    "Only pending requests can be rejected.");

            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest("Rejection reason is required.");

            request.Status = "Rejected";
            request.RejectionReason = dto.Reason.Trim();
            request.ApprovedById = currentUserId.Value;
            request.ApprovedAt = DateTimeHelper.Now();

            await _context.SaveChangesAsync();

            await NotifyRequesterAsync(
                request,
                "Request Rejected",
                $"Your request '{request.Subject}' has been rejected. Reason: {request.RejectionReason}",
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
                return BadRequest(
                    "This request cannot be assigned.");
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
                "New Request Assigned",
                $"You have been assigned to request '{request.Subject}'.",
                "HardwareRequest",
                request.Id
            );

            await NotifyRequesterAsync(
                request,
                "Request Assigned",
                $"Your request '{request.Subject}' has been assigned to {staff.FullName}.",
                "HardwareRequest"
            );

            return Ok(new
            {
                success = true,
                message = "Request assigned successfully."
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
            // Stock issuing remains restricted to existing managers.
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

                if (request.RequestType == "ITSupport")
                {
                    return BadRequest(
                        "IT support requests do not use the stock issuing process.");
                }

                if (request.Status != "Approved" &&
                    request.Status != "PartiallyIssued")
                {
                    return BadRequest(
                        "Only approved requests can have items issued.");
                }

                if (dto.Items == null || !dto.Items.Any())
                    return BadRequest(
                        "Please provide the items to issue.");

                foreach (var issueDto in dto.Items)
                {
                    var item = request.Items.FirstOrDefault(
                        x => x.Id == issueDto.RequestItemId);

                    if (item == null)
                        return BadRequest("Request item not found.");

                    if (issueDto.IssuedQuantity <= 0)
                    {
                        return BadRequest(
                            "Issued quantity must be greater than zero.");
                    }

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
        // 13. UPDATE IT SUPPORT STATUS
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

            // This endpoint is only for IT Support requests.
            if (request.RequestType != "ITSupport")
            {
                return BadRequest(
                    "This status update endpoint is for IT support requests.");
            }

            // Check whether the user is:
            // 1. An authorized manager
            // 2. The responsible HOD
            // 3. The staff member assigned to this request
            var canManage = await CanManageRequestAsync(
                request,
                currentUserId.Value
            );

            var isAssignedStaff =
                request.AssignedToId == currentUserId.Value;

            if (!canManage && !isAssignedStaff)
                return Forbid();

            // Prevent updates to closed requests.
            if (request.Status == "Rejected" ||
                request.Status == "Cancelled" ||
                request.Status == "Resolved")
            {
                return BadRequest(
                    "This request cannot be updated.");
            }

            request.Status = dto.Status;

            if (!string.IsNullOrWhiteSpace(dto.Remarks))
                request.AdminRemarks = dto.Remarks;

            if (dto.Status == "Resolved")
                request.CompletedAt = DateTimeHelper.Now();

            await _context.SaveChangesAsync();

            await NotifyRequesterAsync(
                request,
                dto.Status == "Resolved"
                    ? "IT Support Request Resolved"
                    : "IT Support Request In Progress",

                dto.Status == "Resolved"
                    ? $"Your IT support request '{request.Subject}' has been resolved."
                    : $"Your IT support request '{request.Subject}' is now in progress.",

                "HardwareRequest"
            );

            return Ok(new
            {
                success = true,
                message = "Request status updated.",
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

                // Notify assigned staff.
                if (request.AssignedToId.HasValue &&
                    request.AssignedToId.Value != currentUserId.Value)
                {
                    await NotifyUserAsync(
                        request.AssignedToId.Value,
                        "Request Cancelled",
                        $"Request '{request.Subject}' has been cancelled.",
                        "HardwareRequest",
                        request.Id
                    );
                }

                // Notify the responsible HOD.
                await NotifyHodsAsync(
                    request,
                    "Request Cancelled",
                    $"Request '{request.Subject}' has been cancelled.",
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
        // GET INCOMING REQUESTS
        // GET: api/HardwareRequest/Incoming
        // =========================================================

        [HttpGet("Incoming")]
        public async Task<IActionResult> GetIncomingRequests()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return Unauthorized();

            var query = RequestQuery();

            // Existing Admin, IT and Inventory managers
            // can view all incoming requests.
            if (!IsRequestManager())
            {
                query = query.Where(x =>
                    // Assigned staff can view their assigned requests.
                    x.AssignedToId == currentUserId.Value

                    ||

                    // Active HOD can view requests belonging to their department.
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

                    x.ResponsibleDepartmentId,

                    ResponsibleDepartment = x.ResponsibleDepartment != null
                        ? x.ResponsibleDepartment.Name
                        : null,

                    x.ProjectId,
                    x.ProjectName,
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
