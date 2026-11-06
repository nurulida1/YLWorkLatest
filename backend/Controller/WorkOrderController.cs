
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class WorkOrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public WorkOrderController(
            AppDbContext context,
            IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // =====================================================
        // GET MANY
        // =====================================================

        [HttpGet("GetMany")]
        public async Task<IActionResult> GetMany(
            int page = 1,
            int pageSize = 10,
            Guid? projectId = null,
            string? search = null,
            string? status = null,
            string? priority = null,
            string? workType = null,
            Guid? assignedToId = null,
            string? orderBy = null)
        {
            try
            {
                page = Math.Max(page, 1);
                pageSize = Math.Clamp(pageSize, 1, 100);

                var query = _context.WorkOrders
                    .AsNoTracking()
                    .Include(x => x.Project)
                    .Include(x => x.AssignedTo)
                    .Include(x => x.WorkOrderMembers)
                        .ThenInclude(x => x.User)
                    .AsQueryable();

                if (projectId.HasValue)
                    query = query.Where(x => x.ProjectId == projectId);

                if (assignedToId.HasValue)
                {
                    query = query.Where(x =>
                        x.AssignedToId == assignedToId ||
                        x.WorkOrderMembers.Any(m =>
                            m.UserId == assignedToId));
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var keyword = search.Trim().ToLower();

                    query = query.Where(x =>
                        x.WorkOrderNo.ToLower().Contains(keyword) ||
                        x.Title.ToLower().Contains(keyword) ||
                        x.Project.ProjectCode.ToLower().Contains(keyword) ||
                        x.Project.ProjectTitle.ToLower().Contains(keyword));
                }

                if (!string.IsNullOrWhiteSpace(status))
                    query = query.Where(x => x.Status == status);

                if (!string.IsNullOrWhiteSpace(priority))
                    query = query.Where(x => x.Priority == priority);

                if (!string.IsNullOrWhiteSpace(workType))
                    query = query.Where(x => x.WorkType == workType);

                var totalElements = await query.CountAsync();

                query = orderBy?.ToLower() switch
                {
                    "title" => query.OrderBy(x => x.Title),
                    "title desc" => query.OrderByDescending(x => x.Title),
                    "duedate" => query.OrderBy(x => x.DueDate),
                    "duedate desc" => query.OrderByDescending(x => x.DueDate),
                    "priority" => query.OrderBy(x => x.Priority),
                    "priority desc" => query.OrderByDescending(x => x.Priority),
                    _ => query.OrderByDescending(x => x.CreatedAt)
                };

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => new
                    {
                        x.Id,
                        x.WorkOrderNo,
                        x.ProjectId,
                        ProjectCode = x.Project.ProjectCode,
                        ProjectTitle = x.Project.ProjectTitle,
                        x.Title,
                        x.Description,
                        x.WorkType,
                        x.Priority,
                        x.Status,
                        x.Location,
                        x.ScheduledDate,
                        x.DueDate,
                        x.StartedAt,
                        x.CompletedAt,

                        AssignedTo = x.AssignedTo == null ? null : new
                        {
                            x.AssignedTo.Id,
                            x.AssignedTo.FullName,
                            x.AssignedTo.DisplayName,
                            x.AssignedTo.JobTitle
                        },

                        Members = x.WorkOrderMembers.Select(m => new
                        {
                            m.UserId,
                            Name = m.User.FullName
                        }).ToList(),

                        ChecklistCount = x.Checklists.Count,
                        CompletedChecklistCount =
                            x.Checklists.Count(c => c.IsCompleted),

                        x.CreatedAt,
                        x.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Data = items,
                    TotalElements = totalElements
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load work orders.",
                    Message = ex.Message
                });
            }
        }

        // =====================================================
        // GET ONE
        // =====================================================

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(Guid id)
        {
            if (id == Guid.Empty)
                return BadRequest(new { Error = "Invalid work order ID." });

            try
            {
                var data = await _context.WorkOrders
                    .AsNoTracking()
                    .Where(x => x.Id == id)
                    .Select(x => new
                    {
                        x.Id,
                        x.WorkOrderNo,
                        x.ProjectId,

                        Project = new
                        {
                            x.Project.ProjectCode,
                            x.Project.ProjectTitle,
                            ClientName = x.Project.Client.Name
                        },

                        x.Title,
                        x.Description,
                        x.WorkType,
                        x.Priority,
                        x.Status,
                        x.Location,
                        x.ScopeOfWork,
                        x.Remarks,

                        x.ScheduledDate,
                        x.DueDate,
                        x.StartedAt,
                        x.CompletedAt,

                        x.AssignedToId,

                        AssignedTo = x.AssignedTo == null ? null : new
                        {
                            x.AssignedTo.Id,
                            x.AssignedTo.FullName,
                            x.AssignedTo.DisplayName,
                            x.AssignedTo.JobTitle,
                            x.AssignedTo.Email
                        },

                        WorkOrderMembers = x.WorkOrderMembers
                            .Select(m => new
                            {
                                m.Id,
                                m.UserId,
                                Name = m.User.FullName,
                                m.AssignedAt
                            }).ToList(),

                        Checklists = x.Checklists
                            .OrderBy(c => c.Sequence)
                            .Select(c => new
                            {
                                c.Id,
                                c.Title,
                                c.IsCompleted,
                                c.CompletedAt,
                                c.Sequence
                            }).ToList(),

                        Attachments = _context.Attachments
                            .Where(a =>
                                a.EntityType == "WorkOrder" &&
                                a.EntityId == x.Id)
                            .Select(a => new
                            {
                                a.Id,
                                a.FileName,
                                a.FileType,
                                a.FileSize,
                                a.FileUrl,
                                a.UploadedAt,
                                a.UploadedById
                            }).ToList(),

                        x.CreatedById,
                        CreatedBy = x.CreatedBy.FullName,
                        x.CreatedAt,
                        x.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (data == null)
                    return NotFound(new { Error = "Work order not found." });

                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load work order.",
                    Message = ex.Message
                });
            }
        }

        // =====================================================
        // CREATE
        // =====================================================

        [HttpPost("Create")]
        public async Task<IActionResult> Create(
            [FromForm] CreateWorkOrderRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.ProjectId == Guid.Empty)
                return BadRequest(new { Error = "Project is required." });

            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { Error = "Title is required." });

            if (!WorkOrderType.All.Contains(request.WorkType))
                return BadRequest(new { Error = "Invalid work type." });

            if (!WorkOrderPriority.All.Contains(request.Priority))
                return BadRequest(new { Error = "Invalid priority." });

            var userIdClaim = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized(new { Error = "Invalid token." });

            try
            {
                var projectExists = await _context.Projects
                    .AnyAsync(x => x.Id == request.ProjectId);

                if (!projectExists)
                    return BadRequest(new { Error = "Project not found." });

                if (request.AssignedToId.HasValue &&
                    !await _context.Users.AnyAsync(
                        x => x.Id == request.AssignedToId.Value))
                {
                    return BadRequest(new { Error = "Assigned user not found." });
                }

                var validStatuses = new[]
                {
                    WorkOrderStatus.Open,
                    WorkOrderStatus.Assigned,
                    WorkOrderStatus.InProgress
                };

                var status = string.IsNullOrWhiteSpace(request.Status)
                    ? WorkOrderStatus.Open
                    : request.Status;

                if (!validStatuses.Contains(status))
                    return BadRequest(new { Error = "Invalid initial status." });

                var workOrder = new WorkOrder
                {
                    Id = Guid.NewGuid(),
                    ProjectId = request.ProjectId,
                    WorkOrderNo = await GenerateWorkOrderNo(),
                    Title = request.Title.Trim(),
                    Description = request.Description,
                    WorkType = request.WorkType,
                    Priority = request.Priority,
                    Status = status,
                    Location = request.Location,
                    ScopeOfWork = request.ScopeOfWork,
                    Remarks = request.Remarks,
                    ScheduledDate = request.ScheduledDate,
                    DueDate = request.DueDate,
                    AssignedToId = request.AssignedToId,
                    CreatedById = userId,
                    CreatedAt = DateTimeHelper.Now()
                };

                if (workOrder.AssignedToId.HasValue &&
                    workOrder.Status == WorkOrderStatus.Open)
                {
                    workOrder.Status = WorkOrderStatus.Assigned;
                }

                _context.WorkOrders.Add(workOrder);

                // ADD MEMBERS
                if (request.WorkOrderMembers?.Any() == true)
                {
                    var memberIds = request.WorkOrderMembers
                        .Select(Guid.Parse)
                        .Distinct()
                        .ToList();

                    var existingUserIds = await _context.Users
                        .Where(x => memberIds.Contains(x.Id))
                        .Select(x => x.Id)
                        .ToListAsync();

                    if (existingUserIds.Count != memberIds.Count)
                        return BadRequest(new { Error = "One or more members do not exist." });

                    var members = memberIds.Select(memberId =>
                        new WorkOrderMember
                        {
                            Id = Guid.NewGuid(),
                            WorkOrderId = workOrder.Id,
                            UserId = memberId,
                            AssignedAt = DateTimeHelper.Now(),
                            AssignedById = userId
                        });

                    _context.WorkOrderMembers.AddRange(members);

                    if (workOrder.Status == WorkOrderStatus.Open)
                        workOrder.Status = WorkOrderStatus.Assigned;
                }

                // ADD CHECKLISTS
                if (request.Checklists?.Any() == true)
                {
                    var checklists = request.Checklists.Select(c =>
                        new WorkOrderChecklist
                        {
                            Id = Guid.NewGuid(),
                            WorkOrderId = workOrder.Id,
                            Title = c.Title.Trim(),
                            Sequence = c.Sequence > 0 ? c.Sequence : 1
                        });

                    _context.WorkOrderChecklists.AddRange(checklists);
                }

                // UPLOAD ATTACHMENTS
                if (request.Files?.Any() == true)
                {
                    foreach (var file in request.Files)
                    {
                        if (file.Length <= 0)
                            continue;

                        var fileUrl = await UploadFile(
                            file,
                            "workorders",
                            workOrder.Id);

                        _context.Attachments.Add(new AttachmentDto
                        {
                            Id = Guid.NewGuid(),
                            FileName = Path.GetFileName(file.FileName),
                            FileType = file.ContentType,
                            FileSize = file.Length,
                            FileUrl = fileUrl,
                            EntityType = "WorkOrder",
                            EntityId = workOrder.Id,
                            UploadedAt = DateTimeHelper.Now(),
                            UploadedById = userId
                        });
                    }
                }

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync(
                    "WorkOrderAdded", workOrder);

                return Ok(new
                {
                    Message = "Work order created successfully.",
                    Id = workOrder.Id,
                    WorkOrderNo = workOrder.WorkOrderNo
                });
            }
            catch (FormatException)
            {
                return BadRequest(new { Error = "Invalid member ID." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to create work order.",
                    Message = ex.Message,
                    InnerException = ex.InnerException?.Message
                });
            }
        }

        // =====================================================
        // UPDATE
        // =====================================================

        [HttpPut("Update")]
        public async Task<IActionResult> Update(
            [FromForm] UpdateWorkOrderRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized(new { Error = "Invalid token." });

            try
            {
                var workOrder = await _context.WorkOrders
                    .Include(x => x.WorkOrderMembers)
                    .Include(x => x.Checklists)
                    .FirstOrDefaultAsync(x => x.Id == request.Id);

                if (workOrder == null)
                    return NotFound(new { Error = "Work order not found." });

                if (!await _context.Projects.AnyAsync(
                    x => x.Id == request.ProjectId))
                {
                    return BadRequest(new { Error = "Project not found." });
                }

                if (!WorkOrderType.All.Contains(request.WorkType))
                    return BadRequest(new { Error = "Invalid work type." });

                if (!WorkOrderPriority.All.Contains(request.Priority))
                    return BadRequest(new { Error = "Invalid priority." });

                if (request.AssignedToId.HasValue &&
                    !await _context.Users.AnyAsync(
                        x => x.Id == request.AssignedToId.Value))
                {
                    return BadRequest(new { Error = "Assigned user not found." });
                }

                // UPDATE INFORMATION
                workOrder.ProjectId = request.ProjectId;
                workOrder.Title = request.Title.Trim();
                workOrder.Description = request.Description;
                workOrder.WorkType = request.WorkType;
                workOrder.Priority = request.Priority;
                workOrder.Location = request.Location;
                workOrder.ScopeOfWork = request.ScopeOfWork;
                workOrder.Remarks = request.Remarks;
                workOrder.ScheduledDate = request.ScheduledDate;
                workOrder.DueDate = request.DueDate;
                workOrder.AssignedToId = request.AssignedToId;
                workOrder.UpdatedAt = DateTimeHelper.Now();

                if (!string.IsNullOrWhiteSpace(request.Status))
                {
                    if (!WorkOrderStatus.All.Contains(request.Status))
                        return BadRequest(new { Error = "Invalid status." });

                    workOrder.Status = request.Status;
                }
                else if (workOrder.AssignedToId.HasValue &&
                         workOrder.Status == WorkOrderStatus.Open)
                {
                    workOrder.Status = WorkOrderStatus.Assigned;
                }

                // REPLACE MEMBERS
                _context.WorkOrderMembers.RemoveRange(
                    workOrder.WorkOrderMembers);

                if (request.WorkOrderMembers?.Any() == true)
                {
                    var memberIds = request.WorkOrderMembers
                        .Select(Guid.Parse)
                        .Distinct()
                        .ToList();

                    var existingUserIds = await _context.Users
                        .Where(x => memberIds.Contains(x.Id))
                        .Select(x => x.Id)
                        .ToListAsync();

                    if (existingUserIds.Count != memberIds.Count)
                        return BadRequest(new { Error = "One or more members do not exist." });

                    var members = memberIds.Select(memberId =>
                        new WorkOrderMember
                        {
                            Id = Guid.NewGuid(),
                            WorkOrderId = workOrder.Id,
                            UserId = memberId,
                            AssignedAt = DateTimeHelper.Now(),
                            AssignedById = userId
                        });

                    _context.WorkOrderMembers.AddRange(members);
                }

                // REPLACE CHECKLISTS
                _context.WorkOrderChecklists.RemoveRange(
                    workOrder.Checklists);

                if (request.Checklists?.Any() == true)
                {
                    var checklists = request.Checklists.Select(c =>
                        new WorkOrderChecklist
                        {
                            Id = Guid.NewGuid(),
                            WorkOrderId = workOrder.Id,
                            Title = c.Title.Trim(),
                            Sequence = c.Sequence > 0 ? c.Sequence : 1
                        });

                    _context.WorkOrderChecklists.AddRange(checklists);
                }

                // ADD NEW ATTACHMENTS
                if (request.Files?.Any() == true)
                {
                    foreach (var file in request.Files)
                    {
                        if (file.Length <= 0)
                            continue;

                        var fileUrl = await UploadFile(
                            file,
                            "workorders",
                            workOrder.Id);

                        _context.Attachments.Add(new AttachmentDto
                        {
                            Id = Guid.NewGuid(),
                            FileName = Path.GetFileName(file.FileName),
                            FileType = file.ContentType,
                            FileSize = file.Length,
                            FileUrl = fileUrl,
                            EntityType = "WorkOrder",
                            EntityId = workOrder.Id,
                            UploadedAt = DateTimeHelper.Now(),
                            UploadedById = userId
                        });
                    }
                }

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync(
                    "WorkOrderUpdated", workOrder);

                return await GetOne(workOrder.Id);
            }
            catch (FormatException)
            {
                return BadRequest(new { Error = "Invalid member ID." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update work order.",
                    Message = ex.Message
                });
            }
        }

        // =====================================================
        // UPDATE STATUS
        // =====================================================

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(
            [FromBody] UpdateWorkOrderStatusRequest request)
        {
            if (request.WorkOrderId == Guid.Empty)
                return BadRequest(new { Error = "Work order ID is required." });

            if (!WorkOrderStatus.All.Contains(request.Status))
                return BadRequest(new { Error = "Invalid status." });

            try
            {
                var workOrder = await _context.WorkOrders
                    .FirstOrDefaultAsync(x => x.Id == request.WorkOrderId);

                if (workOrder == null)
                    return NotFound(new { Error = "Work order not found." });

                workOrder.Status = request.Status;

                if (request.Status == WorkOrderStatus.InProgress &&
                    workOrder.StartedAt == null)
                {
                    workOrder.StartedAt = DateTimeHelper.Now();
                }

                if (request.Status == WorkOrderStatus.Completed)
                {
                    workOrder.CompletedAt = DateTimeHelper.Now();
                }
                else
                {
                    workOrder.CompletedAt = null;
                }

                workOrder.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync(
                    "WorkOrderStatusUpdated",
                    new
                    {
                        workOrder.Id,
                        workOrder.WorkOrderNo,
                        workOrder.Status,
                        workOrder.StartedAt,
                        workOrder.CompletedAt
                    });

                return Ok(workOrder);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update work order status.",
                    Message = ex.Message
                });
            }
        }

        // =====================================================
        // UPDATE CHECKLIST ITEM
        // =====================================================

        [HttpPut("UpdateChecklistStatus")]
        public async Task<IActionResult> UpdateChecklistStatus(
            [FromBody] UpdateWorkOrderChecklistStatusRequest request)
        {
            if (request.Id == Guid.Empty)
                return BadRequest(new { Error = "Checklist ID is required." });

            try
            {
                var checklist = await _context.WorkOrderChecklists
                    .FirstOrDefaultAsync(x => x.Id == request.Id);

                if (checklist == null)
                    return NotFound(new { Error = "Checklist not found." });

                checklist.IsCompleted = request.IsCompleted;
                checklist.CompletedAt = request.IsCompleted
                    ? DateTimeHelper.Now()
                    : null;

                checklist.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync(
                    "WorkOrderChecklistUpdated",
                    checklist);

                return Ok(checklist);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update checklist.",
                    Message = ex.Message
                });
            }
        }

        // =====================================================
        // DELETE
        // =====================================================

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var workOrder = await _context.WorkOrders
                    .Include(x => x.WorkOrderMembers)
                    .Include(x => x.Checklists)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (workOrder == null)
                    return NotFound(new { Error = "Work order not found." });

                var attachments = await _context.Attachments
                    .Where(x =>
                        x.EntityType == "WorkOrder" &&
                        x.EntityId == id)
                    .ToListAsync();

                _context.Attachments.RemoveRange(attachments);
                _context.WorkOrders.Remove(workOrder);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync(
                    "WorkOrderDeleted", id);

                return Ok(new
                {
                    Message = "Work order deleted successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to delete work order.",
                    Message = ex.Message
                });
            }
        }

        // =====================================================
        // DROPDOWN
        // =====================================================

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown(Guid? projectId = null)
        {
            try
            {
                var projectsQuery = _context.Projects.AsQueryable();

                if (projectId.HasValue)
                    projectsQuery = projectsQuery.Where(
                        x => x.Id == projectId.Value);

                var projects = await projectsQuery
                    .OrderByDescending(x => x.CreatedAt)
                    .Select(x => new
                    {
                        x.Id,
                        x.ProjectCode,
                        x.ProjectTitle
                    })
                    .ToListAsync();

                var users = await _context.Users
                    .OrderBy(x => x.FullName)
                    .Select(x => new
                    {
                        x.Id,
                        x.FullName,
                        x.DisplayName,
                        x.JobTitle
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Projects = projects,
                    Users = users,
                    WorkTypes = WorkOrderType.All,
                    Priorities = WorkOrderPriority.All,
                    Statuses = WorkOrderStatus.All
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load work order dropdowns.",
                    Message = ex.Message
                });
            }
        }

        // =====================================================
        // NEXT WORK ORDER NUMBER
        // =====================================================

        [HttpGet("GetNextWorkOrderNo")]
        public async Task<IActionResult> GetNextWorkOrderNo()
        {
            try
            {
                var nextNo = await GenerateWorkOrderNo();

                return Ok(new
                {
                    WorkOrderNo = nextNo
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to generate work order number.",
                    Message = ex.Message
                });
            }
        }

        // =====================================================
        // HELPERS
        // =====================================================

        private async Task<string> GenerateWorkOrderNo()
        {
            var year = DateTimeHelper.Now().Year;
            var prefix = $"WO-{year}-";

            var numbers = await _context.WorkOrders
                .Where(x => x.WorkOrderNo.StartsWith(prefix))
                .Select(x => x.WorkOrderNo)
                .ToListAsync();

            var latestNumber = numbers
                .Select(x =>
                {
                    var parts = x.Split('-');
                    return parts.Length == 3 &&
                           int.TryParse(parts[2], out var number)
                        ? number
                        : 0;
                })
                .DefaultIfEmpty(0)
                .Max();

            return $"{prefix}{(latestNumber + 1):D4}";
        }

        private async Task<string> UploadFile(
            IFormFile file,
            string folder,
            Guid entityId)
        {
            var uploadFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "uploads",
                folder,
                entityId.ToString());

            Directory.CreateDirectory(uploadFolder);

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";

            var filePath = Path.Combine(uploadFolder, fileName);

            await using (var stream = new FileStream(
                filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/{folder}/{entityId}/{fileName}";
        }
    }
}
