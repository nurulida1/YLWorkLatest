using Azure.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.Linq.Expressions;
using System.Reflection;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupplierController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public SupplierController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.Suppliers.AsQueryable();

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
                    var parameter = Expression.Parameter(typeof(Supplier), "u");
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
                        var lambda = Expression.Lambda<Func<Supplier, bool>>(finalExpression, parameter);
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
                   .Take(pageSize)
                   .Select(u => new
                   {
                       u.Id,
                       u.Name,
                       u.ContactPerson,
                       u.ContactNo,
                       u.Email,
                       u.CreatedAt,
                       u.Status,
                       u.Balance,
                       u.BillingAddress, // Structured Object
                       u.DeliveryAddress // Structured Object
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
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] CreateSupplierRequest request)
        {
            if (request == null) return BadRequest("Request data is missing.");

            // Start a transaction if you want to be extra safe, 
            // though SaveChangesAsync handles this simple case fine.
            try
            {
                var supplier = new Supplier
                {
                    Id = Guid.NewGuid(),
                    Name = request.Name,
                    ContactPerson = request.ContactPerson,
                    ContactNo = request.ContactNo,
                    Email = request.Email,
                    Status = "Active",

                    // EF will detect these new objects and insert them into the Address table
                    BillingAddress = new Address
                    {
                        Id = Guid.NewGuid(),
                        Name = request.BillingAddress.Name ?? "Billing",
                        AddressLine1 = request.BillingAddress.AddressLine1,
                        AddressLine2 = request.BillingAddress.AddressLine2,
                        City = request.BillingAddress.City,
                        State = request.BillingAddress.State,
                        Country = request.BillingAddress.Country,
                        Poscode = request.BillingAddress.Poscode
                    },

                    DeliveryAddress = new Address
                    {
                        Id = Guid.NewGuid(),
                        Name = request.DeliveryAddress.Name ?? "Delivery",
                        AddressLine1 = request.DeliveryAddress.AddressLine1,
                        AddressLine2 = request.DeliveryAddress.AddressLine2,
                        City = request.DeliveryAddress.City,
                        State = request.DeliveryAddress.State,
                        Country = request.DeliveryAddress.Country,
                        Poscode = request.DeliveryAddress.Poscode
                    }
                };

                _context.Suppliers.Add(supplier);
                await _context.SaveChangesAsync();

                // Return the created client (or a DTO)
                return Ok(supplier);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Database failure", Details = ex.Message });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<Supplier>> UpdateClient([FromBody] UpdateSupplierRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 1. Fetch the client WITH their addresses included
            var supplier = await _context.Suppliers
                .Include(c => c.BillingAddress)
                .Include(c => c.DeliveryAddress)
                .FirstOrDefaultAsync(c => c.Id == request.Id);

            if (supplier == null)
                return NotFound(new { Error = "Supplier not found." });

            try
            {
                // 2. Update Client Properties
                supplier.Name = request.Name ?? supplier.Name;
                supplier.ContactNo = request.ContactNo ?? supplier.ContactNo;
                supplier.ContactPerson = request.ContactPerson ?? supplier.ContactPerson;
                supplier.Email = request.Email ?? supplier.Email;
                supplier.UpdatedAt = DateTime.UtcNow;

                // 3. Update Billing Address
                if (request.BillingAddress != null)
                {
                    // If the client somehow doesn't have a record yet, create one
                    if (supplier.BillingAddress == null) supplier.BillingAddress = new Address { Id = Guid.NewGuid() };

                    UpdateAddressProperties(supplier.BillingAddress, request.BillingAddress, "Billing");
                }

                // 4. Update Delivery Address
                if (request.DeliveryAddress != null)
                {
                    if (supplier.DeliveryAddress == null) supplier.DeliveryAddress = new Address { Id = Guid.NewGuid() };

                    UpdateAddressProperties(supplier.DeliveryAddress, request.DeliveryAddress, "Delivery");
                }

                // 5. Save Changes
                // EF tracks the changes to the 'client' and the 'addresses' automatically
                await _context.SaveChangesAsync();

                // 6. Broadcast & Return
                await _hub.Clients.All.SendAsync("SupplierUpdated", supplier);

                return Ok(supplier);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to update supplier.", Details = ex.Message });
            }
        }

        private void UpdateAddressProperties(Address existing, AddressRequest updated, string defaultName)
        {
            existing.Name = updated.Name ?? defaultName;
            existing.AddressLine1 = updated.AddressLine1 ?? existing.AddressLine1;
            existing.AddressLine2 = updated.AddressLine2 ?? existing.AddressLine2;
            existing.City = updated.City ?? existing.City;
            existing.State = updated.State ?? existing.State;
            existing.Country = updated.Country ?? existing.Country;
            existing.Poscode = updated.Poscode != 0 ? updated.Poscode : existing.Poscode;
        }


        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return NotFound(new { Error = "Supplier not found." });


            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
            return Ok(new { Success = true });
        }


    }
}
