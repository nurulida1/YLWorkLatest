
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobSheetController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public JobSheetController(
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
        public async Task<ActionResult<object>> GetMany(
            int page = 1,
            int pageSize = 10,
            string? filter = null,
            string? orderBy = null,
            string? includes = null)
        {
            try
            {
                page = Math.Max(page, 1);
                pageSize = Math.Clamp(pageSize, 1, 100);

                var query = _context.JobSheets
                    .Include(x => x.Project)
                    .Include(x => x.WorkOrder)
                    .Include(x => x.Members)
                        .ThenInclude(x => x.User)
                    .AsQueryable();

                // FILTER
                if (!string.IsNullOrWhiteSpace(filter))
                {
                    var parameter = Expression.Parameter(
                        typeof(JobSheet), "x");

                    Expression? finalExpression = null;

                    var orParts = filter.Split('|');

                    foreach (var orPart in orParts)
                    {
                        Expression? orExpression = null;

                        var andParts = orPart.Split(',');

                        foreach (var andPart in andParts)
                        {
                            bool isNotEqual = andPart.Contains("!=");

                            var kv = isNotEqual
                                ? andPart.Split("!=")
                                : andPart.Split('=');

                            if (kv.Length != 2)
                                continue;

                            var property = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            Expression propertyAccess;

                            try
                            {
                                propertyAccess = Expression.PropertyOrField(
                                    parameter, property);
                            }
                            catch
                            {
                                continue;
                            }

                            Expression condition;

                            var propertyType =
                                Nullable.GetUnderlyingType(propertyAccess.Type)
                                ?? propertyAccess.Type;

                            if (propertyType == typeof(string))
                            {
                                var toLowerMethod = typeof(string)
                                    .GetMethod("ToLower", Type.EmptyTypes)!;

                                var containsMethod = typeof(string)
                                    .GetMethod(
                                        "Contains",
                                        new[] { typeof(string) })!;

                                var propertyToLower = Expression.Call(
                                    propertyAccess,
                                    toLowerMethod);

                                var valueToLower = Expression.Constant(
                                    valueStr.ToLower());

                                var containsExpression = Expression.Call(
                                    propertyToLower,
                                    containsMethod,
                                    valueToLower);

                                condition = isNotEqual
                                    ? Expression.Not(containsExpression)
                                    : containsExpression;
                            }
                            else if (propertyType == typeof(Guid))
                            {
                                if (!Guid.TryParse(valueStr, out var guid))
                                    continue;

                                var constant = Expression.Constant(guid);

                                condition = Expression.Equal(
                                    propertyAccess,
                                    constant);
                            }
                            else if (propertyType.IsEnum)
                            {
                                try
                                {
                                    var enumValue = Enum.Parse(
                                        propertyType,
                                        valueStr,
                                        true);

                                    var constant = Expression.Constant(
                                        enumValue,
                                        propertyType);

                                    condition = Expression.Equal(
                                        propertyAccess,
                                        constant);
                                }
                                catch
                                {
                                    continue;
                                }
                            }
                            else
                            {
                                try
                                {
                                    var convertedValue = Convert.ChangeType(
                                        valueStr,
                                        propertyType);

                                    var constant = Expression.Constant(
                                        convertedValue,
                                        propertyType);

                                    condition = Expression.Equal(
                                        propertyAccess,
                                        constant);
                                }
                                catch
                                {
                                    continue;
                                }
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(
                                    orExpression,
                                    condition);
                        }

                        if (orExpression != null)
                        {
                            finalExpression = finalExpression == null
                                ? orExpression
                                : Expression.OrElse(
                                    finalExpression,
                                    orExpression);
                        }
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<JobSheet, bool>>(
                            finalExpression,
                            parameter);

                        query = query.Where(lambda);
                    }
                }

                // SORTING
                if (!string.IsNullOrWhiteSpace(orderBy))
                {
                    var sortParts = orderBy.Trim().Split(' ');
                    var sortProperty = sortParts[0];

                    var descending = sortParts.Length > 1 &&
                        sortParts[1].Equals(
                            "desc",
                            StringComparison.OrdinalIgnoreCase);

                    var propertyExists = typeof(JobSheet)
                        .GetProperty(sortProperty) != null;

                    if (propertyExists)
                    {
                        query = descending
                            ? query.OrderByDescending(
                                x => EF.Property<object>(
                                    x, sortProperty))
                            : query.OrderBy(
                                x => EF.Property<object>(
                                    x, sortProperty));
                    }
                }

                var totalElements = await query.CountAsync();

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => new
                    {
                        x.Id,
                        x.JobSheetNo,
                        x.WorkDate,
                        x.StartTime,
                        x.EndTime,
                        x.WorkDescription,
                        x.Status,

                        x.ProjectId,

                        Project = x.Project == null
                            ? null
                            : new
                            {
                                x.Project.ProjectTitle,
                                x.Project.ProjectCode
                            },

                        x.WorkOrderId,

                        WorkOrder = x.WorkOrder == null
                            ? null
                            : new
                            {
                                x.WorkOrder.WorkOrderNo,
                                x.WorkOrder.Title,
                                x.WorkOrder.WorkType,
                                x.WorkOrder.Status
                            },

                        Members = x.Members.Select(m => new
                        {
                            m.Id,
                            m.UserId,
                            Name = m.User.FullName,
                            m.User.JobTitle
                        }).ToList()
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
                    Error = "An unexpected error occurred.",
                    Message = ex.Message
                });
            }
        }

        // =====================================================
        // GET ONE
        // =====================================================

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(string? filter = null)
        {
            if (string.IsNullOrWhiteSpace(filter))
                return BadRequest("Filter is required.");

            var filterParts = filter.Split('=');

            if (filterParts.Length != 2 ||
                !filterParts[0].Trim().Equals(
                    "Id",
                    StringComparison.OrdinalIgnoreCase) ||
                !Guid.TryParse(filterParts[1].Trim(), out Guid id))
            {
                return BadRequest("Invalid Id.");
            }

            var data = await _context.JobSheets
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,
                    x.JobSheetNo,

                    x.ProjectId,

                    Project = x.Project == null
                        ? null
                        : new
                        {
                            x.Project.ProjectTitle,
                            x.Project.ProjectCode
                        },

                    x.WorkOrderId,

                    WorkOrder = x.WorkOrder == null
                        ? null
                        : new
                        {
                            x.WorkOrder.Id,
                            x.WorkOrder.WorkOrderNo,
                            x.WorkOrder.Title,
                            x.WorkOrder.Description,
                            x.WorkOrder.WorkType,
                            x.WorkOrder.Status
                        },

                    x.WorkDate,
                    x.StartTime,
                    x.EndTime,
                    x.WorkDescription,
                    x.Status,

                    Attachments = _context.Attachments
                        .Where(a =>
                            a.EntityType == "JobSheet" &&
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
                        })
                        .ToList(),

                    Members = x.Members
                        .Select(m => new
                        {
                            m.Id,
                            m.JobSheetId,
                            m.UserId,

                            User = m.User == null
                                ? null
                                : new UserDto
                                {
                                    Id = m.User.Id,
                                    FullName = m.User.FullName,
                                    JobTitle = m.User.JobTitle
                                }
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (data == null)
                return NotFound(new
                {
                    Error = "Job Sheet not found."
                });

            return Ok(data);
        }

        // =====================================================
        // CREATE
        // =====================================================

        [HttpPost("Create")]
        public async Task<ActionResult<JobSheet>> AddJobSheet(
            [FromForm] CreateJobSheetRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.JobSheetNo))
            {
                return BadRequest(new
                {
                    Error = "JobSheet No is required."
                });
            }

            if (request.ProjectId == Guid.Empty)
            {
                return BadRequest(new
                {
                    Error = "Project is required."
                });
            }

            var userIdClaim = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdClaim, out Guid userId))
            {
                return Unauthorized(new
                {
                    Error = "Invalid token."
                });
            }

            try
            {
                var projectExists = await _context.Projects
                    .AnyAsync(x => x.Id == request.ProjectId);

                if (!projectExists)
                {
                    return BadRequest(new
                    {
                        Error = "Selected project does not exist."
                    });
                }

                // Validate Work Order belongs to selected Project.
                if (request.WorkOrderId.HasValue)
                {
                    var workOrderExists = await _context.WorkOrders
                        .AnyAsync(x =>
                            x.Id == request.WorkOrderId.Value &&
                            x.ProjectId == request.ProjectId);

                    if (!workOrderExists)
                    {
                        return BadRequest(new
                        {
                            Error = "Selected Work Order does not belong to this Project."
                        });
                    }
                }

                var duplicateNumber = await _context.JobSheets
                    .AnyAsync(x => x.JobSheetNo == request.JobSheetNo);

                if (duplicateNumber)
                {
                    return BadRequest(new
                    {
                        Error = "JobSheet No already exists."
                    });
                }

                var jobsheet = new JobSheet
                {
                    Id = Guid.NewGuid(),

                    JobSheetNo = request.JobSheetNo.Trim(),

                    ProjectId = request.ProjectId,

                    WorkOrderId = request.WorkOrderId,

                    WorkDate = request.WorkDate,

                    StartTime = request.StartTime,

                    EndTime = request.EndTime,

                    WorkDescription = request.WorkDescription,

                    Status = string.IsNullOrWhiteSpace(request.Status)
                        ? "Draft"
                        : request.Status,

                    CreatedById = userId,

                    CreatedAt = DateTimeHelper.Now()
                };

                _context.JobSheets.Add(jobsheet);

                await _context.SaveChangesAsync();

                // ADD MEMBERS
                if (request.Members != null &&
                    request.Members.Any())
                {
                    var memberIds = request.Members
                        .Where(x => Guid.TryParse(x, out _))
                        .Select(Guid.Parse)
                        .Distinct()
                        .ToList();

                    var members = memberIds.Select(memberId =>
                        new JobSheetMember
                        {
                            Id = Guid.NewGuid(),
                            JobSheetId = jobsheet.Id,
                            UserId = memberId
                        }).ToList();

                    _context.JobSheetMembers.AddRange(members);
                }

                // UPLOAD ATTACHMENTS
                if (request.Files != null &&
                    request.Files.Any())
                {
                    foreach (var file in request.Files)
                    {
                        if (file.Length <= 0)
                            continue;

                        var fileUrl = await UploadFile(
                            file,
                            "JobSheet",
                            jobsheet.Id);

                        var attachment = new AttachmentDto
                        {
                            Id = Guid.NewGuid(),
                            FileName = file.FileName,
                            FileType = file.ContentType,
                            FileSize = file.Length,
                            FileUrl = fileUrl,
                            EntityType = "JobSheet",
                            EntityId = jobsheet.Id,
                            UploadedAt = DateTimeHelper.Now(),
                            UploadedById = userId
                        };

                        _context.Attachments.Add(attachment);
                    }
                }

                await _context.SaveChangesAsync();

                var result = await GetJobSheetResult(jobsheet.Id);

                await _hub.Clients.All.SendAsync(
                    "JobSheetAdded",
                    result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to add Job Sheet.",
                    Message = ex.Message,
                    InnerException = ex.InnerException?.Message
                });
            }
        }

        // =====================================================
        // UPDATE
        // =====================================================

        [HttpPut("Update")]
        public async Task<ActionResult<JobSheet>> UpdateJobSheet(
            [FromForm] UpdateJobSheetRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Id == Guid.Empty)
            {
                return BadRequest(new
                {
                    Error = "Job Sheet Id is required."
                });
            }

            var userIdClaim = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdClaim, out Guid userId))
                return Unauthorized();

            try
            {
                var jobsheet = await _context.JobSheets
                    .Include(x => x.Members)
                    .FirstOrDefaultAsync(x => x.Id == request.Id);

                if (jobsheet == null)
                {
                    return NotFound(new
                    {
                        Error = "Job Sheet not found."
                    });
                }

                var projectExists = await _context.Projects
                    .AnyAsync(x => x.Id == request.ProjectId);

                if (!projectExists)
                {
                    return BadRequest(new
                    {
                        Error = "Selected project does not exist."
                    });
                }

                // Validate Work Order belongs to selected Project.
                if (request.WorkOrderId.HasValue)
                {
                    var workOrderExists = await _context.WorkOrders
                        .AnyAsync(x =>
                            x.Id == request.WorkOrderId.Value &&
                            x.ProjectId == request.ProjectId);

                    if (!workOrderExists)
                    {
                        return BadRequest(new
                        {
                            Error = "Selected Work Order does not belong to this Project."
                        });
                    }
                }

                var duplicateNumber = await _context.JobSheets
                    .AnyAsync(x =>
                        x.JobSheetNo == request.JobSheetNo &&
                        x.Id != request.Id);

                if (duplicateNumber)
                {
                    return BadRequest(new
                    {
                        Error = "JobSheet No already exists."
                    });
                }

                jobsheet.JobSheetNo = request.JobSheetNo.Trim();

                jobsheet.ProjectId = request.ProjectId;

                jobsheet.WorkOrderId = request.WorkOrderId;

                jobsheet.WorkDate = request.WorkDate;

                jobsheet.StartTime = request.StartTime;

                jobsheet.EndTime = request.EndTime;

                jobsheet.WorkDescription = request.WorkDescription;

                jobsheet.Status = request.Status;

                jobsheet.UpdatedAt = DateTimeHelper.Now();

                // REPLACE MEMBERS
                _context.JobSheetMembers.RemoveRange(
                    jobsheet.Members);

                if (request.Members != null &&
                    request.Members.Any())
                {
                    var memberIds = request.Members
                        .Where(x => Guid.TryParse(x, out _))
                        .Select(Guid.Parse)
                        .Distinct()
                        .ToList();

                    var members = memberIds.Select(memberId =>
                        new JobSheetMember
                        {
                            Id = Guid.NewGuid(),
                            JobSheetId = jobsheet.Id,
                            UserId = memberId
                        }).ToList();

                    _context.JobSheetMembers.AddRange(members);
                }

                // ADD NEW ATTACHMENTS
                if (request.Files != null &&
                    request.Files.Any())
                {
                    foreach (var file in request.Files)
                    {
                        if (file.Length <= 0)
                            continue;

                        var fileUrl = await UploadFile(
                            file,
                            "JobSheet",
                            jobsheet.Id);

                        _context.Attachments.Add(
                            new AttachmentDto
                            {
                                Id = Guid.NewGuid(),
                                FileName = file.FileName,
                                FileType = file.ContentType,
                                FileSize = file.Length,
                                FileUrl = fileUrl,
                                EntityType = "JobSheet",
                                EntityId = jobsheet.Id,
                                UploadedAt = DateTimeHelper.Now(),
                                UploadedById = userId
                            });
                    }
                }

                await _context.SaveChangesAsync();

                var result = await GetJobSheetResult(jobsheet.Id);

                await _hub.Clients.All.SendAsync(
                    "JobSheetUpdated",
                    result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update Job Sheet.",
                    Message = ex.Message,
                    InnerException = ex.InnerException?.Message
                });
            }
        }

        // =====================================================
        // DELETE
        // =====================================================

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var jobSheet = await _context.JobSheets
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (jobSheet == null)
            {
                return NotFound(new
                {
                    Error = "Job Sheet not found."
                });
            }

            _context.JobSheetMembers.RemoveRange(
                jobSheet.Members);

            var attachments = await _context.Attachments
                .Where(x =>
                    x.EntityType == "JobSheet" &&
                    x.EntityId == id)
                .ToListAsync();

            _context.Attachments.RemoveRange(attachments);

            _context.JobSheets.Remove(jobSheet);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync(
                "JobSheetDeleted",
                id);

            return Ok(new
            {
                Message = "Job Sheet deleted successfully."
            });
        }

        // =====================================================
        // UPDATE STATUS
        // =====================================================

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(
            [FromBody] UpdateJobSheetStatusRequest request)
        {
            if (request.JobSheetId == Guid.Empty)
            {
                return BadRequest(new
                {
                    Error = "JobSheetId is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new
                {
                    Error = "Status is required."
                });
            }

            var validStatuses = new[]
            {
                "Draft",
                "InProgress",
                "Completed",
                "Cancelled"
            };

            if (!validStatuses.Contains(
                request.Status,
                StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    Error = "Invalid status value."
                });
            }

            try
            {
                var jobSheet = await _context.JobSheets
                    .FirstOrDefaultAsync(
                        x => x.Id == request.JobSheetId);

                if (jobSheet == null)
                {
                    return NotFound(new
                    {
                        Error = "Job Sheet not found."
                    });
                }

                jobSheet.Status = request.Status;
                jobSheet.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();

                var result = await GetJobSheetResult(jobSheet.Id);

                await _hub.Clients.All.SendAsync(
                    "JobSheetStatusUpdated",
                    result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update Job Sheet status."
                });
            }
        }

        // =====================================================
        // GET JOB SHEET RESULT
        // =====================================================

        private async Task<object?> GetJobSheetResult(Guid id)
        {
            return await _context.JobSheets
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,
                    x.JobSheetNo,

                    x.ProjectId,

                    Project = x.Project == null
                        ? null
                        : new
                        {
                            x.Project.ProjectTitle,
                            x.Project.ProjectCode
                        },

                    x.WorkOrderId,

                    WorkOrder = x.WorkOrder == null
                        ? null
                        : new
                        {
                            x.WorkOrder.Id,
                            x.WorkOrder.WorkOrderNo,
                            x.WorkOrder.Title,
                            x.WorkOrder.WorkType,
                            x.WorkOrder.Status
                        },

                    x.WorkDate,
                    x.StartTime,
                    x.EndTime,
                    x.WorkDescription,
                    x.Status,

                    Members = x.Members.Select(m => new
                    {
                        m.Id,
                        m.UserId,

                        User = new
                        {
                            m.User.Id,
                            m.User.FullName,
                            m.User.JobTitle
                        }
                    }).ToList(),

                    Attachments = _context.Attachments
                        .Where(a =>
                            a.EntityType == "JobSheet" &&
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
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();
        }

        // =====================================================
        // UPLOAD FILE
        // =====================================================

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

            if (!Directory.Exists(uploadFolder))
                Directory.CreateDirectory(uploadFolder);

            var safeFileName = Path.GetFileName(file.FileName);

            var fileName = $"{Guid.NewGuid()}_{safeFileName}";

            var filePath = Path.Combine(
                uploadFolder,
                fileName);

            using (var stream = new FileStream(
                filePath,
                FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/{folder}/{entityId}/{fileName}";
        }
    }
}
