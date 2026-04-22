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
    public class InventoryController : ControllerBase
    {
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
                        p.ItemName,
                        p.Model,
                        p.Brand,
                        p.Description,
                        p.Unit,
                        p.Quantity,
                        p.SerialNumber,
                        p.ReferenceType,
                        p.ReferenceId,
                        p.LocationId,
                        p.SectionId,
                        p.CategoryId,
                        p.ParLevel,
                        p.Date,
                        p.Status,
                        p.Remarks,
                        p.Costs,
                        p.Attachment,
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
        
        
        [HttpPost("Create")]
        public async Task<ActionResult<Inventory>> AddInventory([FromBody] CreateInventoryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ItemName))
                return BadRequest(new { Error = "Name is required." });

            try
            {
                var inventory = new Inventory
                {
                    Id = Guid.NewGuid(),
                    ItemName = request.ItemName,
                    Brand = request.Brand,
                    Model = request.Model,
                    CategoryId = request.CategoryId,
                    Description = request.Description,
                    Unit = request.Unit,
                    Quantity = request.Quantity,
                    SerialNumber = request.SerialNumber,
                    ReferenceType = request.ReferenceType,
                    ReferenceId = request.ReferenceId,
                    LocationId = request.LocationId,
                    SectionId = request.SectionId,
                    ParLevel = request.ParLevel,
                    Date = request.Date,
                    Status = request.Status,
                    Remarks = request.Remarks,
                    Costs = request.Costs,
                    Attachment = request.Attachment
                };

                inventory.CreatedAt = DateTime.Now;

                _context.Inventories.Add(inventory);
                await _context.SaveChangesAsync();


                var result = await _context.Inventories.Include(x => x.Category)
    .Include(x => x.Location)
    .Include(x => x.Section)
    .Where(d => d.Id == inventory.Id)
    .Select(d => new
    {
        Id = d.Id,
        ItemName = d.ItemName,
        Brand = d.Brand,
        Model = d.Model,
        Description = d.Description,
        Unit = d.Unit,
        Quantity = d.Quantity,
        SerialNumber = d.SerialNumber,
        ReferenceType = d.ReferenceType,
        ReferenceId = d.ReferenceId,
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

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("InventoryAdded", inventory);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add inventory." });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<Inventory>> UpdateInventory([FromBody] UpdateInventoryRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var inventory = await _context.Inventories.FindAsync(request.Id);
            if (inventory == null)
                return NotFound(new { Error = "Inventory not found." });

            try
            {
                inventory.ItemName = request.ItemName;
                inventory.Brand = request.Brand;
                inventory.Model = request.Model;
                inventory.CategoryId = request.CategoryId;
                inventory.Description = request.Description;
                inventory.Unit = request.Unit;
                inventory.Quantity = request.Quantity;
                inventory.SerialNumber = request.SerialNumber;
                inventory.ReferenceType = request.ReferenceType;
                inventory.ReferenceId = request.ReferenceId;
                inventory.LocationId = request.LocationId;
                inventory.SectionId = request.SectionId;
                inventory.ParLevel = request.ParLevel;
                inventory.Date = request.Date;
                inventory.Status = request.Status;
                inventory.Remarks = request.Remarks;
                inventory.Costs = request.Costs;
                inventory.Attachment = request.Attachment;
                inventory.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                var result = await _context.Inventories.Include(x => x.Category)
    .Include(x => x.Location)
    .Include(x => x.Section)
           .Where(d => d.Id == inventory.Id)
           .Select(d => new
           {
               d.Id,
               d.ItemName,
               d.Brand,
               d.Model,
               d.Description,
               d.Unit,
               d.Quantity,
               d.SerialNumber,
               d.ReferenceType,
               d.ReferenceId,
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
                await _hub.Clients.All.SendAsync("InventoryUpdated", result);
                return Ok(result);
            }
            catch (Exception ex)
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

    }
}
