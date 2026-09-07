using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Text.Json;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryController : ControllerBase
    {
        private const int AuditCapPerItem = 100;

        private static readonly JsonSerializerOptions AuditJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public InventoryController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.Inventories.AsQueryable();

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(Inventory), "u");
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
                        var lambda = Expression.Lambda<Func<Inventory, bool>>(finalExpression, parameter);
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
                        p.ItemCode,
                        p.ItemName,
                        p.Model,
                        p.Brand,
                        p.Description,
                        p.Unit,
                        p.Quantity,
                        p.ReservedQuantity,
                        p.SerialNumber,
                        p.LocationId,
                        p.SectionId,
                        p.CategoryId,
                        p.ParLevel,
                        p.Date,
                        p.Status,
                        p.Remarks,
                        p.Costs,
                        p.Attachment,
                        AvailableQuantity = p.Quantity - (p.ReservedQuantity),
                        IsLowStock = p.ParLevel.HasValue && (p.Quantity - p.ReservedQuantity) <= p.ParLevel.Value,
                        Category = p.Category == null ? null : new
                        {
                            Name = p.Category.Name
                        },
                        Location = p.Location == null ? null : new
                        {
                            Name = p.Location.Name
                        },
                        Section = p.Section == null ? null : new
                        {
                            Name = p.Section.Name
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

        [HttpGet("GetOne")]
        public async Task<ActionResult<object>> GetOne([FromQuery] Guid id)
        {
            try
            {
                var result = await _context.Inventories
                    .Where(d => d.Id == id)
                    .Select(d => new
                    {
                        d.Id,
                        d.ItemCode,
                        d.ItemName,
                        d.Brand,
                        d.Model,
                        d.Description,
                        d.Unit,
                        d.Quantity,
                        d.ReservedQuantity,
                        AvailableQuantity = d.Quantity - d.ReservedQuantity,
                        d.SerialNumber,
                        d.LocationId,
                        d.SectionId,
                        d.CategoryId,
                        d.ParLevel,
                        d.Date,
                        d.Status,
                        d.Remarks,
                        d.Costs,
                        d.Attachment,
                        Category = d.Category == null ? null : new
                        {
                            d.Category.Name
                        },
                        Location = d.Location == null ? null : new
                        {
                            d.Location.Name
                        },
                        Section = d.Section == null ? null : new
                        {
                            d.Section.Name
                        }
                    })
                    .FirstOrDefaultAsync();

                if (result == null)
                    return NotFound(new { Error = "Inventory not found." });

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }

        [HttpPost("Create")]
        public async Task<ActionResult<Inventory>> AddInventory([FromBody] CreateInventoryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ItemName))
                return BadRequest(new { Error = "Name is required." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });


            try
            {
                var inventory = new Inventory
                {
                    Id = Guid.NewGuid(),
                    ItemCode = request.ItemCode,
                    ItemName = request.ItemName,
                    Brand = request.Brand,
                    Model = request.Model,
                    CategoryId = request.CategoryId,
                    Description = request.Description,
                    Unit = request.Unit,
                    Quantity = Math.Round(request.Quantity, 3, MidpointRounding.AwayFromZero),
                    ReservedQuantity = Math.Round(request.ReservedQuantity ?? 0m, 3, MidpointRounding.AwayFromZero),
                    SerialNumber = request.SerialNumber,
                    LocationId = request.LocationId,
                    SectionId = request.SectionId,
                    ParLevel = request.ParLevel,
                    Date = request.Date,
                    Status = request.Status,
                    Remarks = request.Remarks,
                    Costs = request.Costs,
                    Attachment = request.Attachment,
                    ProductServiceId = request.ProductServiceId, 
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTimeHelper.Now()
                };

                _context.Inventories.Add(inventory);
                await _context.SaveChangesAsync();

                var userId = Guid.Parse(userIdClaim);
                var userName = await ResolveUserNameAsync(userId);
                await AppendInventoryAuditAsync(
                    inventory.Id,
                    "Create",
                    userId,
                    userName,
                    BuildCreateChanges(inventory));

                var result = await _context.Inventories.Include(x => x.Category)
    .Include(x => x.Location)
    .Include(x => x.Section)
    .Where(d => d.Id == inventory.Id)
    .Select(d => new
    {
        Id = d.Id,
        ItemCode = d.ItemCode,
        ItemName = d.ItemName,
        Brand = d.Brand,
        Model = d.Model,
        Description = d.Description,
        Unit = d.Unit,
        Quantity = d.Quantity,
        ReservedQuantity = d.ReservedQuantity,
        SerialNumber = d.SerialNumber,
        LocationId = d.LocationId,
        SectionId = d.SectionId,
        CategoryId = d.CategoryId,
        ParLevel = d.ParLevel,
        Date = d.Date,
        Status = d.Status,
        Remarks = d.Remarks,
        Costs = d.Costs,
        Attachment = d.Attachment,

        Category = d.Category == null ? null : new
        {
            Name = d.Category.Name
        },

        Location = d.Location == null ? null : new
        {
            Name = d.Location.Name
        },

        Section = d.Section == null ? null : new
        {
            Name = d.Section.Name
        }
    })
    .FirstAsync();

                await _hub.Clients.All.SendAsync("InventoryAdded", new
                {
                    inventory.Id,
                    inventory.ItemName,
                    inventory.Quantity,
                    inventory.ReservedQuantity,
                    AvailableQuantity = inventory.Quantity - inventory.ReservedQuantity
                });

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add inventory." });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult> UpdateInventory([FromBody] UpdateInventoryRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (inventory == null)
                return NotFound(new { Error = "Inventory not found." });

            try
            {
                var before = SnapshotTrackedFields(inventory);

                inventory.ItemCode = request.ItemCode;
                inventory.ItemName = request.ItemName;
                inventory.Brand = request.Brand;
                inventory.Model = request.Model;
                inventory.CategoryId = request.CategoryId;
                inventory.Description = request.Description;
                inventory.Unit = request.Unit;

                inventory.Quantity = Math.Round(request.Quantity, 3, MidpointRounding.AwayFromZero);

                inventory.SerialNumber = request.SerialNumber;
                inventory.LocationId = request.LocationId;
                inventory.SectionId = request.SectionId;
                inventory.ParLevel = request.ParLevel;
                inventory.Date = request.Date;
                inventory.Status = request.Status;
                inventory.Remarks = request.Remarks;
                inventory.Costs = request.Costs;
                inventory.Attachment = request.Attachment;

                var userId = Guid.Parse(userIdClaim);
                inventory.UpdatedById = userId;
                inventory.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();

                var after = SnapshotTrackedFields(inventory);
                var fields = DiffTrackedFields(before, after);
                var changes = fields.Count == 0
                    ? new InventoryAuditChangesPayload
                    {
                        Message = "no changes made",
                        Fields = new List<InventoryAuditFieldChange>()
                    }
                    : new InventoryAuditChangesPayload
                    {
                        Message = null,
                        Fields = fields
                    };

                var userName = await ResolveUserNameAsync(userId);
                await AppendInventoryAuditAsync(
                    inventory.Id,
                    "Update",
                    userId,
                    userName,
                    changes);

                var result = await _context.Inventories
                    .Where(d => d.Id == inventory.Id)
                    .Select(d => new
                    {
                        d.Id,
                        d.ItemCode,
                        d.ItemName,
                        d.Brand,
                        d.Model,
                        d.Description,
                        d.Unit,
                        d.Quantity,
                        d.ReservedQuantity,

                        AvailableQuantity = d.Quantity - d.ReservedQuantity,

                        d.SerialNumber,
                        d.LocationId,
                        d.SectionId,
                        d.CategoryId,
                        d.ParLevel,
                        d.Date,
                        d.Status,
                        d.Remarks,
                        d.Costs,
                        d.Attachment,

                        Category = d.Category == null ? null : new
                        {
                            d.Category.Name
                        },
                        Location = d.Location == null ? null : new
                        {
                            d.Location.Name
                        },
                        Section = d.Section == null ? null : new
                        {
                            d.Section.Name
                        }
                    })
                    .FirstAsync();

                await _hub.Clients.All.SendAsync("InventoryUpdated", result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to update inventory." });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteInventory([FromQuery] Guid id)
        {
            var inventory = await _context.Inventories.FindAsync(id);
            if (inventory == null)
                return NotFound(new { Error = "Inventory not found." });

            try
            {
                _context.Inventories.Remove(inventory);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("InventoryDeleted", id);

                return Ok(new { Message = "Inventory deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete inventory." });
            }
        }

        [HttpGet("GetAudit")]
        public async Task<ActionResult<List<InventoryAuditDto>>> GetAudit(
            [FromQuery] Guid inventoryId,
            [FromQuery] int take = 10)
        {
            if (take <= 0) take = 10;
            if (take > 100) take = 100;

            var exists = await _context.Inventories.AnyAsync(x => x.Id == inventoryId);
            if (!exists)
                return NotFound(new { Error = "Inventory not found." });

            var rows = await _context.InventoryAudits
                .AsNoTracking()
                .Where(x => x.InventoryId == inventoryId)
                .OrderByDescending(x => x.CreatedAt)
                .Take(take)
                .ToListAsync();

            var result = rows.Select(x => new InventoryAuditDto
            {
                Id = x.Id,
                InventoryId = x.InventoryId,
                Action = x.Action,
                UserId = x.UserId,
                UserName = x.UserName,
                CreatedAt = x.CreatedAt,
                Changes = DeserializeChanges(x.Changes)
            }).ToList();

            return Ok(result);
        }

        [HttpGet("dropdowns")]
        public async Task<IActionResult> GetInventoryDropdowns()
        {
            var result = new InventoryDropdownResponse
            {
                Sections = await _context.SectionInventories.OrderBy(x => x.Name)
                    .Select(x => new DropdownDto
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync(),

                Categories = await _context.CategoryInventories.OrderBy(x => x.Name)
                    .Select(x => new DropdownDto
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync(),

                Locations = await _context.LocationInventories.OrderBy(x => x.Name)
                    .Select(x => new DropdownDto
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync()
            };

            return Ok(result);
        }

        private async Task<string?> ResolveUserNameAsync(Guid userId)
        {
            return await _context.Users
                .AsNoTracking()
                .Where(x => x.Id == userId)
                .Select(x => x.FullName)
                .FirstOrDefaultAsync();
        }

        private async Task AppendInventoryAuditAsync(
            Guid inventoryId,
            string action,
            Guid userId,
            string? userName,
            InventoryAuditChangesPayload changes)
        {
            _context.InventoryAudits.Add(new InventoryAudit
            {
                Id = Guid.NewGuid(),
                InventoryId = inventoryId,
                Action = action,
                UserId = userId,
                UserName = userName,
                CreatedAt = DateTimeHelper.Now(),
                Changes = JsonSerializer.Serialize(changes, AuditJsonOptions)
            });

            await _context.SaveChangesAsync();
            await CapInventoryAuditsAsync(inventoryId);
        }

        private async Task CapInventoryAuditsAsync(Guid inventoryId)
        {
            var excessIds = await _context.InventoryAudits
                .Where(x => x.InventoryId == inventoryId)
                .OrderByDescending(x => x.CreatedAt)
                .Skip(AuditCapPerItem)
                .Select(x => x.Id)
                .ToListAsync();

            if (excessIds.Count == 0) return;

            var excess = await _context.InventoryAudits
                .Where(x => excessIds.Contains(x.Id))
                .ToListAsync();

            _context.InventoryAudits.RemoveRange(excess);
            await _context.SaveChangesAsync();
        }

        private static InventoryAuditChangesPayload BuildCreateChanges(Inventory inventory)
        {
            var snapshot = SnapshotTrackedFields(inventory);
            return new InventoryAuditChangesPayload
            {
                Message = null,
                Fields = snapshot
                    .Select(kv => new InventoryAuditFieldChange
                    {
                        Field = kv.Key,
                        OldValue = null,
                        NewValue = kv.Value
                    })
                    .ToList()
            };
        }

        private static Dictionary<string, string?> SnapshotTrackedFields(Inventory inventory)
        {
            return new Dictionary<string, string?>
            {
                ["ItemCode"] = inventory.ItemCode,
                ["ItemName"] = inventory.ItemName,
                ["Brand"] = inventory.Brand,
                ["Model"] = inventory.Model,
                ["CategoryId"] = inventory.CategoryId?.ToString(),
                ["Description"] = inventory.Description,
                ["Unit"] = inventory.Unit,
                ["Quantity"] = inventory.Quantity?.ToString("0.###"),
                ["ReservedQuantity"] = inventory.ReservedQuantity?.ToString("0.###"),
                ["SerialNumber"] = inventory.SerialNumber,
                ["LocationId"] = inventory.LocationId?.ToString(),
                ["SectionId"] = inventory.SectionId?.ToString(),
                ["ParLevel"] = inventory.ParLevel?.ToString(),
                ["Status"] = inventory.Status,
                ["Remarks"] = inventory.Remarks,
                ["Costs"] = inventory.Costs?.ToString(),
                ["ProductServiceId"] = inventory.ProductServiceId?.ToString(),
            };
        }

        private static List<InventoryAuditFieldChange> DiffTrackedFields(
            Dictionary<string, string?> before,
            Dictionary<string, string?> after)
        {
            var fields = new List<InventoryAuditFieldChange>();
            foreach (var key in before.Keys)
            {
                var oldValue = NormalizeAuditValue(before[key]);
                var newValue = NormalizeAuditValue(after[key]);
                if (!string.Equals(oldValue, newValue, StringComparison.Ordinal))
                {
                    fields.Add(new InventoryAuditFieldChange
                    {
                        Field = key,
                        OldValue = oldValue,
                        NewValue = newValue
                    });
                }
            }
            return fields;
        }

        private static string? NormalizeAuditValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            return value.Trim();
        }

        private static InventoryAuditChangesPayload DeserializeChanges(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new InventoryAuditChangesPayload();
            }

            try
            {
                return JsonSerializer.Deserialize<InventoryAuditChangesPayload>(json, AuditJsonOptions)
                       ?? new InventoryAuditChangesPayload();
            }
            catch
            {
                return new InventoryAuditChangesPayload
                {
                    Message = json
                };
            }
        }

    }
}
