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
using ClosedXML.Excel;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectTaskController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public ProjectTaskController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.ProjectTasks.AsQueryable();

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(ProjectTask), "u");
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
                        var lambda = Expression.Lambda<Func<ProjectTask, bool>>(finalExpression, parameter);
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

                var today = DateTimeHelper.Now();

                var items = await query
      .Skip((page - 1) * pageSize)
      .Take(pageSize)
      .Select(t => new
      {
          t.Id,
          t.TaskCode,
          t.Title,
          t.Description,
          Priority =
    t.Status != "Completed" && t.DueDate < today
        ? "Critical"
    : t.Status != "Completed" && t.DueDate <= today.AddDays(3)
        ? "Critical"
    : t.Status != "Completed" && t.DueDate <= today.AddDays(7)
        ? "High"
    : t.Priority,
          t.EstimatedStartDate,
          t.DueDate,
          t.Status,
          t.ProjectId,

          Project = t.Project == null ? null : new
          {
              t.Project.Id,
              t.Project.ProjectTitle
          },

          AssignedTaskMembers = t.AssignedTaskMembers.Select(am => new
          {
              UserId = am.UserId,
              Name = am.User != null ? am.User.FullName : null
          }),
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
        public async Task<IActionResult> GetOne([FromQuery] Guid id)
        {
            var data = await _context.ProjectTasks
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,
                    x.TaskCode,
                    x.Title,
                    x.DueDate,
                    x.Description,
                    x.Priority,
                    x.Status,
                    x.ProjectId,
                    Project = x.Project == null ? null : new
                    {
                        x.Project.ProjectTitle
                    },

                    AssignedTaskMembers = x.AssignedTaskMembers.Select(pm => new
                    {
                        ProjectTaskId = pm.ProjectTaskId,
                        UserId = pm.UserId,
                        User = pm.User == null ? null : new
                        {
                            pm.User.FullName
                        }
                    }),

                    Checklists = x.Checklists.Select(mr => new
                    {
                        mr.Id,
                        mr.ProjectTaskId,
                        mr.Title,
                        mr.CompletedDate,
                        mr.IsCompleted
                    }),
                })
                .FirstOrDefaultAsync();

            if (data == null)
                return NotFound();

            return Ok(data);
        }

        [HttpPost("Create")]
        public async Task<ActionResult<ProjectTask>> AddProjectTask([FromBody] CreateProjectTaskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { Error = "Title is required." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            try
            {
                var task = new ProjectTask
                {
                    Id = Guid.NewGuid(),
                    TaskCode = await GenerateTaskCode(request.ProjectId),
                    Title = request.Title,
                    Description = request.Description,
                    ProjectId = request.ProjectId,
                    Priority = request.Priority,
                    Category = request.Category,
                    Status = request.Status ?? "NotStarted",
                    EstimatedStartDate = request.EstimatedStartDate,
                    EstimatedEndDate = request.EstimatedEndDate,
                    DueDate = request.DueDate,
                    Progress = request.Progress ?? 0,
                    Remarks = request.Remarks,
                    CreatedAt = DateTimeHelper.Now(),
                    CreatedById = Guid.Parse(userIdClaim)
                };

                _context.ProjectTasks.Add(task);
                await _context.SaveChangesAsync();

                // Assign members
                if (request.AssignedUserIds?.Any() == true)
                {
                    var assignments = request.AssignedUserIds.Select(userId => new ProjectTaskAssignment
                    {
                        Id = Guid.NewGuid(),
                        ProjectTaskId = task.Id,
                        UserId = userId,
                        AssignedDate = DateTimeHelper.Now(),
                        CreatedAt = DateTimeHelper.Now(),
                        CreatedById = Guid.Parse(userIdClaim)
                    });

                    _context.ProjectTaskAssignments.AddRange(assignments);
                }

                // Checklist
                if (request.Checklists?.Any() == true)
                {
                    var checklists = request.Checklists.Select(x => new ProjectTaskChecklist
                    {
                        Id = Guid.NewGuid(),
                        ProjectTaskId = task.Id,
                        Title = x.Title,
                        IsCompleted = x.IsCompleted,
                        CreatedAt = DateTimeHelper.Now(),
                        CreatedById = Guid.Parse(userIdClaim)
                    });

                    _context.ProjectTaskChecklists.AddRange(checklists);
                }

                await _context.SaveChangesAsync();

                var result = await GetProjectTaskDto(task.Id);

                await _hub.Clients.All.SendAsync("ProjectTaskAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to add project task.",
                    Detail = ex.Message
                });
            }
        }

        private async Task<string> GenerateTaskCode(Guid? projectId)
        {
            string prefix;

            IQueryable<ProjectTask> query = _context.ProjectTasks;

            if (projectId.HasValue)
            {
                // Task code based on project
                query = query.Where(x => x.ProjectId == projectId);

                prefix = "TASK";
            }
            else
            {
                // General task without project
                query = query.Where(x => x.ProjectId == null);

                prefix = "GEN-TASK";
            }


            var lastTask = await query
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();


            if (lastTask == null)
            {
                return $"{prefix}-0001";
            }


            var lastNumber = 0;

            if (!string.IsNullOrEmpty(lastTask.TaskCode))
            {
                var codeNumber = lastTask.TaskCode
                    .Replace($"{prefix}-", "");

                int.TryParse(codeNumber, out lastNumber);
            }


            return $"{prefix}-{(lastNumber + 1):D4}";
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] UpdateProjectTaskRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var task = await _context.ProjectTasks
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (task == null)
                return NotFound(new { Error = "Project task not found." });

            try
            {
                task.Title = request.Title;
                task.Description = request.Description;
                task.ProjectId = request.ProjectId;
                task.Priority = request.Priority;
                task.Category = request.Category;
                task.Status = request.Status;
                task.EstimatedStartDate = request.EstimatedStartDate;
                task.EstimatedEndDate = request.EstimatedEndDate;
                task.ActualStartDate = request.ActualStartDate;
                task.CompletedDate = request.CompletedDate;
                task.DueDate = request.DueDate;
                task.Progress = request.Progress ?? 0;
                task.Remarks = request.Remarks;
                task.UpdatedAt = DateTimeHelper.Now();
                task.UpdatedById = Guid.Parse(userIdClaim);

                // Replace assigned users
                var existingAssignments = await _context.ProjectTaskAssignments
                    .Where(x => x.ProjectTaskId == task.Id)
                    .ToListAsync();

                _context.ProjectTaskAssignments.RemoveRange(existingAssignments);

                if (request.AssignedUserIds?.Any() == true)
                {
                    var assignments = request.AssignedUserIds.Select(userId => new ProjectTaskAssignment
                    {
                        Id = Guid.NewGuid(),
                        ProjectTaskId = task.Id,
                        UserId = userId,
                        AssignedDate = DateTimeHelper.Now(),
                        CreatedAt = DateTimeHelper.Now(),
                        CreatedById = Guid.Parse(userIdClaim)
                    });

                    _context.ProjectTaskAssignments.AddRange(assignments);
                }

                // Replace checklist
                var existingChecklists = await _context.ProjectTaskChecklists
                    .Where(x => x.ProjectTaskId == task.Id)
                    .ToListAsync();

                _context.ProjectTaskChecklists.RemoveRange(existingChecklists);

                if (request.Checklists?.Any() == true)
                {
                    var checklists = request.Checklists.Select(x => new ProjectTaskChecklist
                    {
                        Id = Guid.NewGuid(),
                        ProjectTaskId = task.Id,
                        Title = x.Title,
                        IsCompleted = x.IsCompleted,
                        CompletedDate = x.IsCompleted ? DateTimeHelper.Now() : null,
                        CreatedAt = DateTimeHelper.Now(),
                        CreatedById = Guid.Parse(userIdClaim)
                    });

                    _context.ProjectTaskChecklists.AddRange(checklists);
                }

                await _context.SaveChangesAsync();

                var result = await GetProjectTaskDto(task.Id);

                await _hub.Clients.All.SendAsync("ProjectTaskUpdated", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update project task.",
                    Detail = ex.Message
                });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteProjectTask([FromQuery] Guid id)
        {
            var task = await _context.ProjectTasks.FindAsync(id);
            if (task == null)
                return NotFound(new { Error = "Project Task not found." });

            try
            {
                _context.ProjectTasks.Remove(task);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("ProjectTaskDeleted", id);

                return Ok(new { Message = "Project Task deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete project task." });
            }
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {
              
                var projects = await _context.Projects
                    .Select(u => new DropdownDto
                    {
                        Id = u.Id,
                        Name = u.ProjectTitle
                    })
                    .ToListAsync();

                var users = await _context.Users
                    .Select(u => new DropdownDto
                    {
                        Id = u.Id,
                        Name = u.FullName,
                        DisplayName = u.DisplayName,
                        Email = u.Email,
                        JobTitle = u.JobTitle,
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Projects = projects,
                    Users = users
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to load dropdown data." });
            }
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateProjectTaskStatusRequest request)
        {
            if (request.ProjectTaskId == Guid.Empty)
                return BadRequest(new { Error = "ProjectTaskId is required." });

            if (string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { Error = "Status is required." });

            var validStatuses = new[]
            {
        "NotStarted",
        "InProgress",
        "OnHold",
        "Completed",
        "Cancelled"
    };

            if (!validStatuses.Contains(request.Status))
                return BadRequest(new { Error = "Invalid status value." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var task = await _context.ProjectTasks
                .FirstOrDefaultAsync(x => x.Id == request.ProjectTaskId);

            if (task == null)
                return NotFound(new { Error = "Project task not found." });

            try
            {
                // Update status
                task.Status = request.Status;
                task.UpdatedAt = DateTimeHelper.Now();
                task.UpdatedById = Guid.Parse(userIdClaim);

                // Optional logic based on status
                if (request.Status == "InProgress" && task.ActualStartDate == null)
                {
                    task.ActualStartDate = DateTimeHelper.Now();
                }

                if (request.Status == "Completed")
                {
                    task.CompletedDate = DateTimeHelper.Now();
                    task.Progress = 100;
                }

                await _context.SaveChangesAsync();

                var result = new
                {
                    task.Id,
                    task.TaskCode,
                    task.Title,
                    task.Status,
                    task.Progress,
                    task.ActualStartDate,
                    task.CompletedDate
                };

                await _hub.Clients.All.SendAsync("ProjectTaskStatusUpdated", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update task status.",
                    Detail = ex.Message
                });
            }
        }

        [HttpPost("UploadFile")]
        public async Task<IActionResult> UploadFile([FromForm] UploadProjectTaskAttachmentRequest request)
        {
            if (request.ProjectTaskId == Guid.Empty)
                return BadRequest(new { Error = "ProjectTaskId is required." });

            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { Error = "File is required." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var task = await _context.ProjectTasks
                .FirstOrDefaultAsync(x => x.Id == request.ProjectTaskId);

            if (task == null)
                return NotFound(new { Error = "Project task not found." });

            try
            {
                // =========================
                // Create upload folder
                // =========================
                var folder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "ProjectTasks");

                if (!Directory.Exists(folder))
                    Directory.CreateDirectory(folder);

                // =========================
                // Generate safe filename
                // =========================
                var ext = Path.GetExtension(request.File.FileName);
                var fileName = $"{Guid.NewGuid()}{ext}";
                var fullPath = Path.Combine(folder, fileName);

                // =========================
                // Save file physically
                // =========================
                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await request.File.CopyToAsync(stream);
                }

                // =========================
                // Save DB record
                // =========================
                var attachment = new ProjectTaskAttachment
                {
                    Id = Guid.NewGuid(),
                    ProjectTaskId = request.ProjectTaskId,
                    FileName = request.File.FileName,
                    FilePath = $"/Uploads/ProjectTasks/{fileName}",
                    FileType = request.File.ContentType,
                    UploadedById = Guid.Parse(userIdClaim),
                    UploadedDate = DateTimeHelper.Now(),
                    CreatedAt = DateTimeHelper.Now(),
                    CreatedById = Guid.Parse(userIdClaim)
                };

                _context.ProjectTaskAttachments.Add(attachment);
                await _context.SaveChangesAsync();

                // =========================
                // Response
                // =========================
                var result = new
                {
                    attachment.Id,
                    attachment.FileName,
                    attachment.FilePath,
                    attachment.FileType,
                    attachment.UploadedDate
                };

                await _hub.Clients.All.SendAsync("ProjectTaskFileUploaded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to upload file.",
                    Detail = ex.Message
                });
            }
        }

        [HttpGet("GetCounts")]
        public async Task<IActionResult> GetCounts()
        {
            try
            {
                var totalTask = await _context.ProjectTasks
                    .CountAsync();


                var inProgress = await _context.ProjectTasks
                    .CountAsync(x => x.Status == "InProgress");


                var underReview = await _context.ProjectTasks
                    .CountAsync(x => x.Status == "UnderReview");


                var criticalPriority = await _context.ProjectTasks
                    .CountAsync(x => x.Priority == "Critical");


                return Ok(new
                {
                    TotalTask = totalTask,
                    InProgress = inProgress,
                    UnderReview = underReview,
                    CriticalPriority = criticalPriority
                });

            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load task counts.",
                    Detail = ex.Message
                });
            }
        }

        [HttpGet("Export")]
        public async Task<IActionResult> Export()
        {
            try
            {
                var tasks = await _context.ProjectTasks
                    .Include(x => x.Project)
                    .Include(x => x.AssignedTaskMembers)
                        .ThenInclude(x => x.User)
                    .Select(t => new
                    {
                        t.TaskCode,
                        t.Title,
                        Project = t.Project != null
                            ? t.Project.ProjectTitle
                            : "-",
                        Priority =
                            t.Status != "Completed" &&
                            t.DueDate != null &&
                            t.DueDate <= DateTimeHelper.Now().AddDays(3)
                                ? "Critical"
                                : t.Priority,
                        t.Status,
                        t.DueDate,
                        AssignedUsers = string.Join(", ",
                            t.AssignedTaskMembers
                            .Where(x => x.User != null)
                            .Select(x => x.User.FullName))
                    })
                    .ToListAsync();


                using var workbook = new XLWorkbook();

                var worksheet = workbook.Worksheets.Add("Project Tasks");


                // Header
                worksheet.Cell(1, 1).Value = "Task Code";
                worksheet.Cell(1, 2).Value = "Task Name";
                worksheet.Cell(1, 3).Value = "Project";
                worksheet.Cell(1, 4).Value = "Assignee";
                worksheet.Cell(1, 5).Value = "Due Date";
                worksheet.Cell(1, 6).Value = "Priority";
                worksheet.Cell(1, 7).Value = "Status";


                // Data
                for (int i = 0; i < tasks.Count; i++)
                {
                    var row = i + 2;

                    worksheet.Cell(row, 1).Value = tasks[i].TaskCode;
                    worksheet.Cell(row, 2).Value = tasks[i].Title;
                    worksheet.Cell(row, 3).Value = tasks[i].Project;
                    worksheet.Cell(row, 4).Value = tasks[i].AssignedUsers;
                    worksheet.Cell(row, 5).Value = tasks[i].DueDate?.ToString("dd/MM/yyyy");
                    worksheet.Cell(row, 6).Value = tasks[i].Priority;
                    worksheet.Cell(row, 7).Value = tasks[i].Status;
                }


                // Styling
                var header = worksheet.Range("A1:G1");

                header.Style.Font.Bold = true;
                header.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;


                worksheet.Columns().AdjustToContents();


                using var stream = new MemoryStream();

                workbook.SaveAs(stream);

                stream.Position = 0;


                return File(
                    stream.ToArray(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"ProjectTasks_{DateTime.Now:yyyyMMddHHmmss}.xlsx"
                );

            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to export project tasks.",
                    Detail = ex.Message
                });
            }
        }

        private async Task<ProjectTask> GetProjectTaskDto(Guid taskId)
        {
            return await _context.ProjectTasks
                .Include(t => t.AssignedTaskMembers)
                    .ThenInclude(a => a.User)
                .Include(t => t.Checklists)
                .Where(t => t.Id == taskId)
                .Select(t => new ProjectTask
                {
                    Id = t.Id,
                    ProjectId = t.ProjectId,
                    TaskCode = t.TaskCode,
                    Title = t.Title,
                    Description = t.Description,
                    Priority = t.Priority,
                    Category = t.Category,
                    Status = t.Status,
                    EstimatedStartDate = t.EstimatedStartDate,
                    EstimatedEndDate = t.EstimatedEndDate,
                    ActualStartDate = t.ActualStartDate,
                    CompletedDate = t.CompletedDate,
                    DueDate = t.DueDate,
                    Progress = t.Progress,
                    Remarks = t.Remarks,

                    AssignedTaskMembers = t.AssignedTaskMembers
    .Select(a => new ProjectTaskAssignment
    {
        Id = a.Id,
        ProjectTaskId = a.ProjectTaskId,
        UserId = a.UserId,
        AssignedDate = a.AssignedDate,
        User = a.User == null ? null : new User
        {
            Id = a.User.Id,
            FullName = a.User.FullName,
            Email = a.User.Email
        }
    })
    .ToList(),

                    Checklists = t.Checklists
                        .Select(c => new ProjectTaskChecklist
                        {
                            Id = c.Id,
                            Title = c.Title,
                            IsCompleted = c.IsCompleted,
                            CompletedDate = c.CompletedDate
                        })
                        .ToList()
                })
                .FirstAsync();
        }
    }
}
