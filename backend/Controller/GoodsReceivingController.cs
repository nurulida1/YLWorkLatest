using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Linq.Expressions;
using System.Security.Claims;
using System.Text.Json;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class GoodsReceivingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public GoodsReceivingController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.GoodsReceivings.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(GoodsReceiving), "q");
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

                            var propertyName = kv[0].Trim();
                            var valueStr = kv[1].Trim();
                            var propertyAccess = Expression.PropertyOrField(parameter, propertyName);

                            Expression condition;
                            if (propertyAccess.Type == typeof(string))
                            {
                                var method = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                                var containsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));
                                condition = isNotEqual ? Expression.Not(containsExpr) : containsExpr;
                            }
                            else if (propertyAccess.Type == typeof(Guid) || propertyAccess.Type == typeof(Guid?))
                            {
                                var guidValue = Guid.Parse(valueStr);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(guidValue, propertyAccess.Type));
                            }
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue = Enum.Parse(propertyAccess.Type, valueStr);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(enumValue));
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, Nullable.GetUnderlyingType(propertyAccess.Type) ?? propertyAccess.Type);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(convertedValue, propertyAccess.Type));
                            }

                            orExpression = orExpression == null ? condition : Expression.AndAlso(orExpression, condition);
                        }
                        finalExpression = finalExpression == null ? orExpression : Expression.OrElse(finalExpression, orExpression);
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<GoodsReceiving, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }

                if (!string.IsNullOrEmpty(orderBy))
                {
                    bool descending = orderBy.EndsWith(" desc", StringComparison.OrdinalIgnoreCase);
                    var propertyName = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();
                    query = descending ? query.OrderByDescending(x => EF.Property<object>(x, propertyName))
                                       : query.OrderBy(x => EF.Property<object>(x, propertyName));
                }

                var totalElements = query.Count();

                var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object?>();
                        foreach (var field in selectedFields)
                        {
                            var prop = item.GetType().GetProperty(field);
                            dict[field] = prop?.GetValue(item);
                        }
                        return dict;
                    });

                    return Ok(new { Data = projected, TotalElements = totalElements });
                }

                var dtoItems = items.Select(item => item).ToList();

                return Ok(new { Data = dtoItems, TotalElements = totalElements });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Search failed.", Details = ex.Message });
            }
        }

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(string? filter = null, string? includes = null)
        {
            try
            {
                IQueryable<GoodsReceiving> query = _context.GoodsReceivings.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var filterValue = filter.Contains('=')
                        ? filter.Split('=')[1].Trim()
                        : filter.Trim();

                    if (Guid.TryParse(filterValue, out Guid guidId))
                    {
                        query = query.Where(x => x.Id == guidId);
                    }
                }

                var data = await query.FirstOrDefaultAsync();

                if (data == null)
                    return NotFound();

                var safeResult = new
                {
                    data.Id,
                    data.GRNNo,
                    data.PurchaseOrderId,
                    PurchaseOrder = data.PurchaseOrder == null ? null : new
                    {
                        PurchaseOrderNo = data.PurchaseOrder.PurchaseOrderNo,
                        Supplier = data.PurchaseOrder.Supplier,
                        PurchaseOrderItems = data.PurchaseOrder.PurchaseOrderItems
                    },
                    data.SupplierId,
                    data.ReceivedDate,
                    data.SupplierDONo,
                    data.SupplierDODate,
                    data.SupplierDOAttachment,
                    data.Status,
                    data.Remarks,
                    data.Gross,
                    data.Discount,
                    data.TotalAmount,
                    data.CreatedById,
                    Supplier = data.Supplier == null ? null : new
                    {
                        Name = data.Supplier.Name,
                        FaxNo = data.Supplier.FaxNo,
                        ContactPerson1 = data.Supplier.ContactPerson1,
                        ContactPerson2 = data.Supplier.ContactPerson2,
                        ContactNo = data.Supplier.ContactNo,
                        ACNo = data.Supplier.ACNo,
                        BillingAddress = data.Supplier.BillingAddress == null ? null : new Address
                        {
                            Id = data.Supplier.BillingAddress.Id,
                            AddressLine1 = data.Supplier.BillingAddress.AddressLine1,
                            AddressLine2 = data.Supplier.BillingAddress.AddressLine2,
                            City = data.Supplier.BillingAddress.City,
                            State = data.Supplier.BillingAddress.State,
                            Country = data.Supplier.BillingAddress.Country,
                            Poscode = data.Supplier.BillingAddress.Poscode
                        },

                        DeliveryAddress = data.Supplier.DeliveryAddress == null ? null : new Address
                        {
                            Id = data.Supplier.DeliveryAddress.Id,
                            AddressLine1 = data.Supplier.DeliveryAddress.AddressLine1,
                            AddressLine2 = data.Supplier.DeliveryAddress.AddressLine2,
                            City = data.Supplier.DeliveryAddress.City,
                            State = data.Supplier.DeliveryAddress.State,
                            Country = data.Supplier.DeliveryAddress.Country,
                            Poscode = data.Supplier.DeliveryAddress.Poscode
                        }

                    },
                    GoodsReceivingItems = data.GoodsReceivingItems?.Select(i => new
                    {
                        i.Id,
                        i.GoodsReceivingId,
                        i.PurchaseOrderItemId,
                        i.PurchaseOrderItem,
                        i.ReceivedQuantity,
                        i.TotalPrice,
                        i.UnitPrice,
                        i.Unit,
                        i.Discount,
                        i.Remarks
                    })
                };

                return Ok(safeResult);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "GetOne failed.",
                    Details = ex.Message
                });
            }
        }


        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromForm] CreateGoodsReceivingRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var itemsJson = Request.Form["goodsReceivingItems"].FirstOrDefault();

            var items = string.IsNullOrWhiteSpace(itemsJson)
    ? new List<GoodsReceivingItemRequest>()
    : JsonSerializer.Deserialize<List<GoodsReceivingItemRequest>>(
        itemsJson,
        new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

            var exists = await _context.GoodsReceivings
                .AnyAsync(x => x.GRNNo == request.GRNNo);

            if (exists)
                return BadRequest(new { message = "GRN No already exists" });

            string? filePath = null;

            if (request.SupplierDOAttachment != null)
            {
                var folder = Path.Combine("Uploads", "GRN");

                if (!Directory.Exists(folder))
                    Directory.CreateDirectory(folder);

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.SupplierDOAttachment.FileName)}";
                var fullPath = Path.Combine(folder, fileName);

                using var stream = new FileStream(fullPath, FileMode.Create);
                await request.SupplierDOAttachment.CopyToAsync(stream);

                filePath = fullPath;
            }

            var grn = new GoodsReceiving
            {
                Id = Guid.NewGuid(),
                GRNNo = request.GRNNo ?? await GenerateGRNNo(),
                PurchaseOrderId = request.PurchaseOrderId,
                SupplierId = request.SupplierId,
                ReceivedDate = request.ReceivedDate,
                SupplierDONo = request.SupplierDONo,
                SupplierDODate = request.SupplierDODate,
                SupplierDOAttachment = filePath,
                Remarks = request.Remarks,
                Gross = request.Gross,
                Discount = request.Discount,
                TotalAmount = request.TotalAmount,
                Status = "Draft",
                CreatedById = Guid.Parse(userId),
                CreatedAt = DateTimeHelper.Now()
            };

            grn.GoodsReceivingItems = items.Select(x => new GoodsReceivingItem
            {
                Id = Guid.NewGuid(),
                GoodsReceivingId = grn.Id,
                PurchaseOrderItemId = x.PurchaseOrderItemId,
                ReceivedQuantity = x.ReceivedQuantity,
                UnitPrice = x.UnitPrice,
                Unit = x.Unit,
                Discount = x.Discount,
                TotalPrice = x.TotalPrice,
                Remarks = x.Remarks
            }).ToList();

            _context.GoodsReceivings.Add(grn);
            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("GRNCreated", grn.Id);

            return Ok(MapToDto(grn));
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromForm] UpdateGoodsReceivingRequest request)
        {
            var grn = await _context.GoodsReceivings
                .Include(x => x.GoodsReceivingItems)
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (grn == null) return NotFound();

            var itemsJson = Request.Form["goodsReceivingItems"].FirstOrDefault();

            var items = string.IsNullOrWhiteSpace(itemsJson)
    ? new List<GoodsReceivingItemRequest>()
    : JsonSerializer.Deserialize<List<GoodsReceivingItemRequest>>(
        itemsJson,
        new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

            grn.GRNNo = request.GRNNo;
            grn.PurchaseOrderId = request.PurchaseOrderId;
            grn.SupplierId = request.SupplierId;
            grn.ReceivedDate = request.ReceivedDate;
            grn.SupplierDONo = request.SupplierDONo;
            grn.SupplierDODate = request.SupplierDODate;
            grn.Gross = request.Gross;
            grn.Discount = request.Discount;
            grn.TotalAmount = request.TotalAmount;
            grn.Remarks = request.Remarks;
            grn.UpdatedAt = DateTimeHelper.Now();

            _context.GoodsReceivingItems.RemoveRange(grn.GoodsReceivingItems);

            grn.GoodsReceivingItems = items.Select(x => new GoodsReceivingItem
            {
                Id = Guid.NewGuid(),
                GoodsReceivingId = grn.Id,
                PurchaseOrderItemId = x.PurchaseOrderItemId,
                ReceivedQuantity = x.ReceivedQuantity,
                UnitPrice = x.UnitPrice,
                Unit = x.Unit,
                Discount = x.Discount,
                TotalPrice = x.TotalPrice,
                Remarks = x.Remarks
            }).ToList();

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("GRNUpdated", grn.Id);

            return Ok(MapToDto(grn));
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var grn = await _context.GoodsReceivings.FindAsync(id);
            if (grn == null) return NotFound();

            var items = await _context.GoodsReceivingItems
                .Where(x => x.GoodsReceivingId == id)
                .ToListAsync();

            _context.GoodsReceivingItems.RemoveRange(items);
            _context.GoodsReceivings.Remove(grn);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("GRNDeleted", id);

            return Ok();
        }

        private async Task<string> GenerateGRNNo()
        {
            var year = DateTime.UtcNow.Year % 100;

            var last = await _context.GoodsReceivings
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.GRNNo)
                .FirstOrDefaultAsync();

            int next = 1;

            if (!string.IsNullOrEmpty(last))
            {
                var parts = last.Split('/');
                if (parts.Length >= 3 && int.TryParse(parts[2], out int num))
                    next = num + 1;
            }

            return $"YL/GRN/{next}/{year}";
        }

        private async Task UpdatePOAndInventory(GoodsReceiving grn)
        {
            var po = await _context.PurchaseOrders
                .Include(x => x.PurchaseOrderItems)
                .FirstOrDefaultAsync(x => x.Id == grn.PurchaseOrderId);

            if (po == null) return;

            foreach (var item in grn.GoodsReceivingItems)
            {
                var poItem = po.PurchaseOrderItems
                    .FirstOrDefault(x => x.Id == item.PurchaseOrderItemId);

                if (poItem == null) continue;

                poItem.ReceivedQuantity += item.ReceivedQuantity;

                var inventory = await _context.Inventories
                    .FirstOrDefaultAsync(x => x.Id == poItem.InventoryId);

                if (inventory != null)
                {
                    inventory.Quantity += item.ReceivedQuantity;
                }
            }

            var totalOrdered = po.PurchaseOrderItems.Sum(x => x.Quantity);
            var totalReceived = po.PurchaseOrderItems.Sum(x => x.ReceivedQuantity);

            if (totalReceived == 0)
                po.Status = po.Status;
            else if (totalReceived >= totalOrdered)
                po.Status = "Completed";
            else
                po.Status = "PartiallyReceived";

            await _context.SaveChangesAsync();
        }

        private object MapToDto(GoodsReceiving x)
        {
            return new
            {
                x.Id,
                x.GRNNo,
                x.PurchaseOrderId,
                x.SupplierId,
                x.ReceivedDate,
                x.SupplierDONo,
                x.SupplierDODate,
                x.Status,
                x.Gross,
                x.Discount,
                x.TotalAmount,
                x.Remarks,
                GoodsReceivingItems = x.GoodsReceivingItems?.Select(i => new
                {
                    i.Id,
                    i.PurchaseOrderItemId,
                    i.ReceivedQuantity,
                    i.Unit,
                    i.UnitPrice,
                    i.Discount,
                    i.TotalPrice,
                    i.Remarks
                })
            };
        }

        [HttpGet("generate-no")]
        public async Task<IActionResult> GenerateGoodsReceivingEndPoint()
        {
            var grnNo = await GenerateGRNNo();
            return Ok(new { grnNo });

        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(Guid id, string status)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var grn = await _context.GoodsReceivings
                .Include(x => x.GoodsReceivingItems)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (grn == null)
                return NotFound();

            var previousStatus = grn.Status;

            grn.Status = status;
            grn.UpdatedAt = DateTimeHelper.Now();

            if (previousStatus == "Draft" && status == "Confirmed")
            {
                await UpdatePOAndInventory(grn);
            }

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("GRNStatusUpdated", new
            {
                grn.Id,
                grn.Status
            });

            return Ok(new
            {
                grn.Id,
                grn.Status
            });
        }
    }
}