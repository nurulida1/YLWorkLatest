using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public ProjectController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;

        }

        [HttpGet("GetMany")]
        public ActionResult<object> GetMany(
     int page = 1,
     int pageSize = 10,
     string? filter = null,
     string? orderBy = null,
     string? select = null,
     string? includes = null)
        {
            try
            {
                var query = _context.Projects
                    .Include(p => p.Tasks) // 👈 IMPORTANT
                    .Include(p => p.ProjectMembers)
                        .ThenInclude(pm => pm.User)
                    .Include(p => p.Client)
                    .AsQueryable();

                // 1. Dynamic includes
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // 2. Dynamic filter
                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(Project), "p");
                    Expression? finalExpression = null;

                    var orParts = filter.Split('|', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var orPart in orParts)
                    {
                        Expression? orExpression = null;
                        var andParts = orPart.Split(',', StringSplitOptions.RemoveEmptyEntries);
                        foreach (var andPart in andParts)
                        {
                            bool isNotEqual = andPart.Contains("!=");
                            var kv = isNotEqual ? andPart.Split("!=") : andPart.Split('=');
                            if (kv.Length != 2) continue;

                            var property = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            var propertyAccess = Expression.PropertyOrField(parameter, property);
                            Expression condition;

                            if (propertyAccess.Type == typeof(string))
                            {
                                var method = typeof(string).GetMethod("Equals", new[] { typeof(string) });
                                var equalsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));
                                condition = isNotEqual ? Expression.Not(equalsExpr) : equalsExpr;
                            }
                            else if (propertyAccess.Type == typeof(Guid) || propertyAccess.Type == typeof(Guid?))
                            {
                                condition = Expression.Equal(propertyAccess, Expression.Constant(Guid.Parse(valueStr), propertyAccess.Type));
                            }
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue = Enum.Parse(propertyAccess.Type, valueStr);
                                condition = isNotEqual ? Expression.Not(Expression.Equal(propertyAccess, Expression.Constant(enumValue))) : Expression.Equal(propertyAccess, Expression.Constant(enumValue));
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(convertedValue));
                            }

                            orExpression = orExpression == null ? condition : Expression.AndAlso(orExpression, condition);
                        }
                        finalExpression = finalExpression == null ? orExpression : Expression.OrElse(finalExpression, orExpression);
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<Project, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }

                // 3. OrderBy
                if (!string.IsNullOrEmpty(orderBy))
                {
                    if (orderBy.ToLower().Contains("desc"))
                        query = query.OrderByDescending(q => EF.Property<object>(q, orderBy.Replace(" desc", "").Trim()));
                    else
                        query = query.OrderBy(q => EF.Property<object>(q, orderBy.Trim()));
                }

                var totalElements = query.Count();

                // 4. Pagination
                var items = query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                // 5. Dynamic projection
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                               .Select(f => f.Trim())
                                               .ToList();

                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object>();

                        foreach (var field in selectedFields)
                        {
                            var propInfo = item.GetType().GetProperty(field);
                            if (propInfo != null)
                            {
                                var value = propInfo.GetValue(item);

                                // Handle collection navigation properties dynamically
                                if (value is IEnumerable<ProjectMember> members)
                                {
                                    dict[field] = members.Select(m => new
                                    {
                                        m.UserId
                                    }).ToList();
                                }
                                else
                                {
                                    dict[field] = value ?? "null";
                                }
                            }
                            else
                            {
                                dict[field] = "null";
                            }
                        }

                        return dict;
                    });

                    return Ok(new { Data = projected, TotalElements = totalElements });
                }

                // If no select, return all fields safely
                var resultAll = items.Select(p => new
                {
                    p.Id,
                    p.ProjectTitle,
                    p.DueDate,
                    p.Description,
                    p.Status,
                    p.Priority,
                    p.ClientId,
                    Progress = p.Tasks.Count == 0
    ? 0
    : Math.Round(
        (double)p.Tasks.Count(t => t.Status == "Completed")
        / p.Tasks.Count * 100, 2),
                    Client = p.Client == null ? null : new
                    {
                        p.Client.Id,
                        p.Client.Name // only include fields you need
                    },
                    ProjectMembers = p.ProjectMembers
    .Select(pm => new ProjectMemberDto
    {
        UserId = pm.UserId,
        User = pm.User == null ? null : new UserDto
        {
            FirstName = pm.User.FirstName,
            LastName = pm.User.LastName
        }
    }).ToList()
                });

                return Ok(new { Data = resultAll, TotalElements = totalElements });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }


        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(
      string? filter = null,
      string? includes = null)
        {
            IQueryable<Project> query = _context.Projects.AsQueryable();

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
        [Authorize]
        [HttpPost("Create")]
        public async Task<ActionResult<Project>> Create([FromBody] CreateProjectRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            if (string.IsNullOrWhiteSpace(request.ProjectTitle))
                return BadRequest(new { Error = "Project Title is required." });

            try
            {
                // Step 1: create project without members
                var project = new Project
                {
                    Id = Guid.NewGuid(),
                    ProjectTitle = request.ProjectTitle,
                    Description = request.Description,
                    DueDate = request.DueDate,
                    ClientId = request.ClientId,
                    CreatedById = Guid.Parse(userIdClaim),
                    Priority = request.Priority,
                    Status = "Planning",
                    CreatedAt = DateTime.UtcNow
                };

                // Step 2: add ProjectMembers after project exists
                project.ProjectMembers = request.ProjectMembers?
                    .Select(userId => new ProjectMember
                    {
                        Id = Guid.NewGuid(),
                        ProjectId = project.Id,   // now project.Id exists
                        UserId = Guid.Parse(userId),
                        AssignedAt = DateTime.UtcNow.AddHours(8)
                    })
                    .ToList() ?? new List<ProjectMember>();

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                // Load client dynamically
                await _context.Entry(project).Reference(p => p.Client).LoadAsync();
                await _context.Entry(project)
                    .Collection(p => p.ProjectMembers)
                    .Query()
                    .Include(pm => pm.User)
                    .LoadAsync();

                // Build DTO
                var result = new ProjectDto
                {
                    Id = project.Id,
                    ProjectTitle = project.ProjectTitle,
                    Description = project.Description,
                    Priority = project.Priority,
                    DueDate = project.DueDate,
                    ClientId = project.ClientId,
                    Client = project.Client != null ? new Client
                    {
                        Id = project.Client.Id,
                        Name = project.Client.Name
                    } : null,
                    Status = project.Status,
                    ProjectMembers = project.ProjectMembers
    .Select(pm => new ProjectMemberDto
    {
        UserId = pm.UserId,
        User = pm.User != null ? new UserDto
        {
            FirstName = pm.User.FirstName,
            LastName = pm.User.LastName
        } : null
    })
    .ToList()
                };

                await _hub.Clients.All.SendAsync("ProjectAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to add project.", Details = ex.Message });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<ProjectDto>> Update([FromBody] UpdateProjectRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var project = await _context.Projects
     .Include(p => p.Client)
     .Include(p => p.ProjectMembers)
         .ThenInclude(pm => pm.User)
     .FirstOrDefaultAsync(p => p.Id == request.Id);

            if (project == null)
                return NotFound(new { Error = "Project not found." });

            try
            {
                // Update project fields
                project.ProjectTitle = request.ProjectTitle ?? project.ProjectTitle;
                project.Description = request.Description ?? project.Description;
                project.DueDate = request.DueDate ?? project.DueDate;
                project.ClientId = request.ClientId ?? project.ClientId;
                project.Priority = request.Priority ?? project.Priority;
                project.UpdatedAt = DateTime.UtcNow;

                // Sync Project Members
                if (request.ProjectMembers != null)
                {
                    var toRemove = project.ProjectMembers
                        .Where(pm => !request.ProjectMembers.Contains(pm.UserId))
                        .ToList();

                    if (toRemove.Any())
                        _context.ProjectMembers.RemoveRange(toRemove);

                    foreach (var userId in request.ProjectMembers)
                    {
                        if (!project.ProjectMembers.Any(pm => pm.UserId == userId))
                        {
                            project.ProjectMembers.Add(new ProjectMember
                            {
                                Id = Guid.NewGuid(),
                                ProjectId = project.Id,
                                UserId = userId,
                                AssignedAt = DateTime.UtcNow.AddHours(8)
                            });
                        }
                    }
                }

                // Save changes first
                await _context.SaveChangesAsync();

                // Build DTO
                var result = new ProjectDto
                {
                    Id = project.Id,
                    ProjectTitle = project.ProjectTitle,
                    DueDate = request.DueDate,
                    Description = project.Description,
                    Priority = project.Priority,
                    Status = project.Status,
                    ClientId = project.ClientId,
                    Client = project.Client != null ? new Client
                    {
                        Id = project.Client.Id,
                        Name = project.Client.Name
                    } : null,
                    ProjectMembers = project.ProjectMembers?
    .Select(pm =>
    {
        var user = pm.User;

        return new ProjectMemberDto
        {
            UserId = pm.UserId,
            User = user == null
                ? null
                : new UserDto
                {
                    FirstName = user.FirstName ?? "",
                    LastName = user.LastName ?? ""
                }
        };
    })
    .ToList() ?? new List<ProjectMemberDto>()
                };

                // Send to SignalR clients
                await _hub.Clients.All.SendAsync("ProjectUpdated", result);

                return Ok(result);
            }
            catch
            {
                return StatusCode(500, new { Error = "Failed to update project." });
            }
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateProjectStatusRequest request)
        {
            if (request.ProjectId == Guid.Empty)
                return BadRequest(new { Error = "ProjectId is required." });

            if (string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { Error = "Status is required." });

            var project = await _context.Projects.FindAsync(request.ProjectId);
            if (project == null)
                return NotFound(new { Error = "Project not found." });

            try
            {
                project.Status = request.Status;
                project.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // 🔔 Optional SignalR notification
                await _hub.Clients.All.SendAsync("ProjectStatusUpdated", new
                {
                    project.Id,
                    project.Status
                });

                return Ok(new
                {
                    project.Id,
                    project.Status
                });
            }
            catch
            {
                return StatusCode(500, new { Error = "Failed to update project status." });
            }
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {
                var clients = await _context.Clients
    .Where(c => c.Status == "Active")
    .Select(c => new
    {
        Id = c.Id,
        Name = c.Name
    })
    .OrderBy(c => c.Name)
    .ToListAsync();


                var users = await _context.Users
    .Where(u => u.Role != "SuperAdmin")
    .Select(u => new
    {
        Id = u.Id,
        FirstName = u.FirstName,
        LastName = u.LastName
    })
    .OrderBy(u => u.FirstName)
    .ToListAsync();

                return Ok(new
                {
                    Clients = clients,
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
