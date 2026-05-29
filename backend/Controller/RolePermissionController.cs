using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Model;
using Microsoft.AspNetCore.Authorization;

namespace YLWorks.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RolePermissionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RolePermissionController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RolePermission>>> GetRolePermissions()
        {
            var permissions = await _context.RolePermissions
                .Include(p => p.Module)
                .Include(p => p.Department)
                .ToListAsync();

            return Ok(permissions);
        }

        [HttpGet("by-matrix")]
        public async Task<ActionResult<IEnumerable<RolePermissionDto>>> GetPermissionsByMatrix(
    [FromQuery] string systemRole,
    [FromQuery] List<Guid>? departmentIds)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(systemRole))
                {
                    return BadRequest(new
                    {
                        Error = "System role is required."
                    });
                }

                var query = _context.RolePermissions
                    .Include(p => p.Module)
                    .Where(p => p.SystemRole.ToLower() == systemRole.ToLower());

                // Department-based filtering
                if (departmentIds != null && departmentIds.Any())
                {
                    query = query.Where(p =>
                        p.DepartmentId == null ||
                        departmentIds.Contains(p.DepartmentId.Value)
                    );
                }

                var permissions = await query
                    .Select(p => new RolePermissionDto
                    {
                        Id = p.Id,

                        SystemRole = p.SystemRole,

                        DepartmentId = p.DepartmentId,

                        ModuleId = p.SystemModuleId,

                        ModuleName = p.Module != null
                            ? p.Module.Name
                            : "",

                        ModuleKey = p.Module != null
                            ? p.Module.Code
                            : "",

                        CanCreate = p.CanCreate,
                        CanRead = p.CanRead,
                        CanUpdate = p.CanUpdate,
                        CanDelete = p.CanDelete,
                        CanUpdateStatus = p.CanUpdateStatus
                    })
                    .ToListAsync();

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load permission matrix.",
                    Details = ex.Message
                });
            }
        }

        [HttpGet("GetMany")]
        public ActionResult<object> GetMany(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? filter = null,
            [FromQuery] string? orderBy = null,
            [FromQuery] string? select = null,
            [FromQuery] string? includes = null)
        {
            try
            {
                // FIX: Query target switched from Departments to RolePermissions
                var query = _context.RolePermissions.AsQueryable();

                // Dynamic Includes handling
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // Dynamic Filtering Expression Assembly
                if (!string.IsNullOrEmpty(filter))
                {
                    // FIX: Target type changed from Department to RolePermission
                    var parameter = Expression.Parameter(typeof(RolePermission), "p");
                    Expression? finalExpression = null;

                    var orParts = filter.Split('|');
                    foreach (var orPart in orParts)
                    {
                        Expression? orExpression = null;
                        var andParts = orPart.Split(',');

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
                                var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes)!;
                                var propertyToLower = Expression.Call(propertyAccess, toLowerMethod);
                                var valueToLower = Expression.Constant(valueStr.ToLower());

                                var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) })!;
                                var containsExpr = Expression.Call(propertyToLower, containsMethod, valueToLower);

                                condition = isNotEqual ? Expression.Not(containsExpr) : containsExpr;
                            }
                            else if (propertyAccess.Type == typeof(Guid) || propertyAccess.Type == typeof(Guid?))
                            {
                                // Handle Nullable<Guid> assignment mappings
                                var parsedGuid = Guid.Parse(valueStr);
                                var underlyingType = Nullable.GetUnderlyingType(propertyAccess.Type) ?? propertyAccess.Type;
                                var constantExpr = Expression.Constant(parsedGuid, underlyingType);

                                Expression leftExpr = propertyAccess;
                                if (propertyAccess.Type != underlyingType)
                                {
                                    leftExpr = Expression.Convert(propertyAccess, underlyingType);
                                }

                                var equalsExpr = Expression.Equal(leftExpr, constantExpr);
                                condition = isNotEqual ? Expression.Not(equalsExpr) : equalsExpr;
                            }
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue = Enum.Parse(propertyAccess.Type, valueStr);
                                var equalsExpr = Expression.Equal(propertyAccess, Expression.Constant(enumValue));

                                condition = isNotEqual ? Expression.Not(equalsExpr) : equalsExpr;
                            }
                            else if (propertyAccess.Type == typeof(bool))
                            {
                                var boolValue = bool.Parse(valueStr);
                                var equalsExpr = Expression.Equal(propertyAccess, Expression.Constant(boolValue));
                                condition = isNotEqual ? Expression.Not(equalsExpr) : equalsExpr;
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                var equalsExpr = Expression.Equal(propertyAccess, Expression.Constant(convertedValue));
                                condition = isNotEqual ? Expression.Not(equalsExpr) : equalsExpr;
                            }

                            orExpression = orExpression == null ? condition : Expression.AndAlso(orExpression, condition);
                        }

                        finalExpression = finalExpression == null ? orExpression : Expression.OrElse(finalExpression, orExpression);
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<RolePermission, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }

                // Dynamic Ordering Handling
                if (!string.IsNullOrEmpty(orderBy))
                {
                    var isDescending = orderBy.ToLower().Contains("desc");
                    var cleanProperty = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Replace(" asc", "", StringComparison.OrdinalIgnoreCase).Trim();

                    if (isDescending)
                        query = query.OrderByDescending(q => EF.Property<object>(q, cleanProperty));
                    else
                        query = query.OrderBy(q => EF.Property<object>(q, cleanProperty));
                }

                var totalElements = query.Count();

                // FIX: Map actual projection shape matching RolePermissionDto design
                var items = query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        p.Id,
                        p.SystemRole,
                        p.DepartmentId,
                        DepartmentName = p.Department == null ? "Global" : p.Department.Name,
                        p.SystemModuleId,
                        ModuleName = p.Module == null ? "Unknown Module" : p.Module.Name,
                        p.CanCreate,
                        p.CanRead,
                        p.CanUpdate,
                        p.CanDelete,
                        p.CanUpdateStatus
                    })
                    .ToList();

                // Dynamic Field Selector projection processing
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object?>();
                        var type = item.GetType();
                        foreach (var field in selectedFields)
                        {
                            // Fix casing lookup matching target JSON structure properties safely
                            var prop = type.GetProperties().FirstOrDefault(p => string.Equals(p.Name, field, StringComparison.OrdinalIgnoreCase));
                            dict[field] = prop?.GetValue(item) ?? null;
                        }
                        return dict;
                    });

                    return Ok(new { Data = projected, TotalElements = totalElements });
                }

                return Ok(new { Data = items, TotalElements = totalElements });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { Error = "An unexpected error occurred processing grid collection." });
            }
        }

        [HttpPost("bulk-save")]
        public async Task<IActionResult> BulkSaveRolePermissions([FromBody] List<UpsertRolePermissionDto> dtos)
        {
            if (dtos == null || !dtos.Any())
            {
                return BadRequest("No permission configurations provided.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var dto in dtos)
                {
                    var permission = await _context.RolePermissions
                        .FirstOrDefaultAsync(p =>
                            p.SystemRole == dto.SystemRole &&
                            p.DepartmentId == dto.DepartmentId &&
                            p.SystemModuleId == dto.SystemModuleId
                        );

                    if (permission != null)
                    {
                        permission.CanCreate = dto.CanCreate;
                        permission.CanRead = dto.CanRead;
                        permission.CanUpdate = dto.CanUpdate;
                        permission.CanDelete = dto.CanDelete;
                        permission.CanUpdateStatus = dto.CanUpdateStatus;

                        _context.RolePermissions.Update(permission);
                    }
                    else
                    {
                        var newPermission = new RolePermission
                        {
                            Id = Guid.NewGuid(),
                            SystemRole = dto.SystemRole,
                            DepartmentId = dto.DepartmentId,
                            SystemModuleId = dto.SystemModuleId,
                            CanCreate = dto.CanCreate,
                            CanRead = dto.CanRead,
                            CanUpdate = dto.CanUpdate,
                            CanDelete = dto.CanDelete,
                            CanUpdateStatus = dto.CanUpdateStatus
                        };

                        await _context.RolePermissions.AddAsync(newPermission);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Permissions updated (no new records created)."
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    Message = "Error updating permissions.",
                    Details = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRolePermission(Guid id)
        {
            var rolePermission = await _context.RolePermissions.FindAsync(id);
            if (rolePermission == null)
            {
                return NotFound();
            }

            _context.RolePermissions.Remove(rolePermission);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Permission rule removed successfully." });
        }
    }
}