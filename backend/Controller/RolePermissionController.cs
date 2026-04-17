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
    public class RolePermissionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public RolePermissionController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.RolePermissions.AsQueryable();

                // Includes (e.g., "Customer,Items")
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(RolePermission), "u");
                    Expression? finalExpression = null;

                    // Split OR conditions first
                    var orParts = filter.Split('|');
                    foreach (var orPart in orParts)
                    {
                        Expression? orExpression = null;

                        // Split AND conditions
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
                                var equalsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));

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
                                var equalsExpr = Expression.Equal(propertyAccess, Expression.Constant(enumValue));

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(convertedValue));
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(orExpression, condition); // AND inside one OR part
                        }

                        finalExpression = finalExpression == null
                            ? orExpression
                            : Expression.OrElse(finalExpression, orExpression); // OR between parts
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<RolePermission, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }


                // OrderBy (e.g., "CreatedDate desc")
                if (!string.IsNullOrEmpty(orderBy))
                {
                    if (orderBy.ToLower().Contains("desc"))
                        query = query.OrderByDescending(q => EF.Property<object>(q, orderBy.Replace(" desc", "").Trim()));
                    else
                        query = query.OrderBy(q => EF.Property<object>(q, orderBy.Trim()));
                }

                var TotalElements = query.Count();

                var items = query
      .Skip((page - 1) * pageSize)
      .Take(pageSize)
      .Select(u => new
      {
          u.Id,
          u.SystemRole,
          u.AccessPermission,
      })
      .ToList();


                // Select (e.g., "Id,Status")
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object>();
                        foreach (var field in selectedFields)
                        {
                            var value = item.GetType().GetProperty(field)?.GetValue(item);
                            dict[field] = value ?? "null";
                        }
                        return dict;
                    });

                    return Ok(new
                    {
                        Data = projected,
                        TotalElements
                    });
                }

                return Ok(new
                {
                    Data = items,
                    TotalElements
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An unexpected error occured." });
            }

        }

        [HttpPost("Create")]
        public async Task<ActionResult<RolePermission>> AddDepartment([FromBody] CreateRolePermissionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SystemRole))
                return BadRequest(new { Error = "System Role is required." });

            try
            {
                var rolePermission = new RolePermission
                {
                    Id = Guid.NewGuid(),
                    SystemRole = request.SystemRole,
                    AccessPermission = request.AccessPermission,
                };

                rolePermission.CreatedAt = DateTime.Now;

                _context.RolePermissions.Add(rolePermission);
                await _context.SaveChangesAsync();


                var result = await _context.RolePermissions
                    .Where(d => d.Id == rolePermission.Id)
                    .Select(d => new RolePermission
                    {
                        Id = d.Id,
                        SystemRole = d.SystemRole,
                        AccessPermission = d.AccessPermission,
                    })
                    .FirstAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("RolePermissionAdded", rolePermission);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add role permission." });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<RolePermission>> UpdateRolePermission([FromBody] UpdateRolePermissionRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var rolePermission = await _context.RolePermissions.FindAsync(request.Id);
            if (rolePermission == null)
                return NotFound(new { Error = "Role Permission not found." });

            try
            {
                rolePermission.SystemRole = request.SystemRole ?? rolePermission.SystemRole;
                rolePermission.AccessPermission = request.AccessPermission;
                rolePermission.UpdatedAt = DateTime.Now;

                _context.RolePermissions.Update(rolePermission);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                var result = await _context.RolePermissions
           .Where(d => d.Id == rolePermission.Id)
           .Select(d => new RolePermission
           {
               Id = d.Id,
               SystemRole = d.SystemRole,
               AccessPermission = d.AccessPermission
           })
           .FirstAsync();
                await _hub.Clients.All.SendAsync("RolePermissionUpdated", rolePermission);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to update role permission." });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteRolePermission([FromQuery] Guid id)
        {
            var rolePermission = await _context.RolePermissions.FindAsync(id);
            if (rolePermission == null)
                return NotFound(new { Error = "Role Permission not found." });

            try
            {
                _context.RolePermissions.Remove(rolePermission);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("RolePermissionDeleted", id);

                return Ok(new { Message = "Role Permission deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete role permission." });
            }
        }
    }
}
