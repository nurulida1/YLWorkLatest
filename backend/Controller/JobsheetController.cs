using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using System.Security.Claims;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobSheetController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public JobSheetController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;

        }

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
                var query = _context.JobSheets
                    .Include(p => p.ProjectTask).Include(p => p.Members)
        .ThenInclude(pm => pm.User)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(Project), "u");
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

                            if (kv.Length != 2) continue;

                            var property = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            var propertyAccess = Expression.PropertyOrField(parameter, property);

                            Expression condition;

                            if (propertyAccess.Type == typeof(string))
                            {
                                var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes)!;

                                var propertyToLower = Expression.Call(propertyAccess, toLowerMethod);
                                var valueToLower = Expression.Constant(valueStr.ToLower());

                                var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) })!;

                                var containsExpr = Expression.Call(propertyToLower, containsMethod, valueToLower);

                                condition = isNotEqual
                                    ? Expression.Not(containsExpr)
                                    : containsExpr;
                            }
                            else if (propertyAccess.Type == typeof(Guid) || propertyAccess.Type == typeof(Guid?))
                            {
                                condition = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(Guid.Parse(valueStr), propertyAccess.Type)
                                );
                            }
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue = Enum.Parse(propertyAccess.Type, valueStr);
                                var equalsExpr = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(enumValue)
                                );

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                condition = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(convertedValue)
                                );
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(orExpression, condition);
                        }

                        finalExpression = finalExpression == null
                            ? orExpression
                            : Expression.OrElse(finalExpression, orExpression);
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<JobSheet, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }
                if (!string.IsNullOrEmpty(orderBy))
                {
                    if (orderBy.ToLower().Contains("desc"))
                        query = query.OrderByDescending(q =>
                            EF.Property<object>(q, orderBy.Replace(" desc", "").Trim()));
                    else
                        query = query.OrderBy(q =>
                            EF.Property<object>(q, orderBy.Trim()));
                }
                var totalElements = await query.CountAsync();

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        p.Id,
                        p.JobSheetNo,
                        p.WorkDate,
                        p.StartTime,
                        p.EndTime,
                        p.WorkDescription,
                        p.Status,
                        p.ProjectId,
                        Project = p.Project == null ? null : new
                        {
                            ProjectTitle = p.Project.ProjectTitle
                        },
                        p.ProjectTaskId,
                        ProjectTask = p.ProjectTask == null ? null : new
                        {
                            Title = p.ProjectTask.Title
                        },
                        Members = p.Members.Select(pm => new
                        {
                            UserId = pm.UserId,
                            Name = pm.User.FullName
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Data = items,
                    TotalElements = totalElements
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(string? filter = null)
        {
            var query = _context.JobSheets
    .Include(x => x.ProjectTask)
    .Include(x => x.Members)
        .ThenInclude(pm => pm.User)
    .AsQueryable();


            var filterValue = filter?.Split('=')[1];


            if (!Guid.TryParse(filterValue, out Guid id))
                return BadRequest("Invalid Id");

            var data = await query

                .Where(x => x.Id == id)

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
                    Project = x.Project == null ? null : new
                    {
                        ProjectTitle = x.Project.ProjectTitle
                    },
                    x.ProjectTaskId,
                    ProjectTask = x.ProjectTask == null ? null : new
                    {
                        Title = x.ProjectTask.Title
                    },
                    Attachments = x.Attachments

                        .Where(a =>
                            a.EntityType == "Project"
                            &&
                            a.EntityId == x.Id
                        )

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
                        .Select(pm => new JobSheetMember
                        {
                            JobSheetId = x.Id,

                            UserId = pm.User.Id,
                            User = pm.User == null
                            ? null
                            : new UserDto
                            {
                                Id = pm.User.Id,
                                FullName = pm.User.FullName,
                                JobTitle = pm.User.JobTitle
                            }

                        }).ToList(),
                })

                .FirstOrDefaultAsync();



            if (data == null)
                return NotFound();



            return Ok(data);
        }

        [HttpPost("Create")]
        public async Task<ActionResult<JobSheet>> AddJobSheet(
    [FromForm] CreateJobSheetRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.JobSheetNo))
                return BadRequest(new { Error = "JobSheet No is required." });


            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });


            try
            {
                var userId = Guid.Parse(userIdClaim);


                var jobsheet = new JobSheet
                {
                    Id = Guid.NewGuid(),

                    JobSheetNo = request.JobSheetNo,

                    ProjectId = request.ProjectId,

                    ProjectTaskId = request.ProjectTaskId,

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

                // ===============================
                // Add Project Members
                // ===============================

                if (request.Members != null &&
                    request.Members.Any())
                {
                    var members = request.Members.Select(userId => new JobSheetMember
                    {
                        Id = Guid.NewGuid(),
                        JobSheetId = jobsheet.Id,
                        UserId = Guid.Parse(userId)
                    }).ToList();

                    _context.JobSheetMembers.AddRange(members);
                }

                // ===============================
                // Upload Attachments
                // ===============================

                if (request.Files != null &&
                    request.Files.Any())
                {
                    foreach (var file in request.Files)
                    {

                        var fileUrl = await UploadFile(
                            file,
                            "JobSheet",
                            jobsheet.Id
                        );


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

                await _hub.Clients.All.SendAsync(
                    "JobSheet Added",
                    jobsheet
                );

                return Ok(jobsheet);

            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to add jobsheet.",
                    Message = ex.Message,
                    InnerException = ex.InnerException?.Message,
                    InnerInnerException = ex.InnerException?.InnerException?.Message
                });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<JobSheet>> UpdateJobSheet(
    [FromForm] UpdateJobSheetRequest request)
        {

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;


            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            try
            {
                var userId = Guid.Parse(userIdClaim);

                var jobsheet = await _context.JobSheets
                    .Include(x => x.Members)
                    .FirstOrDefaultAsync(x => x.Id == request.Id);

                if (jobsheet == null)
                    return NotFound(new
                    {
                        Error = "Jobsheet not found."
                    });

                jobsheet.JobSheetNo = request.JobSheetNo;

                jobsheet.ProjectId = request.ProjectId;

                jobsheet.ProjectTaskId =
                    request.ProjectTaskId;


                jobsheet.WorkDate =
                    request.WorkDate;

                jobsheet.StartTime = request.StartTime;

                jobsheet.EndTime = request.EndTime;

                jobsheet.WorkDescription =
                    request.WorkDescription;


                jobsheet.Status =
                    request.Status;

                jobsheet.UpdatedAt =
                    DateTimeHelper.Now();

                // ===============================
                // Replace Members
                // ===============================

                var oldMembers =
                    _context.JobSheetMembers
                    .Where(x => x.JobSheetId == jobsheet.Id);

                _context.JobSheetMembers.RemoveRange(oldMembers);

                if (request.Members != null)
                {
                    var members = request.Members.Select(userId => new JobSheetMember
                    {
                        Id = Guid.NewGuid(),
                        JobSheetId = jobsheet.Id,
                        UserId = Guid.Parse(userId)
                    }).ToList();

                    _context.JobSheetMembers.AddRange(members);
                }
                // ===============================
                // Add New Attachments
                // ===============================

                if (request.Files != null &&
                   request.Files.Any())
                {

                    foreach (var file in request.Files)
                    {

                        var fileUrl =
                            await UploadFile(
                                file,
                                "JobSheet",
                                jobsheet.Id
                            );

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


                                UploadedAt =
                                    DateTimeHelper.Now(),

                                UploadedById = userId
                            }
                        );

                    }
                }

                await _context.SaveChangesAsync();

                var result = await _context.JobSheets.Include(x => x.Project)
    .Include(x => x.ProjectTask)
    .Include(x => x.Members)
        .ThenInclude(x => x.User)
    .Where(x => x.Id == jobsheet.Id)
    .Select(x => new
    {
        x.Id,
        x.JobSheetNo,
        x.ProjectId,
        Project = new {
            x.Project.ProjectTitle
        },
        x.ProjectTaskId,
        ProjectTask = new
        {
            x.ProjectTask.Title
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
            .Where(a => a.EntityType == "JobSheet" &&
                        a.EntityId == x.Id)
            .ToList()
    })
    .FirstAsync();

                await _hub.Clients.All.SendAsync(
                    "JobSheetUpdated",
                    jobsheet
                );


                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update jobsheet.",
                    Message = ex.Message
                });
            }
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var jobSheet = await _context.JobSheets
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (jobSheet == null)
                return NotFound(new { Error = "Job Sheet not found." });

            _context.JobSheetMembers.RemoveRange(jobSheet.Members);

            var attachments = _context.Attachments
                .Where(x => x.EntityType == "JobSheet" &&
                            x.EntityId == id);

            _context.Attachments.RemoveRange(attachments);

            _context.JobSheets.Remove(jobSheet);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("JobSheetDeleted", id);

            return Ok(new { Message = "Job Sheet deleted successfully." });
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateJobSheetStatusRequest request)
        {
            if (request.JobSheetId == Guid.Empty)
                return BadRequest(new { Error = "JobSheetId is required." });

            if (string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { Error = "Status is required." });

            var validStatuses = new[]
            {
        "Draft",
        "InProgress",
        "Completed",
        "Cancelled"
    };

            if (!validStatuses.Contains(request.Status))
                return BadRequest(new { Error = "Invalid status value." });

            try
            {
                var jobSheet = await _context.JobSheets
                    .FirstOrDefaultAsync(x => x.Id == request.JobSheetId);

                if (jobSheet == null)
                    return NotFound(new { Error = "Job Sheet not found." });

                jobSheet.Status = request.Status;
                jobSheet.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();

                var result = await _context.JobSheets
                    .Include(x => x.ProjectTask)
                    .Include(x => x.Members)
                        .ThenInclude(m => m.User)
                    .Where(x => x.Id == jobSheet.Id)
                    .Select(x => new
                    {
                        x.Id,
                        x.JobSheetNo,
                        x.ProjectId,
                        Project = x.Project == null ? null : new
                        {
                            x.Project.ProjectTitle
                        },
                        x.ProjectTaskId,
                        ProjectTask = x.ProjectTask == null
                            ? null
                            : new
                            {
                                x.ProjectTask.Title
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
                            .Where(a => a.EntityType == "JobSheet" &&
                                        a.EntityId == x.Id)
                            .ToList()
                    })
                    .FirstAsync();

                await _hub.Clients.All.SendAsync("JobSheetStatusUpdated", result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update job sheet status."
                });
            }
        }

        private async Task<string> UploadFile(
    IFormFile file,
    string folder,
    Guid entityId)
        {

            var uploadFolder =
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "uploads",
                    folder,
                    entityId.ToString()
                );


            if (!Directory.Exists(uploadFolder))
                Directory.CreateDirectory(uploadFolder);



            var fileName =
                $"{Guid.NewGuid()}_{file.FileName}";


            var filePath =
                Path.Combine(
                    uploadFolder,
                    fileName
                );

            using (var stream =
                new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            return
                $"/uploads/{folder}/{entityId}/{fileName}";
        }
    }
}
