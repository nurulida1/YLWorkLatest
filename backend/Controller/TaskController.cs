using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaskController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public TaskController(AppDbContext context, IHubContext<NotificationHub> hub)
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
               string? select = null,
               string? includes = null)
        {
            try
            {
                var query = _context.ProjectTasks.AsQueryable();

                // 1. Dynamic Includes
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // 2. Dynamic Filtering (Expressions)
                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(ProjectTask), "u");
                    Expression? finalExpression = null;

                    foreach (var orPart in filter.Split('|'))
                    {
                        Expression? orExpression = null;
                        foreach (var andPart in orPart.Split(','))
                        {
                            bool isNotEqual = andPart.Contains("!=");
                            var kv = isNotEqual ? andPart.Split("!=") : andPart.Split('=');
                            if (kv.Length != 2) continue;

                            var propertyName = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            // Access property (handles nested properties if needed)
                            var propertyAccess = Expression.PropertyOrField(parameter, propertyName);
                            Expression condition;

                            if (propertyAccess.Type == typeof(string))
                            {
                                var method = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                                var containsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));
                                condition = isNotEqual ? Expression.Not(containsExpr) : containsExpr;
                            }
                            else if (Nullable.GetUnderlyingType(propertyAccess.Type) != null || propertyAccess.Type == typeof(Guid))
                            {
                                var converter = TypeDescriptor.GetConverter(propertyAccess.Type);
                                var convertedValue = converter.ConvertFromInvariantString(valueStr);
                                condition = isNotEqual
                                    ? Expression.NotEqual(propertyAccess, Expression.Constant(convertedValue, propertyAccess.Type))
                                    : Expression.Equal(propertyAccess, Expression.Constant(convertedValue, propertyAccess.Type));
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                condition = isNotEqual
                                    ? Expression.NotEqual(propertyAccess, Expression.Constant(convertedValue))
                                    : Expression.Equal(propertyAccess, Expression.Constant(convertedValue));
                            }

                            orExpression = orExpression == null ? condition : Expression.AndAlso(orExpression, condition);
                        }
                        finalExpression = finalExpression == null ? orExpression : Expression.OrElse(finalExpression, orExpression);
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<ProjectTask, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }

                // 3. Sorting
                if (!string.IsNullOrEmpty(orderBy))
                {
                    string prop = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();
                    query = orderBy.Contains("desc", StringComparison.OrdinalIgnoreCase)
                        ? query.OrderByDescending(x => EF.Property<object>(x, prop))
                        : query.OrderBy(x => EF.Property<object>(x, prop));
                }

                var totalElements = await query.CountAsync();

                // 4. Execution & Paging
                // Note: We include the structured addresses in the projection
                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize).Include(x => x.AssignedUsers)
                    .Select(u => new
                    {
                        u.Id,
                        u.JobTitle,
                        u.Status,
                        u.DueDate,
                        u.AssignedUsers,
                        u.Description,
                    })
                    .ToListAsync();

                // 5. Dynamic Selection (Optional)
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object?>();
                        foreach (var field in selectedFields)
                        {
                            var prop = item.GetType().GetProperty(field, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                            dict[field] = prop?.GetValue(item);
                        }
                        return dict;
                    });

                    return Ok(new { Data = projected, TotalElements = totalElements });
                }

                return Ok(new { Data = items, TotalElements = totalElements });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Search failed.", Details = ex.Message });
            }
        }

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(
      string? filter = null,
      string? includes = null)
        {
            IQueryable<ProjectTask> query = _context.ProjectTasks.AsQueryable();

            // 🔹 Dynamic includes
            if (!string.IsNullOrWhiteSpace(includes))
            {
                foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    query = query.Include(include.Trim());
                }
            }

            // 🔹 Example filter (simplified)
            if (!string.IsNullOrEmpty(filter))
            {
                query = query.Where(d => d.Id.ToString() == filter);
            }

            var data = await query.FirstOrDefaultAsync();

            if (data == null)
                return NotFound();

            return Ok(data);
        }


        [HttpPost("Create")]
        public async Task<ActionResult<ProjectTask>> Create([FromBody] CreateTaskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TaskNo))
                return BadRequest(new { Error = "Task No is required." });

            try
            {
                var task = new ProjectTask
                {
                    Id = Guid.NewGuid(),
                    TaskNo = request.TaskNo,
                    JobTitle = request.JobTitle,
                    Description = request.Description,
                    ProjectId = request.ProjectId,
                    StartDate = request.StartDate,
                    DueDate = request.DueDate,
                    Priority = request.Priority,
                    CreatedAt = DateTime.UtcNow,

                    // ✅ Direct assign arrays
                    AssignedToIds = request.AssignedToIds ?? new List<Guid>(),
                    Attachments = request.Attachments ?? Array.Empty<string>()
                };

                _context.ProjectTasks.Add(task);
                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("ProjectTaskAdded", task);

                return Ok(task);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add project task." });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult> Update([FromBody] UpdateTaskRequest request)
        {
            var task = await _context.ProjectTasks
                .FirstOrDefaultAsync(t => t.Id == request.Id);

            if (task == null)
                return NotFound(new { Error = "Task not found." });

            try
            {
                if (!string.IsNullOrWhiteSpace(request.TaskNo))
                    task.TaskNo = request.TaskNo;

                if (!string.IsNullOrWhiteSpace(request.JobTitle))
                    task.JobTitle = request.JobTitle;

                if (!string.IsNullOrWhiteSpace(request.Description))
                    task.Description = request.Description;

                if (request.StartDate.HasValue)
                    task.StartDate = request.StartDate.Value;

                if (request.DueDate.HasValue)
                    task.DueDate = request.DueDate.Value;

                if (!string.IsNullOrWhiteSpace(request.Priority))
                    task.Priority = request.Priority;

                // ✅ Update string[] directly
                if (request.AssignedToIds != null)
                    task.AssignedToIds = request.AssignedToIds;

                if (request.Attachments != null)
                    task.Attachments = request.Attachments;

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("ProjectTaskUpdated", task);

                return Ok(task);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to update project task." });
            }
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateTaskStatusRequest request)
        {
            if (request.Id == Guid.Empty)
                return BadRequest(new { Error = "Task Id is required." });

            if (string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { Error = "Status is required." });

            var task = await _context.ProjectTasks
                .FirstOrDefaultAsync(t => t.Id == request.Id);

            if (task == null)
                return NotFound(new { Error = "Project task not found." });

            try
            {
                task.Status = request.Status;
                task.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Optional SignalR
                await _hub.Clients.All.SendAsync("ProjectTaskStatusUpdated", new
                {
                    task.Id,
                    task.Status
                });

                return Ok(new
                {
                    task.Id,
                    task.Status,
                    Message = "Task status updated successfully."
                });
            }
            catch
            {
                return StatusCode(500, new { Error = "Failed to update task status." });
            }
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {
                var projects = await _context.Projects.Select(c => new
    {
        Id = c.Id,
        ProjectTitle = c.ProjectTitle,
    })
    .OrderBy(c => c.ProjectTitle)
    .ToListAsync();

                var users = await _context.Users
    .Where(c => c.IsActive == true)
    .Select(c => new
    {
        Id = c.Id,
        FirstName = c.FirstName,
        LastName = c.LastName,
    })
    .OrderBy(c => c.FirstName)
    .ToListAsync();


                return Ok(new
                {
                    Projects = projects,
                    Users = users
                });
            }
            catch
            {
                return StatusCode(500, new { Error = "Failed to load dropdown data." });
            }
        }


    }
}
