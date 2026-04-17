using Azure.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
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
        public async Task<ActionResult<object>> GetMany(
      int page = 1,
      int pageSize = 10,
      string? filter = null,
      string? orderBy = null,
      string? includes = null)
        {
            try
            {
                var query = _context.Projects
                    .Include(p => p.Client)
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
                                var method = typeof(string).GetMethod("Equals", new[] { typeof(string) });
                                var equalsExpr = Expression.Call(
                                    propertyAccess,
                                    method!,
                                    Expression.Constant(valueStr)
                                );

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
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
                        var lambda = Expression.Lambda<Func<Project, bool>>(finalExpression, parameter);
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
                        p.ProjectCode,
                        p.ProjectTitle,
                        p.Priority,
                        p.DueDate,

                        Client = p.Client == null ? null : new
                        {
                          Name = p.Client.Name
                        }
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
        [HttpPost("Create")]
        public async Task<ActionResult<Project>> AddDepartment([FromBody] CreateProjectRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ProjectCode))
                return BadRequest(new { Error = "Project Code is required." });

            try
            {
                var project = new Project
                {
                    Id = Guid.NewGuid(),
                    ProjectCode = request.ProjectCode,
                    ProjectTitle = request.ProjectTitle,
                    ClientId = request.ClientId,
                    Description = request.Description,
                    DueDate = request.DueDate,
                    Priority = request.Priority,                
                };

                project.CreatedAt = DateTime.Now;

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();


                var result = await _context.Projects
                    .Where(d => d.Id == project.Id)
                    .Select(d => new ProjectDto
                    {
                        Id = d.Id,
                        ProjectCode = d.ProjectCode,
                        ProjectTitle = d.ProjectTitle,
                        Description = d.Description,
                        Priority = d.Priority,
                        DueDate = d.DueDate,
                        ClientId = d.ClientId,
                        Client = d.Client == null ? null : new Company
                        {
                           Name = d.Client.Name
                        }
                    })
                    .FirstAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("ProjectAdded", project);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add project." });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<Project>> UpdateProject([FromBody] UpdateProjectRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var project = await _context.Projects.FindAsync(request.Id);
            if (project == null)
                return NotFound(new { Error = "Project not found." });

            try
            {
                project.ProjectCode = request.ProjectCode ?? project.ProjectCode;
                project.ProjectTitle = request.ProjectTitle;
                project.Description = request.Description;
                project.Priority = request.Priority;
                project.DueDate = request.DueDate;
                project.ClientId = request.ClientId;
                project.UpdatedAt = DateTime.Now;

                _context.Projects.Update(project);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                var result = await _context.Projects
           .Where(d => d.Id == project.Id)
           .Select(d => new ProjectDto
           {
               Id = d.Id,
               ProjectCode = d.ProjectCode,
               ProjectTitle = d.ProjectTitle,
               Description = d.Description,
               Priority = d.Priority,
               DueDate = d.DueDate,
               ClientId = d.ClientId,
               Client = d.Client == null ? null : new Company
               {
                   Name = d.Client.Name

               }
           })
           .FirstAsync();
                await _hub.Clients.All.SendAsync("ProjectUpdated", project);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to update project." });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteProject([FromQuery] Guid id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return NotFound(new { Error = "Project not found." });

            try
            {
                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("ProjectDeleted", id);

                return Ok(new { Message = "Project deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete project." });
            }
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {
                var clients = await _context.Companies
                    .Select(c => new DropdownDto
                    {
                        Id = c.Id,
                        Label = c.Name 
                    })
                    .ToListAsync();

                var users = await _context.Users
                    .Select(u => new DropdownDto
                    {
                        Id = u.Id,
                        Label = u.FullName
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Clients = clients,
                    Users = users
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to load dropdown data." });
            }
        }
    }
}
