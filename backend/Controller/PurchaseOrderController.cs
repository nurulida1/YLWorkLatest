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

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseOrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public PurchaseOrderController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.PurchaseOrders.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(PurchaseOrder), "q");
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
                        var lambda = Expression.Lambda<Func<PurchaseOrder, bool>>(finalExpression, parameter);
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
                IQueryable<PurchaseOrder> query = _context.PurchaseOrders.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    if (filter.Contains('='))
                    {
                        var parts = filter.Split('=');
                        var key = parts[0].Trim();
                        var value = parts[1].Trim();

                        if (key == "Id" && Guid.TryParse(value, out var guidId))
                        {
                            query = query.Where(x => x.Id == guidId);
                        }
                        else if (key == "PurchaseOrderNo")
                        {
                            query = query.Where(x => x.PurchaseOrderNo == value);
                        }
                    }
                }

                var data = await query.FirstOrDefaultAsync();

                if (data == null)
                    return NotFound();

                var safeResult = new
                {
                    data.Id,
                    data.PurchaseOrderNo,
                    data.PODate,
                    data.POReceivedDate,
                    data.Status,
                    data.Gross,
                    data.Discount,
                    data.TotalAmount,
                    data.TotalInWords,
                    data.SupplierId,
                    data.TotalQuantity,
                    Supplier = data.Supplier == null ? null : new
                    {
                      Name = data.Supplier.Name,
                      FaxNo = data.Supplier.FaxNo,
                      PrimaryContactPerson = data.Supplier.PrimaryContactPerson,
                      SecondaryContactPerson = data.Supplier.SecondaryContactPerson,
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
                            Postcode = data.Supplier.BillingAddress.Postcode
                        },

                      DeliveryAddress = data.Supplier.DeliveryAddress == null ? null : new Address
                        {
                            Id = data.Supplier.DeliveryAddress.Id,
                            AddressLine1 = data.Supplier.DeliveryAddress.AddressLine1,
                            AddressLine2 = data.Supplier.DeliveryAddress.AddressLine2,
                            City = data.Supplier.DeliveryAddress.City,
                            State = data.Supplier.DeliveryAddress.State,
                            Country = data.Supplier.DeliveryAddress.Country,
                            Postcode = data.Supplier.DeliveryAddress.Postcode
                        }

                    },
                    data.FromCompanyId,
                    FromCompany = data.FromCompany == null ? null : new
                    {
                        Name = data.FromCompany.Name,
                        FaxNo = data.FromCompany.FaxNo,
                        PrimaryContactPerson = data.FromCompany.PrimaryContactPerson,
                        SecondaryContactPerson = data.FromCompany.SecondaryContactPerson,
                        ContactNo = data.FromCompany.ContactNo,
                        ACNo = data.FromCompany.ACNo,
                        BillingAddress = data.FromCompany.BillingAddress == null ? null : new Address
                        {
                            Id = data.FromCompany.BillingAddress.Id,
                            AddressLine1 = data.FromCompany.BillingAddress.AddressLine1,
                            AddressLine2 = data.FromCompany.BillingAddress.AddressLine2,
                            City = data.FromCompany.BillingAddress.City,
                            State = data.FromCompany.BillingAddress.State,
                            Country = data.FromCompany.BillingAddress.Country,
                            Postcode = data.FromCompany.BillingAddress.Postcode
                        },

                        DeliveryAddress = data.FromCompany.DeliveryAddress == null ? null : new Address
                        {
                            Id = data.FromCompany.DeliveryAddress.Id,
                            AddressLine1 = data.FromCompany.DeliveryAddress.AddressLine1,
                            AddressLine2 = data.FromCompany.DeliveryAddress.AddressLine2,
                            City = data.FromCompany.DeliveryAddress.City,
                            State = data.FromCompany.DeliveryAddress.State,
                            Country = data.FromCompany.DeliveryAddress.Country,
                            Postcode = data.FromCompany.DeliveryAddress.Postcode
                        }
                    },
                
                    data.QuotationId,
                    data.PaymentTerms,
                    data.PaymentTermType,
                    data.Remarks,
                    data.ProjectId,
                    Project = data.Project == null ? null : new
                    {
                        ProjectCode = data.Project.ProjectCode,
                        ProjectTitle = data.Project.ProjectTitle
                    },
                    data.InvoiceStatus,
                    data.InvoicedAmount,

                    PurchaseOrderItems = data.PurchaseOrderItems?.Select(i => new
                    {
                        i.Id,
                        i.PurchaseOrderId,
                        i.SalesOrderItemId,
                        i.SalesOrderItem,
                        i.Item,
                        i.Description,
                        i.Quantity,
                        i.ReceivedQuantity,
                        i.UnitPrice,
                        i.Unit,
                        i.TotalPrice,
                        i.Discount
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
        public async Task<ActionResult<object>> Create([FromForm] CreatePORequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });

            if (string.IsNullOrWhiteSpace(request.PurchaseOrderNo))
                return BadRequest(new { Error = "Purchase Order No is required for finalized records." });

            if (!string.IsNullOrEmpty(Request.Form["purchaseOrderItems"]))
            {
                request.PurchaseOrderItems =
                    JsonSerializer.Deserialize<List<POItemRequest>>(
                        Request.Form["purchaseOrderItems"],
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        }
                    );
            }

            var exists = await _context.PurchaseOrders
    .AnyAsync(x => x.PurchaseOrderNo == request.PurchaseOrderNo);

            if (exists)
            {
                return Ok(new
                {
                    success = false,
                    message = "Purchase Order No already exists."
                });
            }

            try
            {
                string? filePath = null;

                if (request.Attachment != null)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "PO");

                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.Attachment.FileName)}";
                    var fullPath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await request.Attachment.CopyToAsync(stream);
                    }

                    filePath = $"Uploads/PO/{fileName}";
                }

                var po = new PurchaseOrder
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderNo = request.PurchaseOrderNo ?? await GeneratePONo(),
                    FromCompanyId = request.FromCompanyId,
                    PODate = request.PODate,
                    POReceivedDate = request.POReceivedDate,
                    SupplierId = request.SupplierId,
                    ClientId = request.ClientId,
                    PaymentTerms = request.PaymentTerms,
                    PaymentTermType = request.PaymentTermType,
                    QuotationId = request.QuotationId,
                    ProjectId = request.ProjectId,
                    SalesOrderId = request.SalesOrderId,
                    Gross = request.Gross,
                    Discount = request.Discount,
                    TotalAmount = request.TotalAmount,
                    TotalInWords = ConvertAmountToWords(request.TotalAmount),
                    Notes = request.Notes,
                    Remarks = request.Remarks,
                    TermsAndCondition = request.TermsAndConditions,
                    BankDetails = request.BankDetails,
                    TotalQuantity = request.TotalQuantity,
                    Attachment = filePath,
                    Status = "Draft",
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTimeHelper.Now()
                };

                po.PurchaseOrderItems = request.PurchaseOrderItems?.Select(x => new PurchaseOrderItem
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderId = po.Id,
                    SalesOrderItemId = x.SalesOrderItemId,
                    Item = x.Item,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    UnitPrice = x.UnitPrice,
                    Discount = x.Discount,
                    TotalPrice = x.TotalPrice
                }).ToList() ?? new List<PurchaseOrderItem>();

                var statusHistory = new PurchaseOrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderId = po.Id,
                    Status = "Draft",
                    ActionAt = DateTimeHelper.Now(),
                    ActionUserId = Guid.Parse(userIdClaim),
                    Remarks = "PO created",
                };

                _context.PurchaseOrders.Add(po);
                _context.PurchaseOrderStatusHistories.Add(statusHistory);

                await _context.SaveChangesAsync();

                var poWithRelations = await _context.PurchaseOrders
                    .Include(x => x.Supplier)
                        .ThenInclude(s => s.BillingAddress)
                    .Include(x => x.Supplier)
                        .ThenInclude(s => s.DeliveryAddress)
                    .Include(x => x.Client)
                        .ThenInclude(s => s.BillingAddress)
                    .Include(x => x.Client)
                        .ThenInclude(s => s.DeliveryAddress)
                    .Include(x => x.Project)
                    .Include(x => x.Quotation)
                    .Include(x => x.PurchaseOrderItems)
                    .FirstOrDefaultAsync(x => x.Id == po.Id);

                var result = MapToDto(poWithRelations);
                await _hub.Clients.All.SendAsync("PurchaseOrderAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to create.", Details = ex.Message });
            }
        }

        private async Task<string> GeneratePONo()
        {
            var yearShort = DateTime.UtcNow.Year;

            var lastPO = await _context.PurchaseOrders
                .Where(q => q.PurchaseOrderNo.StartsWith($"YL/PO/") && q.PurchaseOrderNo.EndsWith($"/{yearShort}"))
                .OrderByDescending(q => q.CreatedAt)
                .Select(q => q.PurchaseOrderNo)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (!string.IsNullOrEmpty(lastPO))
            {
                var parts = lastPO.Split('/');
                if (parts.Length >= 3 && int.TryParse(parts[2], out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"YL/PO/{nextNumber}/{yearShort}";
        }

        [HttpGet("generate-no")]
        public async Task<IActionResult> GeneratePurchaseOrderNoEndpoint()
        {
            var purchaseOrderNo = await GeneratePONo();
            return Ok(new { purchaseOrderNo });

        }

        [HttpPut("Update")]
        public async Task<ActionResult<object>> Update(
    [FromForm] UpdatePORequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var po = await _context.PurchaseOrders
                .Include(x => x.PurchaseOrderItems).Include(x => x.Supplier).Include(x => x.Client)
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (po == null)
                return NotFound(new { Error = "Purchase Order not found." });

            try
            {
                // Deserialize items
                if (!string.IsNullOrEmpty(Request.Form["purchaseOrderItems"]))
                {
                    request.PurchaseOrderItems =
                        JsonSerializer.Deserialize<List<UpdatePOItemRequest>>(
                            Request.Form["purchaseOrderItems"],
                            new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            }
                        );
                }

                // Attachment upload
                if (request.Attachment != null)
                {
                    var uploadsFolder = Path.Combine(
                        Directory.GetCurrentDirectory(),
                        "Uploads",
                        "PO");

                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var fileName =
                        $"{Guid.NewGuid()}{Path.GetExtension(request.Attachment.FileName)}";

                    var fullPath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await request.Attachment.CopyToAsync(stream);
                    }

                    po.Attachment = $"Uploads/PO/{fileName}";
                }

                po.PurchaseOrderNo = request.PurchaseOrderNo;
                po.FromCompanyId = request.FromCompanyId;
                po.PODate = request.PODate;
                po.POReceivedDate = request.POReceivedDate;
                po.SupplierId = request.SupplierId;
                po.ClientId = request.ClientId;
                po.PaymentTerms = request.PaymentTerms;
                po.PaymentTermType = request.PaymentTermType;
                po.QuotationId = request.QuotationId;
                po.ProjectId = request.ProjectId;
                po.SalesOrderId = request.SalesOrderId;
                po.Gross = request.Gross;
                po.Discount = request.Discount;
                po.TotalAmount = request.TotalAmount;
                po.TotalInWords = ConvertAmountToWords(request.TotalAmount);
                po.Notes = request.Notes;
                po.Remarks = request.Remarks;
                po.TermsAndCondition = request.TermsAndConditions;
                po.BankDetails = request.BankDetails;
                po.TotalQuantity = request.TotalQuantity;
                po.UpdatedAt = DateTimeHelper.Now();

                var existingItems = await _context.PurchaseOrderItems
                    .Where(x => x.PurchaseOrderId == po.Id)
                    .ToListAsync();

                _context.PurchaseOrderItems.RemoveRange(existingItems);

                await _context.SaveChangesAsync();

                var newItems = request.PurchaseOrderItems?
                    .Select(x => new PurchaseOrderItem
                    {
                        Id = x.Id ?? Guid.NewGuid(),
                        PurchaseOrderId = po.Id,
                        SalesOrderItemId = x.SalesOrderItemId,
                        Item = x.Item,
                        Description = x.Description,
                        Quantity = x.Quantity,
                        Unit = x.Unit,
                        UnitPrice = x.UnitPrice,
                        Discount = x.Discount,
                        TotalPrice = x.TotalPrice
                    })
                    .ToList()
                    ?? new List<PurchaseOrderItem>();

                await _context.PurchaseOrderItems.AddRangeAsync(newItems);

                _context.PurchaseOrders.Update(po);

                await _context.SaveChangesAsync();

                var result = MapToDto(po);

                await _hub.Clients.All.SendAsync(
                    "PurchaseOrderUpdated",
                    result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update purchase order.",
                    Details = ex.Message
                });
            }
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var po = await _context.PurchaseOrders
                    .Include(x => x.PurchaseOrderItems)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (po == null)
                    return NotFound();

                foreach (var poItem in po.PurchaseOrderItems ?? new List<PurchaseOrderItem>())
                {
                    if (poItem.SalesOrderItemId == null)
                        continue;

                    var soItem = await _context.SalesOrderItems
                        .FirstOrDefaultAsync(x => x.Id == poItem.SalesOrderItemId);

                    if (soItem == null)
                        continue;

                    var qty = poItem.Quantity;

                    soItem.QuantityAllocated = Math.Max(
                        0,
                        soItem.QuantityAllocated - qty
                    );
                }

                _context.PurchaseOrderItems.RemoveRange(po.PurchaseOrderItems);
                _context.PurchaseOrders.Remove(po);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "PO deleted and SO allocation restored." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private object MapToDto(PurchaseOrder q)
        {
            var items = q.PurchaseOrderItems ?? new List<PurchaseOrderItem>();

            return new
            {
                q.Id,
                q.PurchaseOrderNo,
                q.PODate,
                q.POReceivedDate,
                q.PaymentTerms,
                q.PaymentTermType,
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

                q.TotalQuantity,
                q.Gross,
                q.Discount,
                q.TotalAmount,
                q.TotalInWords,
                q.Remarks,
                q.Notes,
                q.SalesOrderId,
                q.Status,
                q.TermsAndCondition,
                q.BankDetails,
                q.Attachment,
                q.SupplierId,
                q.InvoicedAmount,
                Client = q.Client == null ? null : new
                {
                    Id = q.Client.Id,
                    q.Client.Name,
                    q.Client.ContactNo,
                    q.Client.FaxNo,
                    q.Client.Email,
                    q.Client.ACNo,
                    q.Client.PrimaryContactPerson,
                    q.Client.SecondaryContactPerson,

                    BillingAddress = q.Client.BillingAddress == null ? null : new Address
                    {
                        Id = q.Client.BillingAddress.Id,
                        AddressLine1 = q.Client.BillingAddress.AddressLine1,
                        AddressLine2 = q.Client.BillingAddress.AddressLine2,
                        City = q.Client.BillingAddress.City,
                        State = q.Client.BillingAddress.State,
                        Country = q.Client.BillingAddress.Country,
                        Postcode = q.Client.BillingAddress.Postcode
                    },

                    DeliveryAddress = q.Client.DeliveryAddress == null ? null : new Address
                    {
                        Id = q.Client.DeliveryAddress.Id,
                        AddressLine1 = q.Client.DeliveryAddress.AddressLine1,
                        AddressLine2 = q.Client.DeliveryAddress.AddressLine2,
                        City = q.Client.DeliveryAddress.City,
                        State = q.Client.DeliveryAddress.State,
                        Country = q.Client.DeliveryAddress.Country,
                        Postcode = q.Client.DeliveryAddress.Postcode
                    }
                },
                Supplier = q.Supplier == null ? null : new
                {
                    Id = q.Supplier.Id,
                    q.Supplier.Name,
                    q.Supplier.ContactNo,
                    q.Supplier.FaxNo,
                    q.Supplier.Email,
                    q.Supplier.ACNo,
                    q.Supplier.PrimaryContactPerson,
                    q.Supplier.SecondaryContactPerson,

                    BillingAddress = q.Supplier.BillingAddress == null ? null : new Address
                    {
                        Id = q.Supplier.BillingAddress.Id,
                        AddressLine1 = q.Supplier.BillingAddress.AddressLine1,
                        AddressLine2 = q.Supplier.BillingAddress.AddressLine2,
                        City = q.Supplier.BillingAddress.City,
                        State = q.Supplier.BillingAddress.State,
                        Country = q.Supplier.BillingAddress.Country,
                        Postcode = q.Supplier.BillingAddress.Postcode
                    },

                    DeliveryAddress = q.Supplier.DeliveryAddress == null ? null : new Address
                    {
                        Id = q.Supplier.DeliveryAddress.Id,
                        AddressLine1 = q.Supplier.DeliveryAddress.AddressLine1,
                        AddressLine2 = q.Supplier.DeliveryAddress.AddressLine2,
                        City = q.Supplier.DeliveryAddress.City,
                        State = q.Supplier.DeliveryAddress.State,
                        Country = q.Supplier.DeliveryAddress.Country,
                        Postcode = q.Supplier.DeliveryAddress.Postcode
                    }
                },

                PurchaseOrderItems = items.Select(i => new
                {
                    i.Id,
                    i.Item,
                    i.Description,
                    i.Quantity,
                    i.Unit,
                    i.UnitPrice,
                    i.TotalPrice
                })
            };
        }

        private PurchaseOrderItem MapToEntity(POItemRequest req, Guid poId)
        {
            var entity = new PurchaseOrderItem
            {
                Id = Guid.NewGuid(),
                PurchaseOrderId = poId,
                SalesOrderItemId = req.SalesOrderItemId,
                Item = req.Item,
                Description = req.Description,
                Quantity = req.Quantity,
                Unit = req.Unit,
                UnitPrice = req.UnitPrice,
                Discount = req.Discount,
                TotalPrice = req.TotalPrice,
            };

            return entity;
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(Guid id, string status, string? remarks = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var actionUserId = Guid.Parse(userIdClaim);

            var userName = await _context.Users
                .Where(x => x.Id == actionUserId)
                .Select(x => x.FullName)
                .FirstOrDefaultAsync();

            var po = await _context.PurchaseOrders
                .Include(x => x.PurchaseOrderItems)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (po == null)
                return NotFound();

            var previousStatus = po.Status;

            if (previousStatus == "Sent" && status != "Sent")
            {
                await AdjustSoAllocation(po, subtract: true);
            }

            if (previousStatus != "Sent" && status == "Sent")
            {
                await AdjustSoAllocation(po, subtract: false);
            }

            po.Status = status;

            var history = new PurchaseOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                PurchaseOrderId = id,
                Status = status,
                ActionUserId = actionUserId,
                ActionAt = DateTimeHelper.Now(),
                Remarks = remarks ?? GenerateStatusRemark(status, userName ?? "System")
            };

            _context.PurchaseOrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            return Ok(history);
        }

        private async Task RevertSalesOrderAllocation(PurchaseOrder po)
        {
            var poItems = po.PurchaseOrderItems;

            foreach (var poItem in poItems)
            {
                if (poItem.SalesOrderItemId == null) continue;

                var soItem = await _context.SalesOrderItems
                    .FirstOrDefaultAsync(x => x.Id == poItem.SalesOrderItemId);

                if (soItem == null) continue;

                var allocatedQty = poItem.Quantity;

                soItem.QuantityAllocated = Math.Max(0, soItem.QuantityAllocated - allocatedQty);
            }

            await _context.SaveChangesAsync();
        }

        private async Task AdjustSoAllocation(PurchaseOrder po, bool subtract)
        {
            if (po?.PurchaseOrderItems == null || !po.PurchaseOrderItems.Any())
                return;

            var grouped = po.PurchaseOrderItems
                .Where(x => x.SalesOrderItemId != null)
                .GroupBy(x => x.SalesOrderItemId);

            foreach (var group in grouped)
            {
                var soItemId = group.Key;

                var soItem = await _context.SalesOrderItems
                    .FirstOrDefaultAsync(x => x.Id == soItemId);

                if (soItem == null)
                    continue;

                var totalQty = group.Sum(x => x.Quantity);

                if (subtract)
                {
                    soItem.QuantityAllocated = Math.Max(0, soItem.QuantityAllocated - totalQty);
                }
                else
                {
                    soItem.QuantityAllocated += totalQty;
                }
            }

            await _context.SaveChangesAsync();
        }

        private string GenerateStatusRemark(string status, string userName)
        {
            return status switch
            {
                "Reviewed" => $"PO reviewed by {userName}",
                "Approved" => $"PO approved by {userName}",
                "Rejected" => $"PO rejected by {userName}",
                "Sent" => $"PO sent by {userName} to supplier",
                _ => $"PO updated to {status} by {userName}"
            };
        }

        [HttpPost("ConvertToPurchaseInvoice/{poId}")]
        public async Task<IActionResult> ConvertToPurchaseInvoice(
     Guid poId,
     [FromQuery] decimal invoiceAmount)
        {
            var po = await _context.PurchaseOrders
                .Include(x => x.Invoices)
                .FirstOrDefaultAsync(x => x.Id == poId);

            if (po == null)
                return NotFound();

            var poTotalAmount = po.TotalAmount ?? 0;

            var alreadyInvoiced = await _context.Invoices
                .Where(x => x.PurchaseOrderId == poId)
                .SumAsync(x => (decimal?)x.TotalAmount) ?? 0;

            var remainingAmount = poTotalAmount - alreadyInvoiced;

            if (invoiceAmount <= 0)
                return BadRequest("Invoice amount must be greater than 0.");

            if (invoiceAmount > remainingAmount)
                return BadRequest($"Max allowed amount is {remainingAmount}");

            var invoiceDate = DateTimeHelper.Now();

            var invoice = new Invoice
            {
                InvoiceNo = GenerateInvoiceNo("PUR"),
                InvoiceDate = invoiceDate,
                DueDate = CalculateDueDate(
    invoiceDate,
    po.PaymentTerms,
    po.PaymentTermType
),
                SupplierId = po.SupplierId,
                PurchaseOrderId = po.Id,
                Type = "Purchase",
                Gross = invoiceAmount,
                TotalAmount = invoiceAmount,
                InvoiceItems = new List<InvoiceItem>
        {
            new InvoiceItem
            {
                Item = "PO Invoice",
                Description = "Partial / Full Invoice",
                Quantity = 1,
                UnitPrice = invoiceAmount,
                Amount = invoiceAmount
            }
        }
            };

            _context.Invoices.Add(invoice);

            var newTotalInvoiced = alreadyInvoiced + invoiceAmount;

            po.InvoicedAmount = newTotalInvoiced;

            po.InvoiceStatus =
                newTotalInvoiced == 0 ? "NotInvoiced" :
                newTotalInvoiced < poTotalAmount ? "PartiallyInvoiced" :
                "FullyInvoiced";

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var actionUserId = Guid.Parse(userIdClaim);

            _context.PurchaseOrderStatusHistories.Add(new PurchaseOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                PurchaseOrderId = po.Id,
                Status = po.Status,
                ActionAt = DateTimeHelper.Now(),
                ActionUserId = actionUserId,
                Remarks = $"Invoice generated RM {invoiceAmount}. Status: {po.Status}"
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                invoice,
                purchaseOrder = po,
                alreadyInvoiced = newTotalInvoiced,
                remainingAmount = poTotalAmount - newTotalInvoiced
            });
        }

        private DateTime? CalculateDueDate(DateTime? baseDate, int? terms, string? type)
        {
            if (baseDate == null || terms == null) return null;

            return (type?.ToLower()) switch
            {
                "days" => baseDate.Value.AddDays(terms.Value),
                "months" => baseDate.Value.AddMonths(terms.Value),
                "years" => baseDate.Value.AddYears(terms.Value),
                _ => baseDate.Value.AddDays(terms.Value) 
            };
        }

        private string GenerateInvoiceNo(string prefix)
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var lastNumber = _context.Invoices
                .Where(x => x.CreatedAt >= today && x.CreatedAt < tomorrow)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.InvoiceNo)
                .FirstOrDefault();

            int next = 1;

            if (!string.IsNullOrEmpty(lastNumber))
            {
                var parts = lastNumber.Split('-');

                if (parts.Length == 3 && int.TryParse(parts[2], out int num))
                {
                    next = num + 1;
                }
            }

            var datePart = today.ToString("yyyyMMdd");

            return $"{prefix}-{datePart}-{next:D4}";
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetPODropdown()
        {
            try
            {
                var quotation = await _context.Quotations
    .Include(x => x.FromCompany)
    .Include(x => x.Project)
    .Where(x => x.Status == "Accepted")
    .OrderByDescending(x => x.CreatedAt)
    .Select(x => new QuotationDropdownDto
    {
        Id = x.Id,
        QuotationNo = x.QuotationNo,
        FromCompanyId = x.FromCompanyId,
        CompanyName = x.FromCompany != null ? x.FromCompany.Name : null
    })
    .ToListAsync();

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
                    .Where(x => x.Type == CompanyType.Supplier).Include(x => x.BillingAddress).Include(x => x.DeliveryAddress)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name,
                        PrimaryContactPerson = x.PrimaryContactPerson,
                        SecondaryContactPerson = x.SecondaryContactPerson,
                        ContactNo = x.ContactNo,
                        FaxNo = x.FaxNo,
                        Email = x.Email,
                        BillingAddress = x.BillingAddress,
                        DeliveryAddress = x.DeliveryAddress,
                    })
                    .ToListAsync();


                var companies = await _context.Companies
                    .Where(x => x.Type == CompanyType.Own).Include(x => x.BillingAddress).Include(x => x.DeliveryAddress)
                    .OrderBy(x => x.Name)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name,
                        PrimaryContactPerson = x.PrimaryContactPerson,
                        SecondaryContactPerson = x.SecondaryContactPerson,
                        ContactNo = x.ContactNo,
                        FaxNo = x.FaxNo,
                        Email = x.Email,
                        BillingAddress = x.BillingAddress,
                        DeliveryAddress = x.DeliveryAddress,
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
                    }).ToListAsync();

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

        [HttpPost("GenerateGRNFromPO/{poId}")]
        public async Task<IActionResult> GenerateGRNFromPO(Guid poId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            var po = await _context.PurchaseOrders
                .Include(x => x.PurchaseOrderItems)
                .FirstOrDefaultAsync(x => x.Id == poId);

            if (po == null)
                return NotFound("PO not found");

            if (po.Status == "Completed")
                return BadRequest("PO already completed");

            var remainingItems = po.PurchaseOrderItems
                .Where(x => (x.Quantity - (x.ReceivedQuantity)) > 0)
                .ToList();

            if (!remainingItems.Any())
                return BadRequest("All items already received");

            var grn = new GoodsReceiving
            {
                Id = Guid.NewGuid(),
                GRNNo = await GenerateGRNNo(),
                PurchaseOrderId = po.Id,
                SupplierId = po.SupplierId ?? Guid.Empty,
                ReceivedDate = DateTimeHelper.Now(),
                Status = "Draft",
                CreatedById = userId,
                Remarks = "Auto generated from PO",

                GoodsReceivingItems = remainingItems.Select(item => new GoodsReceivingItem
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderItemId = item.Id,
                    ReceivedQuantity = item.Quantity - (item.ReceivedQuantity),
                    Remarks = "Auto received from PO"
                }).ToList()
            };

            _context.GoodsReceivings.Add(grn);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "GRN generated successfully",
                grn.Id,
                grn.GRNNo
            });
        }

        private async Task<string> GenerateGRNNo()
        {
            var year = DateTime.UtcNow.Year;

            var last = await _context.GoodsReceivings
                .Where(x => x.GRNNo.StartsWith("YL/GRN/"))
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

        private string ConvertAmountToWords(decimal? amount)
        {
            if (amount == null || amount == 0) return "ZERO RINGGIT ONLY";

            decimal value = Math.Round(amount.Value, 2);
            long ringgit = (long)Math.Truncate(value);
            long sen = (long)Math.Round((value - ringgit) * 100);

            string ringgitStr = NumberToWords(ringgit) + " RINGGIT";
            string senStr = sen > 0 ? $" AND {NumberToWords(sen)} SEN" : "";

            return $"{ringgitStr}{senStr} ONLY".ToUpper().Trim();
        }

        private string NumberToWords(long number)
        {
            if (number == 0) return "ZERO";
            if (number < 0) return "NEGATIVE " + NumberToWords(Math.Abs(number));

            string words = "";

            if ((number / 1000000) > 0)
            {
                words += NumberToWords(number / 1000000) + " MILLION ";
                number %= 1000000;
            }

            if ((number / 1000) > 0)
            {
                words += NumberToWords(number / 1000) + " THOUSAND ";
                number %= 1000;
            }

            if ((number / 100) > 0)
            {
                words += NumberToWords(number / 100) + " HUNDRED ";
                number %= 100;
            }

            if (number > 0)
            {
                if (words != "") words += "AND ";

                var unitsMap = new[] { "ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN" };
                var tensMap = new[] { "ZERO", "TEN", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY" };

                if (number < 20)
                    words += unitsMap[number];
                else
                {
                    words += tensMap[number / 10];
                    if ((number % 10) > 0)
                        words += "-" + unitsMap[number % 10];
                }
            }

            return words.Trim();
        }

        private async Task RecalculateSoAllocation(Guid salesOrderItemId)
        {
            var totalAllocated = await _context.PurchaseOrderItems
                .Where(x => x.SalesOrderItemId == salesOrderItemId)
                .Join(_context.PurchaseOrders,
                    poi => poi.PurchaseOrderId,
                    po => po.Id,
                    (poi, po) => new { poi, po })
                .Where(x => x.po.Status == "Sent")
                .SumAsync(x => x.poi.Quantity);

            var soItem = await _context.SalesOrderItems
                .FirstOrDefaultAsync(x => x.Id == salesOrderItemId);

            if (soItem != null)
            {
                soItem.QuantityAllocated = totalAllocated;
            }
        }
    }
}
