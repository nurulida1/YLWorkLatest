using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using System.Text.Json;
using WebApplication1.Helpers;
using ClosedXML.Excel;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SalesOrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public SalesOrderController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.SalesOrders.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(SalesOrder), "q");
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
                        var lambda = Expression.Lambda<Func<SalesOrder, bool>>(finalExpression, parameter);
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
                IQueryable<SalesOrder> query = _context.SalesOrders.AsQueryable();

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

                SalesOrder? data;

                try
                {
                    data = await query
                        .Include(x => x.SalesOrderItems)
                        .Include(x => x.Quotation)
                        .FirstOrDefaultAsync();
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new
                    {
                        Error = "Failed loading SalesOrder",
                        Details = ex.ToString()
                    });
                }

                if (data == null)
                    return NotFound();

                List<Inventory> inventories;

                try
                {
                    inventories = await _context.Inventories.AsNoTracking().ToListAsync();
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new
                    {
                        Error = "Failed loading Inventories",
                        Details = ex.ToString()
                    });
                }

                List<PurchaseOrderItem> poItems;

                try
                {
                    poItems = await _context.PurchaseOrderItems
                        .Include(x => x.PurchaseOrder)
                        .Where(x =>
                            x.SalesOrderItemId != null &&
                            x.PurchaseOrder.Status != "Rejected" &&
                            x.PurchaseOrder.Status != "Cancelled")
                        .ToListAsync();
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new
                    {
                        Error = "Failed loading PurchaseOrderItems",
                        Details = ex.ToString()
                    });
                }

                var poMap = poItems
                    .GroupBy(x => x.SalesOrderItemId)
                    .ToDictionary(
                        g => g.Key!,
                        g => new
                        {
                            OrderedQty = g.Sum(x => x.Quantity),
                            PONos = g.Select(x => x.PurchaseOrder.PurchaseOrderNo)
                                     .Distinct()
                                     .ToList()
                        });

                List<GoodsReceivingItem> grnItems;

                try
                {
                    grnItems = await _context.GoodsReceivingItems
                        .Include(x => x.PurchaseOrderItem)
                        .Where(x => x.PurchaseOrderItemId != null)
                        .ToListAsync();
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new
                    {
                        Error = "Failed loading GoodsReceivingItems",
                        Details = ex.ToString()
                    });
                }

                var receivedMap = grnItems
                    .Where(x => x.PurchaseOrderItem?.SalesOrderItemId != null)
                    .GroupBy(x => x.PurchaseOrderItem!.SalesOrderItemId)
                    .ToDictionary(
                        g => g.Key!,
                        g => g.Sum(x => x.ReceivedQuantity));

                var result = new
                {
                    data.Id,
                    data.SalesOrderNo,
                    data.SODate,
                    data.Status,
                    data.SubTotal,
                    data.Discount,
                    data.TaxAmount,
                    data.TotalAmount,
                    data.ClientPODate,
                    data.ClientPONumber,
                    data.ClientPOAttachment,
                    data.CreatedAt,
                    data.ClientId,
                    Client = data.Client == null ? null : new CompanyDto
                    {
                        Name = data.Client.Name
                    },
                    data.QuotationId,
                    Quotation = data.Quotation == null ? null : new Quotation{
                        QuotationNo = data.Quotation.QuotationNo,
                },

                    SalesOrderItems = data.SalesOrderItems.Select(i => new
                    {
                        i.Id,
                        i.Description,
                        i.Quantity,
                        i.UnitPrice,
                        i.Unit,
                        i.TotalPrice,
                        i.Discount,
                        i.TaxRate,
                        i.Item,
                        i.SortOrder,
                        i.RowType
                    })
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "GetOne failed",
                    Details = ex.ToString()
                });
            }
        }

        [HttpPost("Create")]
        public async Task<ActionResult<object>> Create([FromForm] CreateSalesOrderRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });

            if (string.IsNullOrWhiteSpace(request.SalesOrderNo))
                return BadRequest(new { Error = "Sales Order No is required for finalized records." });

            var itemsJson = Request.Form["salesOrderItems"].FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(itemsJson))
            {
                try
                {
                    request.SalesOrderItems =
                        JsonSerializer.Deserialize<List<SOItemBase>>(
                            itemsJson,
                            new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            }
                        );
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        Error = "Invalid salesOrderItems JSON",
                        RawValue = itemsJson,
                        Details = ex.Message
                    });
                }
            }

            var exists = await _context.SalesOrders
    .AnyAsync(x => x.SalesOrderNo == request.SalesOrderNo);

            if (exists)
            {
                return Ok(new
                {
                    success = false,
                    message = "Sales Order No already exists."
                });
            }

            try
            {
                string? filePath = null;

                if (request.ClientPOAttachment != null)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "SO");

                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.ClientPOAttachment.FileName)}";
                    var fullPath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await request.ClientPOAttachment.CopyToAsync(stream);
                    }

                    filePath = $"Uploads/SO/{fileName}";
                }

                var so = new SalesOrder
                {
                    Id = Guid.NewGuid(),
                    SalesOrderNo = request.SalesOrderNo ?? await GenerateSONo(),
                    CompanyId = request.CompanyId,
                    SODate = request.SODate,
                    ClientId = request.ClientId,
                    QuotationId = request.QuotationId,
                    ProjectId = request.ProjectId,

                    ClientPONumber = request.ClientPONumber,
                    ClientPODate = request.ClientPODate,

                    SubTotal = request.SubTotal,
                    Discount = request.Discount,
                    TaxAmount = request.TaxAmount,
                    TotalAmount = request.TotalAmount,
                    Notes = request.Notes,
                    Remarks = request.Remarks,
                    PaymentTerms = request.PaymentTerms,
                    ClientPOAttachment = filePath,
                    Status = "Draft",
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTimeHelper.Now()
                };

                so.SalesOrderItems = request.SalesOrderItems?.Select(x => new SalesOrderItem
                {
                    Id = Guid.NewGuid(),
                    SalesOrderId = so.Id,

                    RowType = x.RowType ?? "LineItem",
                    SortOrder = x.SortOrder,
                    Item = x.Item,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit ?? "Unit",
                    UnitPrice = x.UnitPrice,
                    Discount = x.Discount,
                    TaxRate = x.TaxRate,
                    TotalPrice = x.TotalPrice,
                }).ToList() ?? new List<SalesOrderItem>();

                var statusHistory = new SalesOrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    SalesOrderId = so.Id,
                    Status = "Draft",
                    ActionAt = DateTimeHelper.Now(),
                    ActionUserId = Guid.Parse(userIdClaim),
                    Remarks = "SO created",
                };

                _context.SalesOrders.Add(so);
                _context.SalesOrderStatusHistories.Add(statusHistory);

                await _context.SaveChangesAsync();

                var soWithRelations = await _context.SalesOrders
                    .Include(x => x.Client)
                        .ThenInclude(c => c.BillingAddress)
                    .Include(x => x.Client)
                        .ThenInclude(c => c.DeliveryAddress)
                    .Include(x => x.Project)
                    .Include(x => x.Quotation)
                    .Include(x => x.SalesOrderItems)
                    .FirstOrDefaultAsync(x => x.Id == so.Id);

                var result = MapToDto(soWithRelations);
                await _hub.Clients.All.SendAsync("SalesOrderAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to create.",
                    Details = ex.Message,
                    Inner = ex.InnerException?.Message
                });
            }
        }

        private async Task<string> GenerateSONo()
        {
            var yearShort = DateTime.UtcNow.Year % 100;

            var lastSO = await _context.SalesOrders
                .Where(q => q.SalesOrderNo.Contains($"YL/SO/") && q.SalesOrderNo.EndsWith($"/{yearShort}"))
                .OrderByDescending(q => q.CreatedAt)
                .Select(q => q.SalesOrderNo)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (!string.IsNullOrEmpty(lastSO))
            {
                var parts = lastSO.Split('/');
                if (parts.Length >= 3 && int.TryParse(parts[2], out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"YL/SO/{nextNumber}/{yearShort}";
        }

        [HttpGet("generate-no")]
        public async Task<IActionResult> GenerateSalesOrderNoEndpoint()
        {
            var salesOrderNo = await GenerateSONo();
            return Ok(new { salesOrderNo });

        }

        [HttpPut("Update")]
        public async Task<ActionResult<object>> Update([FromForm] UpdateSalesOrderRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var so = await _context.SalesOrders
    .Include(x => x.Client)
        .ThenInclude(c => c.BillingAddress)
    .Include(x => x.Client)
        .ThenInclude(c => c.DeliveryAddress)
    .Include(x => x.Project)
    .Include(x => x.Quotation)
    .Include(x => x.SalesOrderItems)
    .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (so == null)
                return NotFound(new { Error = "Sales Order not found." });

            try
            {
                var itemsJson = Request.Form["salesOrderItems"].FirstOrDefault();

                List<SOItemBase>? items = null;

                if (!string.IsNullOrWhiteSpace(itemsJson))
                {
                    items = JsonSerializer.Deserialize<List<SOItemBase>>(
                        itemsJson,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                }

                so.SalesOrderNo = request.SalesOrderNo;
                so.CompanyId = request.CompanyId;
                so.SODate = request.SODate;
                so.ClientId = request.ClientId;
                so.QuotationId = request.QuotationId;
                so.ProjectId = request.ProjectId;
                so.SubTotal = request.SubTotal;
                so.Discount = request.Discount;
                so.TaxAmount = request.TaxAmount;
                so.TotalAmount = request.TotalAmount;
                so.Notes = request.Notes;
                so.Remarks = request.Remarks;
                so.PaymentTerms = request.PaymentTerms;
                so.ClientPONumber = request.ClientPONumber;
                so.ClientPODate = request.ClientPODate;
                so.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();

                var existingItems = await _context.SalesOrderItems
                    .Where(x => x.SalesOrderId == so.Id)
                    .ToListAsync();

                _context.SalesOrderItems.RemoveRange(existingItems);
                await _context.SaveChangesAsync();

                var newItems = items?
                    .Select(x => new SalesOrderItem
                    {
                        Id = Guid.NewGuid(),
                        SalesOrderId = so.Id,
                        SortOrder = x.SortOrder,
                        RowType = x.RowType,
                        Item = x.Item,
                        Description = x.Description,
                        Quantity = x.Quantity ?? 0,
                        Unit = x.Unit,
                        UnitPrice = x.UnitPrice ?? 0,
                        Discount = x.Discount ?? 0,
                        TaxRate = x.TaxRate ?? 0,
                        TotalPrice = x.TotalPrice ?? 0,
                    })
                    .ToList() ?? new();

                await _context.SalesOrderItems.AddRangeAsync(newItems);
                await _context.SaveChangesAsync();

                await UpdateSalesOrderStatusAsync(so.Id);

                var result = MapToDto(so);

                await _hub.Clients.All.SendAsync("SalesOrderUpdated", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update sales order.",
                    Details = ex.Message,
                    Inner = ex.InnerException?.Message
                });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteSalesOrder([FromQuery] Guid id)
        {
            var so = await _context.SalesOrders.FindAsync(id);
            if (so == null)
                return NotFound(new { Error = "Sales Order not found." });

            try
            {
                var items = await _context.SalesOrderItems
    .Where(x => x.SalesOrderId == id)
    .ToListAsync();

                _context.SalesOrderItems.RemoveRange(items);
                _context.SalesOrders.Remove(so);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("SalesOrderDeleted", id);

                return Ok(new { Message = "Sales order deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete sales order." });
            }
        }

        private object MapToDto(SalesOrder q)
        {
            var items = q.SalesOrderItems ?? new List<SalesOrderItem>();

            return new
            {
                q.Id,
                q.SalesOrderNo,
                q.SODate,
                q.ProjectId,
                Project = q.Project == null ? null : new
                {
                    q.Project.ProjectCode
                },
                q.QuotationId,

                Quotation = q.Quotation == null ? null : new
                {
                    q.Quotation.QuotationNo
                },
                q.CompanyId,
                Company = q.Company == null ? null : new
                {
                    Name = q.Company.Name
                },
                q.SubTotal,
                q.TaxAmount,
                q.Discount,
                q.TotalAmount,
                q.Remarks,
                q.Notes,
                q.Status,
                q.PaymentTerms,
                q.ClientPOAttachment,
                q.ClientPONumber,
                q.ClientPODate,
                q.ClientId,
                FromCompany = q.Company,
                Client = q.Client == null ? null : new
                {
                    Id = q.Client.Id,
                    q.Client.Name,
                    q.Client.ContactNo,
                    q.Client.Email,
                    q.Client.ContactPerson1,

                    BillingAddress = q.Client.BillingAddress == null ? null : new Address
                    {
                        Id = q.Client.BillingAddress.Id,
                        AddressLine1 = q.Client.BillingAddress.AddressLine1,
                        AddressLine2 = q.Client.BillingAddress.AddressLine2,
                        City = q.Client.BillingAddress.City,
                        State = q.Client.BillingAddress.State,
                        Country = q.Client.BillingAddress.Country,
                        Poscode = q.Client.BillingAddress.Poscode
                    },

                    DeliveryAddress = q.Client.DeliveryAddress == null ? null : new Address
                    {
                        Id = q.Client.DeliveryAddress.Id,
                        AddressLine1 = q.Client.DeliveryAddress.AddressLine1,
                        AddressLine2 = q.Client.DeliveryAddress.AddressLine2,
                        City = q.Client.DeliveryAddress.City,
                        State = q.Client.DeliveryAddress.State,
                        Country = q.Client.DeliveryAddress.Country,
                        Poscode = q.Client.DeliveryAddress.Poscode
                    }
                },
                SalesOrderItems = items.Select(x => new
                {
                    x.Id,
                    x.Item,
                    x.RowType,
                    x.Description,
                    x.Quantity,
                    x.Unit,
                    x.UnitPrice,
                    x.Discount,
                    x.TaxRate,
                    x.TotalPrice
                })
            };
        }

        private SalesOrderItem MapToEntity(SOItemBase req, Guid soId)
        {
            var entity = new SalesOrderItem
            {
                Id = Guid.NewGuid(),
                SalesOrderId = soId,
                Item = req.Item,
                RowType = req.RowType,
                Description = req.Description,
                Quantity = req.Quantity,
                Unit = req.Unit,
                UnitPrice = req.UnitPrice,
                Discount = req.Discount,
                TaxRate = req.TaxRate,
                TotalPrice = req.TotalPrice,
            };

            return entity;
        }

        [HttpPut("Approve")]
        public async Task<IActionResult> Approve([FromBody] UpdateSalesOrderStatusRequest request)
        {
            if (request == null || request.Id == Guid.Empty)
                return BadRequest(new { Error = "Invalid request payload." });

            request.Status = "Confirmed";
            request.Remarks = string.IsNullOrWhiteSpace(request.Remarks)
                ? "SO approved"
                : request.Remarks;

            return await UpdateStatusInternal(request);
        }

        [HttpPut("Reject")]
        public async Task<IActionResult> Reject([FromBody] UpdateSalesOrderStatusRequest request)
        {
            if (request == null || request.Id == Guid.Empty)
                return BadRequest(new { Error = "Invalid request payload." });

            if (string.IsNullOrWhiteSpace(request.Remarks))
                return BadRequest(new { Error = "Rejection reason is required." });

            request.Status = "Rejected";
            request.Remarks = request.Remarks.Trim();

            return await UpdateStatusInternal(request);
        }

        private async Task<IActionResult> UpdateStatusInternal(UpdateSalesOrderStatusRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Error = "Invalid token." });

                var actionUserId = Guid.Parse(userIdClaim);

                var userName = await _context.Users
                    .Where(x => x.Id == actionUserId)
                    .Select(x => x.DisplayName)
                    .FirstOrDefaultAsync() ?? "System";

                var salesOrder = await _context.SalesOrders
                    .Include(so => so.SalesOrderItems)
                    .FirstOrDefaultAsync(so => so.Id == request.Id);

                if (salesOrder == null)
                    return NotFound(new { Error = "Sales Order not found." });

                // =========================
                // HEADER UPDATE
                // =========================
                salesOrder.Status = request.Status;
                salesOrder.Remarks = request.Remarks?.Trim();
                salesOrder.SubTotal = request.SubTotal ?? 0m;
                salesOrder.Discount = request.Discount ?? 0m;
                salesOrder.TaxAmount = request.TaxAmount ?? 0m;
                salesOrder.TotalAmount = request.TotalAmount ?? 0m;
                salesOrder.UpdatedAt = DateTime.UtcNow;

                // =========================
                // ITEMS UPDATE (SAFE NULL HANDLING)
                // =========================
                if (request.Items?.Any() == true)
                {
                    foreach (var itemDto in request.Items)
                    {
                        var existingItem = salesOrder.SalesOrderItems
                            .FirstOrDefault(i => i.Id == itemDto.Id);

                        if (existingItem == null)
                            continue;

                        existingItem.Quantity = itemDto.Quantity;
                        existingItem.UnitPrice = itemDto.UnitPrice ?? 0m;
                        existingItem.Discount = itemDto.Discount ?? 0m;
                        existingItem.Unit = itemDto.Unit;
                        existingItem.TaxRate = itemDto.TaxRate ?? 0m;
                        existingItem.TotalPrice = itemDto.TotalPrice ?? 0m;
                    }
                }

                // =========================
                // HISTORY
                // =========================
                var history = new SalesOrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    SalesOrderId = request.Id,
                    Status = request.Status,
                    ActionUserId = actionUserId,
                    ActionAt = DateTime.UtcNow,
                    Remarks =
                        request.Remarks ??
                        GenerateStatusRemark(request.Status, userName)
                };

                _context.SalesOrderStatusHistories.Add(history);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = $"Sales order status updated to {request.Status} successfully."
                });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    Error = "Database error occurred while updating order.",
                    Details = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Unexpected error occurred.",
                    Details = ex.Message
                });
            }
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateSalesOrderStatusRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            if (request.Id == Guid.Empty || string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { Error = "Invalid request." });

            if (request.Status == "Rejected" && string.IsNullOrWhiteSpace(request.Remarks))
            {
                return BadRequest(new { Error = "Rejection reason is required." });
            }

            var actionUserId = Guid.Parse(userIdClaim);

            var userName = await _context.Users
                .Where(x => x.Id == actionUserId)
                .Select(x => x.DisplayName ?? "System")
                .FirstOrDefaultAsync();

            var so = await _context.SalesOrders.FirstOrDefaultAsync(x => x.Id == request.Id);

            if (so == null)
                return NotFound();

            if (so.Status == "Confirmed" || so.Status == "Rejected")
            {
                return BadRequest(new { Error = "This SO is already finalized." });
            }

            so.Status = request.Status;

            _context.SalesOrders.Update(so);

            var history = new SalesOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                SalesOrderId = request.Id,
                Status = request.Status,
                ActionUserId = actionUserId,
                ActionAt = DateTimeHelper.Now(),
                Remarks = request.Remarks ?? GenerateStatusRemark(request.Status, userName ?? "System")
            };

            _context.SalesOrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("SalesOrderStatusUpdated", new
            {
                so.Id,
                so.Status
            });

            return Ok(new
            {
                so.Id,
                so.Status,
                Message = "Status updated successfully"
            });
        }

        private string GenerateStatusRemark(string status, string userName)
        {
            return status switch
            {
                "Reviewed" => $"SO reviewed by {userName}",
                "Approved" => $"SO approved by {userName}",
                "Rejected" => $"SO rejected by {userName}",
                "Sent" => $"SO sent by {userName} to supplier",
                _ => $"SO updated to {status} by {userName}"
            };
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetSODropdown()
        {
            try
            {
                var quotationsData = await _context.Quotations
                    .Include(x => x.FromCompany)
                    .Include(x => x.Client)
                    .Include(x => x.Project)
                    .Include(x => x.QuotationItems)
                    .Where(x => x.Status == "Accepted")
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();


                var quotation = quotationsData.Select(x => new QuotationDropdownDto
                {
                    Id = x.Id,
                    QuotationNo = x.QuotationNo,
                    ClientId = x.ClientId,
                    TotalAmount = x.TotalAmount,
                    FromCompanyId = x.FromCompanyId,
                    CompanyName = x.FromCompany?.Name,

                    Items = MapItems(
                        x.QuotationItems
                            .OrderBy(i => i.SortOrder)
                            .ToList()
                    )
                }).ToList();


                var projects = await _context.Projects
                    .OrderByDescending(x => x.CreatedAt)
                    .Select(x => new ProjectDropdownItem
                    {
                        Id = x.Id,
                        ProjectCode = x.ProjectCode,
                        ProjectTitle = x.ProjectTitle,
                    })
                    .ToListAsync();


                var clients = await _context.Companies
                    .Where(x => x.Type == CompanyType.Client)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync();


                var suppliers = await _context.Companies
                    .Where(x => x.Type == CompanyType.Supplier)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync();


                var companies = await _context.Companies
                    .Where(x => x.Type == CompanyType.Own)
                    .OrderBy(x => x.Name)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync();


                var users = await _context.Users
                    .Where(x => x.JobTitle != "SuperAdmin")
                    .OrderBy(x => x.FullName)
                    .Select(x => new UserDto
                    {
                        Id = x.Id,
                        FullName = x.FullName,
                        DisplayName = x.DisplayName,
                    })
                    .ToListAsync();


                return Ok(new PurchaseOrderDropdownDto
                {
                    Quotations = quotation,
                    Projects = projects,
                    Companies = companies,
                    Suppliers = suppliers,
                    Clients = clients,
                    Users = users
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load dropdown",
                    Details = ex.Message
                });
            }
        }

        private static List<QuotationItemDto> MapItems(List<QuotationItems> items)
        {
            if (items == null || items.Count == 0)
                return new List<QuotationItemDto>();

            return items
                .OrderBy(x => x.SortOrder)
                .Select(i => new QuotationItemDto
                {
                    Id = i.Id,
                    RowType = i.RowType,
                    Item = i.Item,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    Unit = i.Unit,
                    UnitPrice = i.UnitPrice,
                    Discount = i.Discount,
                    TotalPrice = i.TotalPrice,
                    SortOrder = i.SortOrder
                })
                .ToList();
        }

        private async Task UpdateSalesOrderFromPOAsync(Guid purchaseOrderId)
        {
            var po = await _context.PurchaseOrders
                .FirstOrDefaultAsync(x => x.Id == purchaseOrderId);

            if (po == null) return;

            var salesOrders = await _context.SalesOrders
                .Where(x => x.QuotationId == po.QuotationId)
                .ToListAsync();

            foreach (var so in salesOrders)
            {
                await UpdateSalesOrderStatusAsync(so.Id);
            }
        }

        private static readonly string[] ManualStatuses =
{
    "Draft",
    "Submitted",
    "Reviewed",
    "Approved",
    "Rejected",
    "Cancelled"
};

        private async Task UpdateSalesOrderStatusAsync(Guid salesOrderId)
        {
            var so = await _context.SalesOrders
                .Include(x => x.SalesOrderItems)
                .FirstOrDefaultAsync(x => x.Id == salesOrderId);

            if (so == null) return;

            if (ManualStatuses.Contains(so.Status))
                return;

            var items = so.SalesOrderItems;

            if (items == null || !items.Any())
            {
                so.Status = "Draft";
            }
            else
            {
                bool allDelivered = items.All(x => x.QuantityDelivered >= (x.Quantity ?? 0));
                bool partiallyDelivered = items.Any(x => x.QuantityDelivered > 0);

                so.Status =
                    allDelivered ? "Completed" :
                    partiallyDelivered ? "PartiallyDelivered" :
                    "In Progress";
            }

            _context.SalesOrders.Update(so);
            await _context.SaveChangesAsync();
        }

        [HttpPost("GenerateDO")]
        public async Task<IActionResult> GenerateDO([FromBody] GenerateDORequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var actionUserId = Guid.Parse(userIdClaim);

            var userName = await _context.Users
                .Where(x => x.Id == actionUserId)
                .Select(x => x.DisplayName ?? "System")
                .FirstOrDefaultAsync();


            var so = await _context.SalesOrders
                .Include(x => x.SalesOrderItems)
                .Include(x => x.DeliveryOrders)
                .FirstOrDefaultAsync(x => x.Id == request.SalesOrderId);

            if (so == null)
                return NotFound(new { message = "Sales Order not found" });

            if (so.Status != "Confirmed" && so.Status != "InProgress")
                return BadRequest(new { message = "SO must be confirmed first." });

            var selectedItems = so.SalesOrderItems
                .Where(x => request.SalesOrderItemIds.Contains(x.Id))
                .ToList();

            var doEntity = new DeliveryOrder
            {
                Id = Guid.NewGuid(),
                DeliveryOrderNo = await GenerateDONo(),
                SalesOrderId = so.Id,
                SenderCompanyId = so.CompanyId,
                ReceiverCompanyId = so.ClientId,
                PaymentTerms = so.PaymentTerms,
                Status = "Draft"
            };

            doEntity.DeliveryOrderItems = selectedItems.Select(x => new DeliveryOrderItem
            {
                Id = Guid.NewGuid(),
                DeliveryOrderId = doEntity.Id,
                Description = x.Description,
                QuantityOrdered = x.Quantity,
                QuantityDelivered = 0,
                Unit = x.Unit,
                Remarks = null
            }).ToList();

            _context.DeliveryOrders.Add(doEntity);

            so.Status = "InProgress";

            var history = new DeliveryOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                DeliveryOrderId = doEntity.Id,
                Status = "Draft",
                ActionUserId = actionUserId,
                ActionAt = DateTimeHelper.Now(),
                Remarks = $"DO Draft initialized from Sales Order {so.SalesOrderNo ?? ""}"
            };

            _context.DeliveryOrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            await UpdateSalesOrderStatusFromDO(so.Id, actionUserId);

            return Ok(new
            {
                message = "Delivery Order created successfully",
                deliveryOrder = doEntity,
                salesOrderStatus = so.Status
            });
        }

        private async Task UpdateSalesOrderStatusFromDO(Guid salesOrderId, Guid actionUserId)
        {
            var userName = await _context.Users
                .Where(x => x.Id == actionUserId)
                .Select(x => x.DisplayName ?? "System")
                .FirstOrDefaultAsync();

            var so = await _context.SalesOrders
                .Include(x => x.SalesOrderItems)
                .Include(x => x.DeliveryOrders)
                    .ThenInclude(d => d.DeliveryOrderItems)
                .FirstOrDefaultAsync(x => x.Id == salesOrderId);

            if (so == null) return;

            var totalOrdered = so.SalesOrderItems?
                .Where(x => x.Quantity != null)
                .Sum(x => x.Quantity ?? 0) ?? 0;


            var totalDelivered = so.DeliveryOrders?
                .SelectMany(d => d.DeliveryOrderItems ?? new List<DeliveryOrderItem>())
                .Where(x => x != null)
                .Sum(x => x.QuantityDelivered ?? 0) ?? 0;

            string oldStatus = so.Status;

            if (totalDelivered == 0)
            {
                so.Status = "InProgress";
            }
            else if (totalDelivered < totalOrdered)
            {
                so.Status = "PartiallyDelivered";
            }
            else
            {
                so.Status = "Delivered";
            }

            if (oldStatus != so.Status)
            {
                var history = new SalesOrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    SalesOrderId = so.Id,
                    Status = so.Status,
                    ActionUserId = actionUserId,
                    ActionAt = DateTimeHelper.Now(),
                    Remarks = $"Status updated to {so.Status} via Delivery Order processing by {userName ?? "System"}."
                };

                _context.SalesOrderStatusHistories.Add(history);
            }

            await _context.SaveChangesAsync();
        }

        private async Task<string> GenerateDONo()
        {
            var year = DateTime.UtcNow.Year % 100;

            var lastDO = await _context.DeliveryOrders
                .Where(x => x.DeliveryOrderNo.Contains($"YL/DO/") && x.DeliveryOrderNo.EndsWith($"/{year}"))
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.DeliveryOrderNo)
                .FirstOrDefaultAsync();

            int next = 1;

            if (!string.IsNullOrEmpty(lastDO))
            {
                var parts = lastDO.Split('/');
                if (parts.Length >= 3 && int.TryParse(parts[2], out int lastNo))
                {
                    next = lastNo + 1;
                }
            }

            return $"YL/DO/{next}/{year}";
        }

        [HttpPost("GenerateBulkDOs")]
        public async Task<IActionResult> GenerateBulkDOs([FromBody] BulkDORequest request)
        {
            if (request?.DeliveryOrders == null || !request.DeliveryOrders.Any())
                return BadRequest(new { message = "No delivery schedules provided." });

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            Guid actionUserId = string.IsNullOrEmpty(userIdClaim) ? Guid.Empty : Guid.Parse(userIdClaim);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var primarySalesOrderId = request.DeliveryOrders.First().SalesOrderId;

                var so = await _context.SalesOrders
                    .Include(x => x.SalesOrderItems)
                    .FirstOrDefaultAsync(x => x.Id == primarySalesOrderId);

                if (so == null)
                    return NotFound(new { message = "Sales Order not found." });

                foreach (var deliveryOrder in request.DeliveryOrders)
                {
                    var doEntity = new DeliveryOrder
                    {
                        Id = Guid.NewGuid(),
                        DeliveryOrderNo = await GenerateDONo(),
                        SalesOrderId = so.Id,
                        SenderCompanyId = so.CompanyId,
                        ReceiverCompanyId = so.ClientId,
                        PaymentTerms = so.PaymentTerms,
                        DeliveryMethod = deliveryOrder.DeliveryMethod,
                        EstimatedDeliveryDate = deliveryOrder.EstimatedDeliveryDate,
                        Status = "Draft",
                        CreatedAt = DateTime.UtcNow
                    };

                    foreach (var itemInput in deliveryOrder.Items)
                    {
                        var originalSoItem = so.SalesOrderItems.FirstOrDefault(x => x.Id == itemInput.SalesOrderItemId);
                        if (originalSoItem == null) continue;

                        var doItem = new DeliveryOrderItem
                        {
                            Id = Guid.NewGuid(),
                            DeliveryOrderId = doEntity.Id,
                            Description = originalSoItem.Description,
                            QuantityOrdered = itemInput.QuantityToDeliver,
                            QuantityDelivered = 0,
                            Unit = originalSoItem.Unit,
                            Remarks = $"Scheduled batch via delivery matrix allocation."
                        };

                        doEntity.DeliveryOrderItems.Add(doItem);
                    }

                    _context.DeliveryOrders.Add(doEntity);

                    var history = new DeliveryOrderStatusHistory
                    {
                        Id = Guid.NewGuid(),
                        DeliveryOrderId = doEntity.Id,
                        Status = "Draft",
                        ActionUserId = actionUserId != Guid.Empty ? actionUserId : null,
                        ActionAt = DateTime.UtcNow,
                        Remarks = $"Scheduled bulk allocation generated. Target Delivery: {deliveryOrder.EstimatedDeliveryDate:dd/MM/yyyy} via {deliveryOrder.DeliveryMethod}."
                    };

                    _context.DeliveryOrderStatusHistories.Add(history);
                }

                so.Status = "InProgress";

                await _context.SaveChangesAsync();

                if (actionUserId != Guid.Empty)
                {
                    await UpdateSalesOrderStatusFromDO(so.Id, actionUserId);
                }

                await transaction.CommitAsync();

                return Ok(new { message = $"{request.DeliveryOrders.Count} Delivery Orders scheduled and generated successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { error = "An internal processing error occurred while writing bulk shipments to the database." });
            }
        }


        private async Task AutoMatchInventoryAsync(Guid salesOrderId)
        {
            var so = await _context.SalesOrders
                .Include(x => x.SalesOrderItems)
                .FirstOrDefaultAsync(x => x.Id == salesOrderId);

            if (so == null) return;

            foreach (var item in so.SalesOrderItems)
            {
                //if (item.InventoryId != null) continue;

                //var desc = item.Description?.ToLower() ?? "";

                //var tokens = desc
                //    .Split(' ', ',', '\n', '\r')
                //    .Where(x => x.Length >= 3)
                //    .Select(x => x.Trim())
                //    .ToList();

                //var match = await _context.Inventories
                //    .Where(i =>
                //        (!string.IsNullOrEmpty(i.Model) && tokens.Any(t => i.Model.ToLower().Contains(t))) ||
                //        (!string.IsNullOrEmpty(i.ItemName) && tokens.Any(t => i.ItemName.ToLower().Contains(t))) ||
                //        (!string.IsNullOrEmpty(i.Brand) && tokens.Any(t => i.Brand.ToLower().Contains(t))) ||
                //        (!string.IsNullOrEmpty(i.ItemCode) && tokens.Any(t => i.ItemCode.ToLower().Contains(t)))

                //    )
                //    .ToListAsync();

                //var bestMatch = match
                //    .OrderByDescending(i =>
                //        (i.Model != null && desc.Contains(i.Model.ToLower()) ? 4 : 0) +
                //        (i.ItemName != null && desc.Contains(i.ItemName.ToLower()) ? 3 : 0) +
                //        (i.Brand != null && desc.Contains(i.Brand.ToLower()) ? 2 : 0) +
                //        (i.ItemCode != null && desc.Contains(i.ItemCode.ToLower()) ? 1 : 0)
                //    )
                //    .FirstOrDefault();

                //if (bestMatch != null)
                //{
                //    item.InventoryId = bestMatch.Id;
                //}
            }

            await _context.SaveChangesAsync();
        }

        private decimal GetAvailableStock(Inventory i)
        {
            var reserved = i.ReservedQuantity ?? 0m;
            var quantity = i.Quantity ?? 0m;

            var available = quantity - reserved;

            return available < 0 ? 0m : available;
        }

        [HttpGet("ExportExcel")]
        public async Task<IActionResult> ExportExcel()
        {
            var data = await _context.SalesOrders
                .Include(q => q.Client)
                .ToListAsync();

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("SalesOrders");

            ws.Cell(1, 1).Value = "Sales Order No";
            ws.Cell(1, 2).Value = "SO Date";
            ws.Cell(1, 3).Value = "Client PO";
            ws.Cell(1, 4).Value = "PO Date";
            ws.Cell(1, 5).Value = "Client";
            ws.Cell(1, 6).Value = "SubTotal";
            ws.Cell(1, 7).Value = "Discount";
            ws.Cell(1, 8).Value = "TotalAmount";
            ws.Cell(1, 9).Value = "Status";

            var headerRange = ws.Range(1, 1, 1, 9);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

            int row = 2;

            foreach (var q in data)
            {
                ws.Cell(row, 1).Value = q.SalesOrderNo;

                if (q.SODate != default)
                {
                    ws.Cell(row, 2).Value = q.SODate;
                    ws.Cell(row, 2).Style.DateFormat.Format = "yyyy-MM-dd";
                }

                ws.Cell(row, 3).Value = q.ClientPONumber;

                if (q.ClientPODate.HasValue)
                {
                    ws.Cell(row, 4).Value = q.ClientPODate.Value;
                    ws.Cell(row, 4).Style.DateFormat.Format = "yyyy-MM-dd";
                }

                ws.Cell(row, 5).Value = q.Client?.Name ?? "";

                ws.Cell(row, 6).Value = q.SubTotal ?? 0;
                ws.Cell(row, 7).Value = q.Discount ?? 0;
                ws.Cell(row, 8).Value = q.TotalAmount; 
                ws.Cell(row, 9).Value = q.Status;

                row++;
            }

            ws.Columns().AdjustToContents();

            var stream = new MemoryStream();
            wb.SaveAs(stream);
            stream.Position = 0;

            return File(
                stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"SalesOrders_{DateTime.Now:yyyyMMddHHmmss}.xlsx"
            );
        }
    }
}
