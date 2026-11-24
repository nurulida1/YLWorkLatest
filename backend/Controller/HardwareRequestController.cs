
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Data;
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
        private readonly ILogger<HardwareRequestController> _logger;

        public HardwareRequestController(
            AppDbContext context,
            NotificationService notificationService,
            ILogger<HardwareRequestController> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
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
            return User.IsInRole("SuperAdmin") ||
                   User.IsInRole("Admin") ||
                   User.IsInRole("IT") ||
                   User.IsInRole("Inventory") ||
                   User.IsInRole("Logistic");
        }

        private bool IsInventoryRequest(string requestType)
        {
            return requestType == "Hardware" ||
                   requestType == "SiteMaterial";
        }

        private bool IsNonInventoryRequest(string requestType)
        {
            return requestType == "ITSupport" ||
                   requestType == "BugReport";
        }

        private IQueryable<HardwareRequest> RequestQuery()
        {
            return _context.HardwareRequests
                .Include(x => x.Items)
                    .ThenInclude(x => x.Inventory)
                .Include(x => x.RequestedBy)
                .Include(x => x.ApprovedBy)
                .Include(x => x.AssignedTo)
                .Include(x => x.ReceivedBy)
                .Include(x => x.ResponsibleDepartment)
                .Include(x => x.Project);
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
        // 3. AUTHORIZATION
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

        private bool CanApproveRequest(HardwareRequest request, Guid userId)
        {
            return User.IsInRole("SuperAdmin") ||
                   User.IsInRole("Admin") ||
                   request.ResponsibleDepartment?.HodId == userId;
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
            try
            {
                await _notificationService.CreateAsync(
                    userId,
                    title,
                    message,
                    type,
                    $"/hardware-request/{requestId}"
                );
            }
            catch (Exception ex)
            {
                // Notification failure must not undo a completed request action.
                _logger.LogError(
                    ex,
                    "Failed to send notification to user {UserId} for request {RequestId}",
                    userId,
                    requestId);
            }
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
            if (IsInventoryRequest(dto.RequestType) &&
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

                if (IsInventoryRequest(dto.RequestType) &&
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
                await transaction.CommitAsync();

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

                _logger.LogError(ex, "Failed to create hardware request.");

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

                    x.AffectedModule,
                    x.BugCategory,
                    x.StepsToReproduce,
                    x.ExpectedResult,
                    x.ActualResult,

                    x.ReceivedById,
                    ReceivedBy = x.ReceivedBy != null
                        ? x.ReceivedBy.FullName
                        : null,
                    x.ReceivedAt,
                    x.ReceivedRemarks,

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

                    x.AffectedModule,
                    x.BugCategory,
                    x.StepsToReproduce,
                    x.ExpectedResult,
                    x.ActualResult,

                    x.ReceivedById,
                    ReceivedBy = x.ReceivedBy != null
                        ? x.ReceivedBy.FullName
                        : null,
                    x.ReceivedAt,
                    x.ReceivedRemarks,

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

                request.AffectedModule,
                request.BugCategory,
                request.StepsToReproduce,
                request.ExpectedResult,
                request.ActualResult,

                request.ReceivedById,
                ReceivedBy = request.ReceivedBy?.FullName,
                request.ReceivedAt,
                request.ReceivedRemarks,

                request.ResponsibleDepartmentId,
                ResponsibleDepartment = request.ResponsibleDepartment?.Name,

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
                        : (i.Inventory.Quantity ?? 0m) -
                          (i.Inventory.ReservedQuantity ?? 0m)
                })
            });
        }

        // =========================================================
        // 9. ASSIGN REQUEST TO STAFF
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
        // 10. UPDATE IT SUPPORT / BUG REPORT STATUS
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
        // 11. CANCEL REQUEST
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
                    if (item.ReservedQuantity > 0)
                    {
                        if (item.Inventory != null)
                        {
                            var inventoryReserved =
                                item.Inventory.ReservedQuantity ?? 0m;

                            if (inventoryReserved < item.ReservedQuantity)
                            {
                                throw new InvalidOperationException(
                                    $"Reserved stock is inconsistent for {item.ItemName}.");
                            }

                            item.Inventory.ReservedQuantity =
                                inventoryReserved - item.ReservedQuantity;
                        }

                        item.ReservedQuantity = 0;
                    }

                    // Preserve already-issued quantities.
                    item.Status =
                        item.ApprovedQuantity > 0 &&
                        item.IssuedQuantity >= item.ApprovedQuantity
                            ? "Issued"
                            : item.IssuedQuantity > 0
                                ? "PartiallyIssued"
                                : "Cancelled";
                }

                request.Status = "Cancelled";

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

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

                // If a manager cancels another employee's request,
                // notify the original requester.
                if (request.RequestedById != currentUserId.Value)
                {
                    await NotifyRequesterAsync(
                        request,
                        "Request Cancelled",
                        $"Your {GetTypeLabel(request.RequestType).ToLower()} request '{request.Subject}' has been cancelled.",
                        "HardwareRequest"
                    );
                }

                return Ok(new
                {
                    success = true,
                    message = "Request cancelled and reserved stock released."
                });
            }
            catch (InvalidOperationException ex)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                _logger.LogError(
                    ex,
                    "Failed to cancel hardware request {RequestId}",
                    id);

                return StatusCode(500, new
                {
                    message = "Failed to cancel request.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // 12. GET INCOMING REQUESTS
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
                    x.AssignedToId == currentUserId.Value ||
                    (
                        x.ResponsibleDepartmentId.HasValue &&
                        _context.Departments.Any(d =>
                            d.Id == x.ResponsibleDepartmentId.Value &&
                            d.IsActive &&
                            d.HodId == currentUserId.Value)
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

                    x.AffectedModule,
                    x.BugCategory,
                    x.StepsToReproduce,
                    x.ExpectedResult,
                    x.ActualResult,

                    x.ReceivedById,
                    ReceivedBy = x.ReceivedBy != null
                        ? x.ReceivedBy.FullName
                        : null,
                    x.ReceivedAt,
                    x.ReceivedRemarks,

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
        // 13. APPROVE REQUEST
        // POST: api/HardwareRequest/{id}/Approve
        // =========================================================

        [HttpPost("{id:guid}/Approve")]
        [Authorize(Roles = "SuperAdmin,Admin,HOD")]
        public async Task<IActionResult> Approve(
            Guid id,
            [FromBody] ApproveHardwareRequestDto dto)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var request = await _context.HardwareRequests
                .Include(x => x.Items)
                .Include(x => x.ResponsibleDepartment)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
                return NotFound("Hardware request not found.");

            if (request.Status != "Pending")
                return BadRequest("Only pending requests can be approved.");

            if (!CanApproveRequest(request, userId.Value))
                return Forbid();

            // IT Support and Bug Report can be approved without items.
            if (request.Items.Any())
            {
                if (dto.Items == null ||
                    dto.Items.Count != request.Items.Count)
                {
                    return BadRequest(
                        "Please provide approval quantities for all request items.");
                }

                if (dto.Items.Select(x => x.ItemId).Distinct().Count() !=
                    dto.Items.Count)
                {
                    return BadRequest(
                        "Duplicate request items were provided.");
                }

                foreach (var item in request.Items)
                {
                    var approvedDto = dto.Items
                        .FirstOrDefault(x => x.ItemId == item.Id);

                    if (approvedDto == null)
                    {
                        return BadRequest(
                            $"Approval quantity missing for {item.ItemName}.");
                    }

                    if (approvedDto.ApprovedQuantity < 0 ||
                        approvedDto.ApprovedQuantity > item.RequestedQuantity)
                    {
                        return BadRequest(
                            $"Invalid approved quantity for {item.ItemName}.");
                    }

                    item.ApprovedQuantity = approvedDto.ApprovedQuantity;

                    item.Status = approvedDto.ApprovedQuantity == 0
                        ? "Rejected"
                        : "Approved";
                }

                if (!request.Items.Any(x => x.ApprovedQuantity > 0))
                {
                    return BadRequest(
                        "At least one item must have an approved quantity greater than zero.");
                }
            }

            request.Status = "Approved";
            request.ApprovedById = userId.Value;
            request.ApprovedAt = DateTimeHelper.Now();
            request.AdminRemarks = dto.Remarks?.Trim();

            await _context.SaveChangesAsync();

            await NotifyRequesterAsync(
                request,
                "Request Approved",
                $"Your {GetTypeLabel(request.RequestType).ToLower()} request '{request.Subject}' has been approved.",
                "HardwareRequest"
            );

            return Ok(new
            {
                success = true,
                message = "Request approved successfully.",
                requestId = request.Id,
                status = request.Status
            });
        }

        // =========================================================
        // 14. REJECT REQUEST
        // POST: api/HardwareRequest/{id}/Reject
        // =========================================================

        [HttpPost("{id:guid}/Reject")]
        [Authorize(Roles = "SuperAdmin,Admin,HOD")]
        public async Task<IActionResult> Reject(
            Guid id,
            [FromBody] RejectHardwareRequestDto dto)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest("Rejection reason is required.");

            var request = await _context.HardwareRequests
                .Include(x => x.Items)
                .Include(x => x.ResponsibleDepartment)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
                return NotFound("Hardware request not found.");

            if (request.Status != "Pending")
                return BadRequest("Only pending requests can be rejected.");

            if (!CanApproveRequest(request, userId.Value))
                return Forbid();

            request.Status = "Rejected";
            request.ApprovedById = userId.Value;
            request.ApprovedAt = DateTimeHelper.Now();
            request.RejectionReason = dto.Reason.Trim();

            foreach (var item in request.Items)
            {
                item.ApprovedQuantity = 0;
                item.Status = "Rejected";
            }

            await _context.SaveChangesAsync();

            await NotifyRequesterAsync(
                request,
                "Request Rejected",
                $"Your {GetTypeLabel(request.RequestType).ToLower()} request '{request.Subject}' was rejected. Reason: {request.RejectionReason}",
                "HardwareRequest"
            );

            return Ok(new
            {
                success = true,
                message = "Request rejected successfully.",
                status = request.Status
            });
        }

        // =========================================================
        // 15. RESERVE STOCK
        // POST: api/HardwareRequest/{id}/Reserve
        // =========================================================

        [HttpPost("{id:guid}/Reserve")]
        [Authorize(Roles = "SuperAdmin,Admin,Logistic,Inventory")]
        public async Task<IActionResult> Reserve(Guid id)
        {
            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                var request = await _context.HardwareRequests
                    .Include(x => x.Items)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (request == null)
                    return NotFound("Hardware request not found.");

                if (!IsInventoryRequest(request.RequestType))
                {
                    return BadRequest(
                        "Stock reservation is only available for hardware and site material requests.");
                }

                if (!request.Items.Any())
                {
                    return BadRequest(
                        "This request does not contain hardware or material items.");
                }

                if (request.Status != "Approved" &&
                    request.Status != "PartiallyIssued")
                {
                    return BadRequest(
                        "Only approved or partially issued requests can reserve stock.");
                }

                var reservedItems = new List<object>();

                foreach (var item in request.Items)
                {
                    if (item.ApprovedQuantity <= 0)
                        continue;

                    // Manually entered items do not use inventory stock.
                    if (!item.InventoryId.HasValue)
                        continue;

                    var remainingToReserve =
                        item.ApprovedQuantity -
                        item.IssuedQuantity -
                        item.ReservedQuantity;

                    if (remainingToReserve <= 0)
                        continue;

                    var inventory = await _context.Inventories
                        .FirstOrDefaultAsync(x =>
                            x.Id == item.InventoryId.Value);

                    if (inventory == null)
                    {
                        throw new InvalidOperationException(
                            $"Inventory item {item.ItemName} was not found.");
                    }

                    var totalQuantity = inventory.Quantity ?? 0m;
                    var currentReserved = inventory.ReservedQuantity ?? 0m;
                    var available = totalQuantity - currentReserved;

                    if (available < remainingToReserve)
                    {
                        throw new InvalidOperationException(
                            $"Insufficient stock for {item.ItemName}. " +
                            $"Available: {available}, Required: {remainingToReserve}.");
                    }

                    inventory.ReservedQuantity =
                        currentReserved + remainingToReserve;

                    item.ReservedQuantity += remainingToReserve;
                    item.Status = "Reserved";

                    reservedItems.Add(new
                    {
                        item.ItemName,
                        ReservedQuantity = remainingToReserve
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (reservedItems.Any())
                {
                    await NotifyRequesterAsync(
                        request,
                        "Stock Reserved",
                        $"Stock has been reserved for your request '{request.Subject}'.",
                        "HardwareRequest"
                    );
                }

                return Ok(new
                {
                    success = true,
                    message = "Stock reservation completed.",
                    reservedItems
                });
            }
            catch (InvalidOperationException ex)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                _logger.LogError(
                    ex,
                    "Failed to reserve stock for request {RequestId}",
                    id);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to reserve inventory."
                });
            }
        }

        // =========================================================
        // 16. ISSUE ITEMS
        // POST: api/HardwareRequest/{id}/Issue
        // =========================================================

        [HttpPost("{id:guid}/Issue")]
        [Authorize(Roles = "SuperAdmin,Admin,Logistic,Inventory")]
        public async Task<IActionResult> Issue(
            Guid id,
            [FromBody] IssueHardwareRequestDto dto)
        {
            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                var request = await _context.HardwareRequests
                    .Include(x => x.Items)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (request == null)
                    return NotFound("Hardware request not found.");

                if (!IsInventoryRequest(request.RequestType))
                {
                    return BadRequest(
                        "Item issuance is only available for hardware and site material requests.");
                }

                if (!request.Items.Any())
                {
                    return BadRequest(
                        "This request does not contain hardware or material items.");
                }

                if (request.Status != "Approved" &&
                    request.Status != "PartiallyIssued")
                {
                    return BadRequest("Request is not ready for issuance.");
                }

                if (dto.Items == null || !dto.Items.Any())
                    return BadRequest("Please select at least one item to issue.");

                if (dto.Items.Select(x => x.ItemId).Distinct().Count() !=
                    dto.Items.Count)
                {
                    return BadRequest(
                        "Duplicate request items were provided.");
                }

                foreach (var issueDto in dto.Items)
                {
                    if (issueDto.IssuedQuantity <= 0)
                    {
                        throw new InvalidOperationException(
                            "Issued quantity must be greater than zero.");
                    }

                    var item = request.Items.FirstOrDefault(
                        x => x.Id == issueDto.ItemId);

                    if (item == null)
                    {
                        throw new InvalidOperationException(
                            "Request item not found.");
                    }

                    if (item.ApprovedQuantity <= 0)
                    {
                        throw new InvalidOperationException(
                            $"Item {item.ItemName} has no approved quantity.");
                    }

                    var remainingApproved =
                        item.ApprovedQuantity - item.IssuedQuantity;

                    if (issueDto.IssuedQuantity > remainingApproved)
                    {
                        throw new InvalidOperationException(
                            $"Cannot issue more than the approved quantity for {item.ItemName}.");
                    }

                    if (item.InventoryId.HasValue)
                    {
                        var inventory = await _context.Inventories
                            .FirstOrDefaultAsync(
                                x => x.Id == item.InventoryId.Value);

                        if (inventory == null)
                        {
                            throw new InvalidOperationException(
                                $"Inventory item {item.ItemName} was not found.");
                        }

                        var totalQuantity = inventory.Quantity ?? 0m;
                        var inventoryReserved =
                            inventory.ReservedQuantity ?? 0m;

                        if (issueDto.IssuedQuantity > item.ReservedQuantity)
                        {
                            throw new InvalidOperationException(
                                $"Please reserve sufficient stock for {item.ItemName} before issuing.");
                        }

                        if (issueDto.IssuedQuantity > inventoryReserved ||
                            issueDto.IssuedQuantity > totalQuantity)
                        {
                            throw new InvalidOperationException(
                                $"Insufficient reserved stock for {item.ItemName}.");
                        }

                        inventory.Quantity =
                            totalQuantity - issueDto.IssuedQuantity;

                        inventory.ReservedQuantity =
                            inventoryReserved - issueDto.IssuedQuantity;

                        item.ReservedQuantity -= issueDto.IssuedQuantity;
                    }

                    // Manual items can be issued without inventory deduction.
                    item.IssuedQuantity += issueDto.IssuedQuantity;

                    item.Status =
                        item.IssuedQuantity >= item.ApprovedQuantity
                            ? "Issued"
                            : "PartiallyIssued";
                }

                var allIssued = request.Items.All(
                    x => x.IssuedQuantity >= x.ApprovedQuantity);

                request.Status = allIssued
                    ? "Issued"
                    : "PartiallyIssued";

                request.AdminRemarks =
                    dto.Remarks ?? request.AdminRemarks;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await NotifyRequesterAsync(
                    request,
                    "Items Issued",
                    $"Items for your request '{request.Subject}' have been issued. Current status: {request.Status}.",
                    "HardwareRequest"
                );

                return Ok(new
                {
                    success = true,
                    message = "Items issued successfully.",
                    status = request.Status
                });
            }
            catch (InvalidOperationException ex)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                _logger.LogError(
                    ex,
                    "Failed to issue items for request {RequestId}",
                    id);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to issue items."
                });
            }
        }

        // =========================================================
        // 17. RELEASE RESERVATION
        // POST: api/HardwareRequest/{id}/ReleaseReservation
        // =========================================================

        [HttpPost("{id:guid}/ReleaseReservation")]
        [Authorize(Roles = "SuperAdmin,Admin,Logistic,Inventory")]
        public async Task<IActionResult> ReleaseReservation(Guid id)
        {
            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                var request = await _context.HardwareRequests
                    .Include(x => x.Items)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (request == null)
                    return NotFound("Hardware request not found.");

                if (!IsInventoryRequest(request.RequestType))
                {
                    return BadRequest(
                        "Reservation release is only available for hardware and site material requests.");
                }

                if (!request.Items.Any())
                {
                    return BadRequest(
                        "This request does not contain hardware or material items.");
                }

                if (request.Status != "Approved" &&
                    request.Status != "PartiallyIssued")
                {
                    return BadRequest(
                        "Only approved or partially issued requests can release reservations.");
                }

                var releasedItems = new List<object>();

                foreach (var item in request.Items)
                {
                    if (item.ReservedQuantity <= 0)
                        continue;

                    if (!item.InventoryId.HasValue)
                    {
                        item.ReservedQuantity = 0;

                        item.Status = item.IssuedQuantity > 0
                            ? "PartiallyIssued"
                            : "Approved";

                        releasedItems.Add(new
                        {
                            item.ItemName,
                            ReleasedQuantity = 0m
                        });

                        continue;
                    }

                    var inventory = await _context.Inventories
                        .FirstOrDefaultAsync(
                            x => x.Id == item.InventoryId.Value);

                    if (inventory == null)
                    {
                        throw new InvalidOperationException(
                            $"Inventory item {item.ItemName} was not found.");
                    }

                    var inventoryReserved =
                        inventory.ReservedQuantity ?? 0m;

                    if (inventoryReserved < item.ReservedQuantity)
                    {
                        throw new InvalidOperationException(
                            $"Reserved stock is inconsistent for {item.ItemName}.");
                    }

                    var releasedQuantity = item.ReservedQuantity;

                    inventory.ReservedQuantity =
                        inventoryReserved - releasedQuantity;

                    item.ReservedQuantity = 0;

                    item.Status = item.IssuedQuantity > 0
                        ? "PartiallyIssued"
                        : "Approved";

                    releasedItems.Add(new
                    {
                        item.ItemName,
                        ReleasedQuantity = releasedQuantity
                    });
                }

                request.Status = request.Items.Any(
                    x => x.IssuedQuantity > 0)
                        ? "PartiallyIssued"
                        : "Approved";

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (releasedItems.Any())
                {
                    await NotifyRequesterAsync(
                        request,
                        "Stock Reservation Released",
                        $"The stock reservation for your request '{request.Subject}' has been released.",
                        "HardwareRequest"
                    );
                }

                return Ok(new
                {
                    success = true,
                    message = "Reserved stock released successfully.",
                    status = request.Status,
                    releasedItems
                });
            }
            catch (InvalidOperationException ex)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                _logger.LogError(
                    ex,
                    "Failed to release reservation for request {RequestId}",
                    id);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to release reservation."
                });
            }
        }

        // =========================================================
        // 18. RECEIVE ITEMS
        // POST: api/HardwareRequest/{id}/Receive
        // =========================================================

        [HttpPost("{id:guid}/Receive")]
        public async Task<IActionResult> Receive(
            Guid id,
            [FromBody] ReceiveHardwareRequestDto dto)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var request = await _context.HardwareRequests
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
                return NotFound("Hardware request not found.");

            if (request.RequestedById != userId.Value)
                return Forbid();

            if (!IsInventoryRequest(request.RequestType))
            {
                return BadRequest(
                    "Receipt confirmation is only available for hardware and site material requests.");
            }

            if (request.Status != "Issued")
            {
                return BadRequest(
                    "Only fully issued requests can be confirmed as received.");
            }

            if (!request.Items.Any())
            {
                return BadRequest(
                    "This request does not contain hardware or material items.");
            }

            var notFullyIssued = request.Items.Any(
                x => x.IssuedQuantity < x.ApprovedQuantity);

            if (notFullyIssued)
            {
                return BadRequest(
                    "All approved items must be issued before confirming receipt.");
            }

            var receivedAt = DateTimeHelper.Now();

            request.ReceivedById = userId.Value;
            request.ReceivedAt = receivedAt;
            request.ReceivedRemarks = dto?.Remarks?.Trim();
            request.CompletedAt = receivedAt;
            request.Status = "Resolved";

            await _context.SaveChangesAsync();

            if (request.AssignedToId.HasValue)
            {
                await NotifyUserAsync(
                    request.AssignedToId.Value,
                    "Request Receipt Confirmed",
                    $"The requester has confirmed receipt of '{request.Subject}'.",
                    "HardwareRequest",
                    request.Id
                );
            }

            return Ok(new
            {
                success = true,
                message = "Receipt confirmed successfully.",
                requestId = request.Id,
                receivedBy = userId.Value,
                receivedAt = request.ReceivedAt,
                status = request.Status
            });
        }
    }
}
