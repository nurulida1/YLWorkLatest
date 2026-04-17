using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
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
                // 1. Initialize Query
                var query = _context.PurchaseOrders.AsQueryable();

                // Dynamically include related data
                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // 3. Dynamic Filtering (Expression Tree)
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
                            // String handling
                            if (propertyAccess.Type == typeof(string))
                            {
                                var method = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                                var containsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));
                                condition = isNotEqual ? Expression.Not(containsExpr) : containsExpr;
                            }
                            // Guid handling
                            else if (propertyAccess.Type == typeof(Guid) || propertyAccess.Type == typeof(Guid?))
                            {
                                var guidValue = Guid.Parse(valueStr);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(guidValue, propertyAccess.Type));
                            }
                            // Enum handling (Status)
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue = Enum.Parse(propertyAccess.Type, valueStr);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(enumValue));
                            }
                            // General handling (Numbers/Dates)
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

                // 4. Sorting
                if (!string.IsNullOrEmpty(orderBy))
                {
                    bool descending = orderBy.EndsWith(" desc", StringComparison.OrdinalIgnoreCase);
                    var propertyName = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();
                    query = descending ? query.OrderByDescending(x => EF.Property<object>(x, propertyName))
                                       : query.OrderBy(x => EF.Property<object>(x, propertyName));
                }

                var totalElements = query.Count();

                // 5. Pagination and Execution
                var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

                // 6. Selective Projection
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object?>();
                        foreach (var field in selectedFields)
                        {
                            // Note: GetProperty is case-sensitive. 
                            // Ensure Angular sends "QuotationNo" not "quotationNo"
                            var prop = item.GetType().GetProperty(field);
                            dict[field] = prop?.GetValue(item);
                        }
                        return dict;
                    });

                    return Ok(new { Data = projected, TotalElements = totalElements });
                }

                // === SET IT HERE ===
                // If no specific fields are selected, map the whole list to DTOs 
                // to prevent circular reference crashes.
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
            IQueryable<PurchaseOrder> query = _context.PurchaseOrders.AsQueryable();

            // Dynamically include related data
            if (!string.IsNullOrWhiteSpace(includes))
            {
                foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    query = query.Include(include.Trim());
                }
            }

            // Filter by ID
            if (!string.IsNullOrEmpty(filter))
            {
                var filterValue = filter.Contains('=') ? filter.Split('=')[1].Trim() : filter.Trim();
                if (Guid.TryParse(filterValue, out Guid guidId))
                {
                    query = query.Where(d => d.Id == guidId);
                }
            }

            var data = await query.FirstOrDefaultAsync();

            if (data == null) return NotFound();

            // USE YOUR MAPPER HERE TO PREVENT CYCLES
            return Ok(data);
        }

    //    [HttpPost("Create")]
    //    public async Task<ActionResult<object>> Create([FromBody] CreatePORequest request)
    //    {
    //        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    //        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });

    //        if (string.IsNullOrWhiteSpace(request.PONo))
    //            return BadRequest(new { Error = "PO Number is required for finalized records." });

    //        try
    //        {
    //            var po = new PurchaseOrder
    //            {
    //                Id = Guid.NewGuid(),
    //                PONo = request.PONo,
    //                QuotationId = request.QuotationId,
    //                POReceivedDate = request.POReceivedDate,
    //                Terms = request.Terms,
    //                ProjectId = request.ProjectId,
    //                SupplierId = request.SupplierId ?? null,
    //                ClientId = request.ClientId ?? null,
    //                DeliveryInstruction = request.DeliveryInstruction,
    //                DeliveryDate = request.DeliveryDate,
    //                TermsConditions = request.TermsConditions,
    //                BankDetails = request.BankDetails,
    //                Status = request.ClientId.HasValue ? "Received" : "Draft",
    //                Gross = request.Gross,
    //                Discount = request.Discount,   // Matching your Quotation model name
    //                TotalAmount = request.TotalAmount,
    //                TotalQuantity = request.TotalQuantity,
    //                Remarks = request.Remarks,
    //                CreatedById = Guid.Parse(userIdClaim),
    //                CreatedAt = DateTime.UtcNow
    //            };

    //            // Use the null-coalescing operator ?? to handle empty/null item lists
    //            po.POItems = (request.POItems ?? new List<POItemRequest>()).Select(i => new POItem
    //            {
    //                Id = Guid.NewGuid(),
    //                PurchaseOrderId = po.Id,
    //                Item = i.Item,
    //                Description = i.Description,
    //                Quantity = i.Quantity,
    //                UnitPrice = i.UnitPrice,
    //                Discount = i.Discount,
    //                TotalAmount = i.TotalAmount,
    //                Unit = i.Unit,
    //                CreatedAt = DateTime.UtcNow
    //            }).ToList();

    //            _context.PurchaseOrders.Add(po);
    //            await _context.SaveChangesAsync();

    //            var result = MapToDto(po);
    //            await _hub.Clients.All.SendAsync("PurchaseOrderAdded", result);

    //            return Ok(result);
    //        }
    //        catch (Exception ex)
    //        {
    //            return StatusCode(500, new { Error = "Failed to create.", Details = ex.Message });
    //        }
    //    }


    //    [HttpPut("Update")]
    //    public async Task<ActionResult<PurchaseOrder>> Update([FromBody] UpdatePORequest request)
    //    {
    //        if (request == null || request.Id == Guid.Empty)
    //            return BadRequest("Invalid request.");

    //        var po = await _context.PurchaseOrders
    //            .Include(q => q.POItems)
    //            .FirstOrDefaultAsync(q => q.Id == request.Id);

    //        if (po == null)
    //            return NotFound(new { Error = "Purchase order not found." });

    //        try
    //        {
    //            // =========================
    //            // UPDATE HEADER
    //            // =========================
    //            po.PONo = request.PONo ?? po.PONo;
    //            po.SupplierId = request.SupplierId != Guid.Empty ? request.SupplierId : po.SupplierId;
    //            po.POReceivedDate = request.POReceivedDate ?? po.POReceivedDate;
    //            po.DeliveryInstruction = request.DeliveryInstruction ?? po.DeliveryInstruction;
    //            po.DeliveryDate = request.DeliveryDate ?? po.DeliveryDate;
    //            po.Terms = request.Terms ?? po.Terms;
    //            po.Page = request.Page ?? po.Page;
    //            po.Remarks = request.Remarks ?? po.Remarks;
    //            po.TermsConditions = request.TermsConditions ?? po.TermsConditions;
    //            po.BankDetails = request.BankDetails ?? po.BankDetails;
    //            po.Discount = request.Discount ?? po.Discount;
    //            po.TotalQuantity = request.TotalQuantity ?? po.TotalQuantity;
    //            po.UpdatedAt = DateTime.UtcNow;

    //            // =========================
    //            // MAP REQUEST ITEMS SAFELY
    //            // =========================
    //            var requestItems = request.POItems?
    //                .Select(p => new UpdatePOItemRequest
    //                {
    //                    Id = p.Id,
    //                    Item = p.Item,
    //                    Description = p.Description,
    //                    Quantity = p.Quantity,
    //                    UnitPrice = p.UnitPrice,
    //                    Unit = p.Unit,
    //                    Discount = (decimal)(p.Discount),
    //                    TotalAmount = p.TotalAmount
    //                })
    //                .ToList() ?? new List<UpdatePOItemRequest>();

    //            // =========================
    //            // COLLECT VALID ITEM IDS
    //            // =========================
    //            var requestItemIds = requestItems
    //                .Where(i => i.Id.HasValue && i.Id.Value != Guid.Empty)
    //                .Select(i => i.Id.Value)
    //                .ToHashSet();

    //            // =========================
    //            // REMOVE ITEMS NOT IN REQUEST
    //            // =========================
    //            var itemsToRemove = po.POItems
    //                .Where(dbItem => !requestItemIds.Contains(dbItem.Id))
    //                .ToList();

    //            foreach (var item in itemsToRemove)
    //            {
    //                _context.POItems.Remove(item);
    //            }

    //            // =========================
    //            // ADD / UPDATE ITEMS
    //            // =========================
    //            foreach (var itemReq in requestItems)
    //            {
    //                // UPDATE EXISTING ITEM
    //                if (itemReq.Id.HasValue && itemReq.Id.Value != Guid.Empty)
    //                {
    //                    var existing = po.POItems
    //                        .FirstOrDefault(i => i.Id == itemReq.Id.Value);

    //                    if (existing == null)
    //                        continue;

    //                    existing.Item = itemReq.Item;
    //                    existing.Description = itemReq.Description;
    //                    existing.Quantity = itemReq.Quantity;
    //                    existing.UnitPrice = itemReq.UnitPrice;
    //                    existing.Unit = itemReq.Unit;
    //                    existing.Discount = itemReq.Discount;

    //                    // =========================
    //                    // RECALCULATE TOTAL
    //                    // =========================
    //                    var subTotal = itemReq.Quantity * itemReq.UnitPrice;
    //                    existing.TotalAmount =
    //                        subTotal - (subTotal * (itemReq.Discount / 100));

    //                    existing.UpdatedAt = DateTime.UtcNow;
    //                }
    //                else
    //                {
    //                    // ADD NEW ITEM
    //                    var subTotal = itemReq.Quantity * itemReq.UnitPrice;

    //                    var newItem = new POItem
    //                    {
    //                        Id = Guid.NewGuid(),
    //                        PurchaseOrderId = po.Id,
    //                        Item = itemReq.Item,
    //                        Description = itemReq.Description,
    //                        Quantity = itemReq.Quantity,
    //                        UnitPrice = itemReq.UnitPrice,
    //                        Unit = itemReq.Unit,
    //                        Discount = itemReq.Discount,

    //                        TotalAmount =
    //                            subTotal - (subTotal * (itemReq.Discount / 100)),

    //                        CreatedAt = DateTime.UtcNow
    //                    };

    //                    po.POItems.Add(newItem);
    //                }
    //            }

    //            // =========================
    //            // FINAL TOTAL (SAFE)
    //            // =========================
    //            po.TotalAmount = po.POItems.Sum(x => x.TotalAmount);

    //            await _context.SaveChangesAsync();

    //            // =========================
    //            // SIGNALR NOTIFY
    //            // =========================
    //            await _hub.Clients.All.SendAsync("PurchaseOrderUpdated", po);

    //            return Ok(po);
    //        }
    //        catch (Exception ex)
    //        {
    //            return StatusCode(500, new { Error = "Failed to update purchase order.", Details = ex.Message });
    //        }
    //    }

    //    [HttpPut("UpdateStatus")]
    //    public async Task<ActionResult> UpdateStatus([FromBody] UpdatePOStatusRequest request)
    //    {
    //        if (!ModelState.IsValid)
    //            return BadRequest(ModelState);

    //        var po = await _context.PurchaseOrders.FindAsync(request.Id);
    //        if (po == null)
    //            return NotFound(new { Error = "Purchase Order not found." });

    //        try
    //        {
    //            po.Status = request.Status ?? po.Status;
    //            po.UpdatedAt = DateTime.UtcNow;

    //            await _context.SaveChangesAsync();

    //            // Notify via SignalR
    //            await _hub.Clients.All.SendAsync("PurchaseOrderStatusUpdated", new { po.Id, po.Status });

    //            return Ok(new { po.Id, po.Status , po.PONo});
    //        }
    //        catch (Exception)
    //        {
    //            return StatusCode(500, new { Error = "Failed to update purchase order status." });
    //        }
    //    }


    //    [HttpDelete("Delete")]
    //    public async Task<IActionResult> Delete(Guid id)
    //    {
    //        var po = await _context.PurchaseOrders.FindAsync(id);
    //        if (po == null)
    //            return NotFound(new { Error = "Purchase Order not found." });


    //        _context.PurchaseOrders.Remove(po);
    //        await _context.SaveChangesAsync();
    //        return Ok(new { Success = true });
    //    }


    //    [HttpPost("Preview")]
    //    public async Task<IActionResult> Preview([FromBody] CreatePORequest request)
    //    {
    //        var vendor = await _context.Clients
    //    .Include(c => c.BillingAddress)
    //    .Include(c => c.DeliveryAddress)
    //    .FirstOrDefaultAsync(c => c.Id == request.SupplierId);
    //        // Transient projection for frontend preview
    //        return Ok(new
    //        {
    //            PONo = request.PONo ?? "DRAFT",
    //            POReceivedDate = request.POReceivedDate,
    //            Terms = request.Terms,
    //            DeliveryInstruction = request.DeliveryInstruction,
    //            DeliveryDate = request.DeliveryDate,
    //            Remarks = request.Remarks,
    //            TermsConditions = request.TermsConditions,
    //            BankDetails = request.BankDetails,
    //            Gross = request.Gross,
    //            Discount = request.Discount,
    //            TotalAmount = request.TotalAmount,

    //            // Map the client found in the DB
    //            Vendor = vendor != null ? new
    //            {
    //                vendor.Id,
    //                vendor.Name,
    //                vendor.ContactNo,
    //                vendor.Email,
    //                vendor.ContactPerson,
    //                BillingAddress = vendor.BillingAddress,
    //                DeliveryAddress = vendor.DeliveryAddress
    //            } : null,

    //            POItems = request.POItems.Select(i => new {
    //                i.Item,
    //                i.Description,
    //                i.Quantity,
    //                i.UnitPrice,
    //                i.Unit,
    //                i.Discount,
    //                i.TotalAmount
    //            })
    //        });
    //    }

    //    private object MapToDto(PurchaseOrder q)
    //    {
    //        return new
    //        {
    //            q.Id,
    //            q.PONo,
    //            q.ProjectId,
    //            q.Project,
    //            q.Description,
    //            q.TermsConditions,
    //            q.BankDetails,
    //            q.Remarks,
    //            q.DeliveryInstruction,
    //            q.DeliveryDate,
    //            q.POReceivedDate,
    //            q.Terms,
    //            q.Status,
    //            q.SupplierId,
    //            q.ClientId,
    //            Client = q.Client != null ? new Client
    //            {
    //                Id = q.ClientId ?? Guid.Empty,
    //                Name = q.Client.Name,
    //                ContactNo = q.Client.ContactNo,
    //                Email = q.Client.Email,
    //                ContactPerson = q.Client.ContactPerson, // Added for completeness

    //                // Project the new structured addresses
    //                BillingAddress = q.Client.BillingAddress != null ? new Address
    //                {
    //                    Id = q.Client.BillingAddress.Id,
    //                    AddressLine1 = q.Client.BillingAddress.AddressLine1,
    //                    AddressLine2 = q.Client.BillingAddress.AddressLine2,
    //                    City = q.Client.BillingAddress.City,
    //                    State = q.Client.BillingAddress.State,
    //                    Country = q.Client.BillingAddress.Country,
    //                    Poscode = q.Client.BillingAddress.Poscode
    //                } : null,

    //                DeliveryAddress = q.Client.DeliveryAddress != null ? new Address
    //                {
    //                    Id = q.Client.DeliveryAddress.Id,
    //                    AddressLine1 = q.Client.DeliveryAddress.AddressLine1,
    //                    AddressLine2 = q.Client.DeliveryAddress.AddressLine2,
    //                    City = q.Client.DeliveryAddress.City,
    //                    State = q.Client.DeliveryAddress.State,
    //                    Country = q.Client.DeliveryAddress.Country,
    //                    Poscode = q.Client.DeliveryAddress.Poscode
    //                } : null
    //            } : null,
    //            Supplier = q.Supplier != null ? new Supplier
    //            {
    //                Id = q.SupplierId ?? Guid.Empty,
    //                Name = q.Supplier.Name,
    //                ContactNo = q.Supplier.ContactNo,
    //                FaxNo = q.Supplier.FaxNo,
    //                Email = q.Supplier.Email,
    //                ACNo = q.Supplier.ACNo,
    //                ContactPerson = q.Supplier.ContactPerson, // Added for completeness

    //                // Project the new structured addresses
    //                BillingAddress = q.Supplier.BillingAddress != null ? new Address
    //                {
    //                    Id = q.Supplier.BillingAddress.Id,
    //                    AddressLine1 = q.Supplier.BillingAddress.AddressLine1,
    //                    AddressLine2 = q.Supplier.BillingAddress.AddressLine2,
    //                    City = q.Supplier.BillingAddress.City,
    //                    State = q.Supplier.BillingAddress.State,
    //                    Country = q.Supplier.BillingAddress.Country,
    //                    Poscode = q.Supplier.BillingAddress.Poscode
    //                } : null,

    //                DeliveryAddress = q.Supplier.DeliveryAddress != null ? new Address
    //                {
    //                    Id = q.Supplier.DeliveryAddress.Id,
    //                    AddressLine1 = q.Supplier.DeliveryAddress.AddressLine1,
    //                    AddressLine2 = q.Supplier.DeliveryAddress.AddressLine2,
    //                    City = q.Supplier.DeliveryAddress.City,
    //                    State = q.Supplier.DeliveryAddress.State,
    //                    Country = q.Supplier.DeliveryAddress.Country,
    //                    Poscode = q.Supplier.DeliveryAddress.Poscode
    //                } : null
    //            } : null,
    //            q.Gross,
    //            q.TotalAmount,
    //            q.Discount,
    //            POItems = q.POItems?
    //.Select(i => new
    //{
    //    i.Id,
    //    i.Item,
    //    i.Description,
    //    i.Quantity,
    //    i.Unit,
    //    i.UnitPrice,
    //    i.Discount,
    //    i.TotalAmount
    //})
    //.ToList()
    //    };
    //    }



    }
}
