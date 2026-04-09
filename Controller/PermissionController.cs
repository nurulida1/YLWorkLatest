
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
    public class PermissionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public PermissionController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.Permissions.AsQueryable();

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
                    var parameter = Expression.Parameter(typeof(Permission), "u");
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
                        var lambda = Expression.Lambda<Func<Permission, bool>>(finalExpression, parameter);
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
          u.ModuleName,
          u.Action
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
        public async Task<ActionResult<Permission>> AddPermission([FromBody] CreatePermissionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ModuleName))
                return BadRequest(new { Error = "Module name is required." });

            try
            {
                var permission = new Permission
                {
                    Id = Guid.NewGuid(),         // server generates the Id
                    ModuleName = request.ModuleName,
                    Action = request.Action
                };

                _context.Permissions.Add(permission);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("PermissionAdded", permission);

                return Ok(permission);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to add permission." });
            }
        }


        [HttpPut("Update")]
        public async Task<ActionResult<Permission>> UpdatePermission([FromBody] Permission permission)
        {
            var existingPermission = await _context.Permissions.FindAsync(permission.Id);
            if (existingPermission == null)
                return NotFound(new { Error = "Permission not found." });

            try
            {
                existingPermission.ModuleName = permission.ModuleName ?? existingPermission.ModuleName;
                existingPermission.Action = permission.Action ?? existingPermission.Action;

                _context.Permissions.Update(existingPermission);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("PermissionUpdated", existingPermission);

                return Ok(existingPermission);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to update permission." });
            }
        }
    }
}
