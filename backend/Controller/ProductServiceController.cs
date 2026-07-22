using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;
using Microsoft.AspNetCore.Authorization;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProductServiceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public ProductServiceController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.ProductServices.AsQueryable();

                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(ProductService), "u");
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
                        var lambda = Expression.Lambda<Func<ProductService, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }


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
        u.ItemCode,
        u.Description,
        u.Type,
        u.Unit,
        u.Price,
        u.InventoryId,
        AvailableStock = u.Inventory != null
            ? u.Inventory.Quantity - u.Inventory.ReservedQuantity
            : (decimal?)null
    })
    .ToList();


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
        public async Task<ActionResult<ProductService>> AddProductService([FromBody] CreateProductServiceRequest request)
        {
            try
            {
                var product = new ProductService
                {
                    Id = Guid.NewGuid(),
                    ItemCode = request.ItemCode,
                    Description = request.Description,
                    Type = request.Type,
                    Unit = request.Unit,
                    Price = request.Price,
                    InventoryId = request.InventoryId
                };

                product.CreatedAt = DateTimeHelper.Now();

                _context.ProductServices.Add(product);
                await _context.SaveChangesAsync();

                var result = new
                {
                    product.Id,
                    product.ItemCode,
                    product.Description,
                    product.Type,
                    product.Unit,
                    product.Price,
                    product.InventoryId,
                    AvailableStock = product.AvailableStock
                };

                await _hub.Clients.All.SendAsync("ProductServiceAdded", result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add product service." });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult> UpdateProductService([FromBody] UpdateProductServiceRequest request)
        {
            var product = await _context.ProductServices.FindAsync(request.Id);
            if (product == null)
                return NotFound(new { Error = "Product service not found." });

            try
            {
                product.ItemCode = request.ItemCode ?? product.ItemCode;
                product.Description = request.Description ?? product.Description;
                product.Type = request.Type;
                product.Unit = request.Unit ?? product.Unit;
                product.Price = request.Price ?? product.Price;
                product.InventoryId = request.InventoryId;
                product.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();

                var result = new
                {
                    product.Id,
                    product.ItemCode,
                    product.Description,
                    product.Type,
                    product.Unit,
                    product.Price,
                    product.InventoryId,
                    AvailableStock = product.AvailableStock
                };

                await _hub.Clients.All.SendAsync("ProductServiceUpdated", result);

                return Ok(result);
            }
            catch
            {
                return StatusCode(500, new { Error = "Failed to update product service." });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteProductService([FromQuery] Guid id)
        {
            var product = await _context.ProductServices.FindAsync(id);
            if (product == null)
                return NotFound(new { Error = "Product service not found." });

            try
            {
                _context.ProductServices.Remove(product);
                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("ProductServiceDeleted", id);

                return Ok(new { Message = "Product service deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete product service." });
            }
        }
    }
}
