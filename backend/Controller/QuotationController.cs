using Microsoft.AspNetCore.Authorization;
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
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class QuotationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly IWebHostEnvironment _env;

        public QuotationController(AppDbContext context, IHubContext<NotificationHub> hub, IWebHostEnvironment env)
        {
            _context = context;
            _hub = hub;
            _env = env;
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
                var query = _context.Quotations.AsQueryable();

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
                    var parameter = Expression.Parameter(typeof(Quotation), "q");
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
                        var lambda = Expression.Lambda<Func<Quotation, bool>>(finalExpression, parameter);
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
            IQueryable<Quotation> query = _context.Quotations.AsQueryable();

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
            //return Ok(MapToDto(data));
            return Ok(data);
        }

        //[HttpPost("Create")]
        //public async Task<ActionResult<object>> Create([FromBody] CreatePORequest request)
        //{
        //    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        //    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });

        //    if (string.IsNullOrWhiteSpace(request.PONo))
        //        return BadRequest(new { Error = "PO Number is required for finalized records." });

        //    try
        //    {
        //        var po = new PurchaseOrder
        //        {
        //            Id = Guid.NewGuid(),
        //            PONo = request.PONo,
        //            QuotationId = request.QuotationId,
        //            POReceivedDate = request.POReceivedDate,
        //            Terms = request.Terms,
        //            ProjectId = request.ProjectId,
        //            SupplierId = request.SupplierId ?? null,
        //            ClientId = request.ClientId ?? null,
        //            DeliveryInstruction = request.DeliveryInstruction,
        //            DeliveryDate = request.DeliveryDate,
        //            TermsConditions = request.TermsConditions,
        //            BankDetails = request.BankDetails,
        //            Status = request.ClientId.HasValue ? "Received" : "Draft",
        //            Gross = request.Gross,
        //            Discount = request.Discount,   // Matching your Quotation model name
        //            TotalAmount = request.TotalAmount,
        //            TotalQuantity = request.TotalQuantity,
        //            Remarks = request.Remarks,
        //            CreatedById = Guid.Parse(userIdClaim),
        //            CreatedAt = DateTime.UtcNow
        //        };

        //        // Use the null-coalescing operator ?? to handle empty/null item lists
        //        po.POItems = (request.POItems ?? new List<POItemRequest>()).Select(i => new POItem
        //        {
        //            Id = Guid.NewGuid(),
        //            PurchaseOrderId = po.Id,
        //            Item = i.Item,
        //            Description = i.Description,
        //            Quantity = i.Quantity,
        //            UnitPrice = i.UnitPrice,
        //            Discount = i.Discount,
        //            TotalAmount = i.TotalAmount,
        //            Unit = i.Unit,
        //            CreatedAt = DateTime.UtcNow
        //        }).ToList();

        //        _context.PurchaseOrders.Add(po);
        //        await _context.SaveChangesAsync();

        //        var result = MapToDto(po);
        //        await _hub.Clients.All.SendAsync("PurchaseOrderAdded", result);

        //        return Ok(result);
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { Error = "Failed to create.", Details = ex.Message });
        //    }
        //}


        //[HttpPut("Update")]
        //public async Task<ActionResult<PurchaseOrder>> Update([FromBody] UpdatePORequest request)
        //{
        //    if (request == null || request.Id == Guid.Empty)
        //        return BadRequest("Invalid request.");

        //    var po = await _context.PurchaseOrders
        //        .Include(q => q.POItems)
        //        .FirstOrDefaultAsync(q => q.Id == request.Id);

        //    if (po == null)
        //        return NotFound(new { Error = "Purchase order not found." });

        //    try
        //    {
        //        // =========================
        //        // UPDATE HEADER
        //        // =========================
        //        po.PONo = request.PONo ?? po.PONo;
        //        po.SupplierId = request.SupplierId != Guid.Empty ? request.SupplierId : po.SupplierId;
        //        po.POReceivedDate = request.POReceivedDate ?? po.POReceivedDate;
        //        po.DeliveryInstruction = request.DeliveryInstruction ?? po.DeliveryInstruction;
        //        po.DeliveryDate = request.DeliveryDate ?? po.DeliveryDate;
        //        po.Terms = request.Terms ?? po.Terms;
        //        po.Page = request.Page ?? po.Page;
        //        po.Remarks = request.Remarks ?? po.Remarks;
        //        po.TermsConditions = request.TermsConditions ?? po.TermsConditions;
        //        po.BankDetails = request.BankDetails ?? po.BankDetails;
        //        po.Discount = request.Discount ?? po.Discount;
        //        po.TotalQuantity = request.TotalQuantity ?? po.TotalQuantity;
        //        po.UpdatedAt = DateTime.UtcNow;

        //        // =========================
        //        // MAP REQUEST ITEMS SAFELY
        //        // =========================
        //        var requestItems = request.POItems?
        //            .Select(p => new UpdatePOItemRequest
        //            {
        //                Id = p.Id,
        //                Item = p.Item,
        //                Description = p.Description,
        //                Quantity = p.Quantity,
        //                UnitPrice = p.UnitPrice,
        //                Unit = p.Unit,
        //                Discount = (decimal)(p.Discount),
        //                TotalAmount = p.TotalAmount
        //            })
        //            .ToList() ?? new List<UpdatePOItemRequest>();

        //        // =========================
        //        // COLLECT VALID ITEM IDS
        //        // =========================
        //        var requestItemIds = requestItems
        //            .Where(i => i.Id.HasValue && i.Id.Value != Guid.Empty)
        //            .Select(i => i.Id.Value)
        //            .ToHashSet();

        //        // =========================
        //        // REMOVE ITEMS NOT IN REQUEST
        //        // =========================
        //        var itemsToRemove = po.POItems
        //            .Where(dbItem => !requestItemIds.Contains(dbItem.Id))
        //            .ToList();

        //        foreach (var item in itemsToRemove)
        //        {
        //            _context.POItems.Remove(item);
        //        }

        //        // =========================
        //        // ADD / UPDATE ITEMS
        //        // =========================
        //        foreach (var itemReq in requestItems)
        //        {
        //            // UPDATE EXISTING ITEM
        //            if (itemReq.Id.HasValue && itemReq.Id.Value != Guid.Empty)
        //            {
        //                var existing = po.POItems
        //                    .FirstOrDefault(i => i.Id == itemReq.Id.Value);

        //                if (existing == null)
        //                    continue;

        //                existing.Item = itemReq.Item;
        //                existing.Description = itemReq.Description;
        //                existing.Quantity = itemReq.Quantity;
        //                existing.UnitPrice = itemReq.UnitPrice;
        //                existing.Unit = itemReq.Unit;
        //                existing.Discount = itemReq.Discount;

        //                // =========================
        //                // RECALCULATE TOTAL
        //                // =========================
        //                var subTotal = itemReq.Quantity * itemReq.UnitPrice;
        //                existing.TotalAmount =
        //                    subTotal - (subTotal * (itemReq.Discount / 100));

        //                existing.UpdatedAt = DateTime.UtcNow;
        //            }
        //            else
        //            {
        //                // ADD NEW ITEM
        //                var subTotal = itemReq.Quantity * itemReq.UnitPrice;

        //                var newItem = new POItem
        //                {
        //                    Id = Guid.NewGuid(),
        //                    PurchaseOrderId = po.Id,
        //                    Item = itemReq.Item,
        //                    Description = itemReq.Description,
        //                    Quantity = itemReq.Quantity,
        //                    UnitPrice = itemReq.UnitPrice,
        //                    Unit = itemReq.Unit,
        //                    Discount = itemReq.Discount,

        //                    TotalAmount =
        //                        subTotal - (subTotal * (itemReq.Discount / 100)),

        //                    CreatedAt = DateTime.UtcNow
        //                };

        //                quote.Items.Add(newItem);
        //            }
        //        }

        //        // =========================
        //        // FINAL TOTAL (SAFE)
        //        // =========================
        //        quote.TotalAmount = quote.Items.Sum(x => x.TotalAmount);

        //        await _context.SaveChangesAsync();

        //        // =========================
        //        // SIGNALR NOTIFY
        //        // =========================
        //        await _hub.Clients.All.SendAsync("QuotationUpdated", quote);

        //        return Ok(quote);
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { Error = "Failed to update quotation.", Details = ex.Message });
        //    }
        //}

        //[HttpPost("Preview")]
        //public async Task<IActionResult> Preview([FromBody] CreateQuotationRequest request)
        //{
        //    var client = await _context.Clients
        //.Include(c => c.BillingAddress)
        //.Include(c => c.DeliveryAddress)
        //.FirstOrDefaultAsync(c => c.Id == request.ClientId);
        //    // Transient projection for frontend preview
        //    return Ok(new
        //    {
        //        QuotationNo = request.QuotationNo ?? "DRAFT",
        //        QuotationDate = request.QuotationDate,
        //        DueDate = request.DueDate,
        //        Description = request.Description,
        //        TermsConditions = request.TermsConditions,
        //        BankDetails = request.BankDetails,
        //        Gross = request.Gross,
        //        Discount = request.Discount,
        //        TotalAmount = request.TotalAmount,

        //        // Map the client found in the DB
        //        Client = client != null ? new
        //        {
        //            client.Id,
        //            client.Name,
        //            client.ContactNo,
        //            client.Email,
        //            client.ContactPerson,
        //            BillingAddress = client.BillingAddress,
        //            DeliveryAddress = client.DeliveryAddress
        //        } : null,

        //        Items = request.Items.Select(i => new {
        //            i.Item,
        //            i.Description,
        //            i.Quantity,
        //            i.Unit,
        //            i.UnitPrice,
        //            i.Discount,
        //            i.TotalAmount
        //        })
        //    });
        //}

        //private object MapToDto(Quotation q)
        //{
        //    return new
        //    {
        //        q.Id,
        //        q.QuotationNo,
        //        q.Description,
        //        q.TermsConditions,
        //        q.BankDetails,
        //        q.QuotationDate,
        //        q.DueDate,
        //        q.Status,
        //        q.ClientId,
        //        Client = q.Client != null ? new Client
        //        {
        //            Id = q.ClientId,
        //            Name = q.Client.Name,
        //            ContactNo = q.Client.ContactNo,
        //            Email = q.Client.Email,
        //            ContactPerson = q.Client.ContactPerson, // Added for completeness

        //            // Project the new structured addresses
        //            BillingAddress = q.Client.BillingAddress != null ? new Address
        //            {
        //                Id = q.Client.BillingAddress.Id,
        //                AddressLine1 = q.Client.BillingAddress.AddressLine1,
        //                AddressLine2 = q.Client.BillingAddress.AddressLine2,
        //                City = q.Client.BillingAddress.City,
        //                State = q.Client.BillingAddress.State,
        //                Country = q.Client.BillingAddress.Country,
        //                Poscode = q.Client.BillingAddress.Poscode
        //            } : null,

        //            DeliveryAddress = q.Client.DeliveryAddress != null ? new Address
        //            {
        //                Id = q.Client.DeliveryAddress.Id,
        //                AddressLine1 = q.Client.DeliveryAddress.AddressLine1,
        //                AddressLine2 = q.Client.DeliveryAddress.AddressLine2,
        //                City = q.Client.DeliveryAddress.City,
        //                State = q.Client.DeliveryAddress.State,
        //                Country = q.Client.DeliveryAddress.Country,
        //                Poscode = q.Client.DeliveryAddress.Poscode
        //            } : null
        //        } : null,
        //        q.Gross,
        //        q.TotalAmount,
        //        q.Discount,
        //        Items = q.Items.Select(i => new
        //        {
        //            i.Id,
        //            i.Item,
        //            i.Description,
        //            i.Quantity,
        //            i.Unit,
        //            i.UnitPrice,
        //            i.Discount,
        //            i.TotalAmount
        //        }).ToList()
        //    };
        //}


        //[HttpPatch("UpdateStatus")]
        //public async Task<IActionResult> UpdateStatus([FromBody] UpdateQuotationStatusRequest request)
        //{
        //    // 1. Fetch the quotation
        //    var quotation = await _context.Quotations
        //        .FirstOrDefaultAsync(q => q.Id == request.Id);

        //    if (quotation == null) return NotFound();

        //    string current = quotation.Status;
        //    string next = request.Status ?? "Draft";

        //    // 2. Define Allowed Transitions
        //    bool isValidTransition = (current, next) switch
        //    {
        //        ("Draft", "Open") => true,
        //        ("Draft", "Pending Signature") => true,
        //        ("Open", "Pending Signature") => true,

        //        // Status 'Signed' is usually set automatically by the system, 
        //        // but we allow the transition here for consistency.
        //        ("Pending Signature", "Signed") => true,

        //        // Admin Action:
        //        ("Signed", "Sent") => true,

        //        ("Sent", "Accepted") => true,
        //        ("Sent", "Declined") => true,
        //        _ => false
        //    };

        //    if (!isValidTransition)
        //    {
        //        return BadRequest(new
        //        {
        //            Error = "Invalid Status Transition",
        //            Details = $"Cannot change from {current} to {next}."
        //        });
        //    }

        //    // 3. Handle Business Logic for Assignment
        //    // Inside UpdateStatus method
        //    try
        //    {
                
        //        // Note: We leave the AssignedToId as-is for "Signed", "Sent", "Accepted" 
        //        // so we know exactly who approved this version.

        //        quotation.Status = next!;
        //        quotation.UpdatedAt = DateTime.UtcNow;

        //        await _context.SaveChangesAsync();

        //        // Broadcast via SignalR
        //        var result = MapToDto(quotation);
        //        await _hub.Clients.All.SendAsync("QuotationStatusChanged", result);

        //        return Ok(result);
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { Error = "Update failed", Details = ex.Message });
        //    }
        //}

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var quotes = await _context.Quotations.FindAsync(id);
            if (quotes == null)
                return NotFound(new { Error = "Quotation not found." });


            _context.Quotations.Remove(quotes);
            await _context.SaveChangesAsync();
            return Ok(new { Success = true });
        }

    //    [HttpPost("Clone/{id}")]
    //    public async Task<IActionResult> Clone(Guid id)
    //    {
    //        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    //        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

    //        // 1. Fetch the source quotation with its items
    //        var source = await _context.Quotations
    //            .Include(q => q.Items)
    //            .FirstOrDefaultAsync(q => q.Id == id);

    //        if (source == null) return NotFound("Source quotation not found.");

    //        try
    //        {
    //            // 2. Generate New Numbers (Incremental Logic)
    //            // Fetches the most recent QuotationNo from the DB to ensure uniqueness
    //            var lastQuote = await _context.Quotations
    //                .OrderByDescending(q => q.CreatedAt)
    //                .Select(q => q.QuotationNo)
    //                .FirstOrDefaultAsync();

    //            string newQuotationNo = IncrementStringNumber(lastQuote ?? source.QuotationNo);

    //            // 3. Create New Quotation Object
    //            var clonedQuotation = new Quotation
    //            {
    //                Id = Guid.NewGuid(),
    //                QuotationNo = newQuotationNo,
    //                QuotationDate = DateTime.UtcNow,
    //                DueDate = DateTime.UtcNow.AddDays(14), // Default to 14 days or use source logic
    //                ClientId = source.ClientId,
    //                Description = source.Description,
    //                Status = "Draft", // Always start clones as Draft
    //                Gross = source.Gross,
    //                Discount = source.Discount,
    //                TotalAmount = source.TotalAmount,

    //                CreatedById = Guid.Parse(userIdClaim),
    //                CreatedAt = DateTime.UtcNow
    //            };

    //            // 4. Clone Items
    //            clonedQuotation.Items = source.Items.Select(i => new QuotationItems
    //            {
    //                Id = Guid.NewGuid(),
    //                QuotationId = clonedQuotation.Id,
    //                Item = i.Item,
    //                Description = i.Description,
    //                Quantity = i.Quantity,
    //                Unit = i.Unit,
    //                UnitPrice = i.UnitPrice,
    //                Discount = i.Discount,
    //                TotalAmount = i.TotalAmount,
    //                CreatedAt = DateTime.UtcNow
    //            }).ToList();

    //            _context.Quotations.Add(clonedQuotation);
    //            await _context.SaveChangesAsync();

    //            // 5. Notify Hub and Return
    //            var result = MapToDto(clonedQuotation);
    //            await _hub.Clients.All.SendAsync("QuotationAdded", result);

    //            return Ok(result);
    //        }
    //        catch (Exception ex)
    //        {
    //            return StatusCode(500, new { Error = "Cloning failed", Details = ex.Message });
    //        }
    //    }

    //    private string IncrementStringNumber(string? input)
    //    {
    //        if (string.IsNullOrEmpty(input)) return "1";

    //        // Find the last group of digits in the string
    //        var match = System.Text.RegularExpressions.Regex.Match(input, @"\d+$");
    //        if (!match.Success) return input + "1";

    //        string digits = match.Value;
    //        // Increment the number and pad with leading zeros to maintain length (e.g., 001 -> 002)
    //        string incremented = (long.Parse(digits) + 1).ToString().PadLeft(digits.Length, '0');

    //        return input.Substring(0, match.Index) + incremented;
    //    }

    //    [HttpPost("ConvertToInvoice/{id}")]
    //    public async Task<IActionResult> ConvertToInvoice(Guid id)
    //    {
    //        var source = await _context.Quotations.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
    //        if (source == null) return NotFound();

    //        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    //        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("User ID not found in token.");

    //        Guid currentUserId = Guid.Parse(userIdClaim);

    //        var lastInv = await _context.Invoices.OrderByDescending(i => i.CreatedAt).Select(i => i.InvoiceNo).FirstOrDefaultAsync();
    //        string newInvoiceNo = IncrementStringNumber(lastInv ?? "INV-000");

    //        var invoice = new Invoice
    //        {
    //            Id = Guid.NewGuid(),
    //            InvoiceNo = newInvoiceNo,
    //            ClientId = source.ClientId,
    //            InvoiceDate = DateTime.UtcNow,
    //            DueDate = DateTime.UtcNow.AddDays(30),
    //            // Round the total amount
    //            TotalAmount = Math.Round(source.TotalAmount ?? 0m, 2),
    //            Status = "Unpaid",
    //            CreatedById = currentUserId,
    //            CreatedAt = DateTime.UtcNow
    //        };

    //        invoice.InvoiceItems = source.Items.Select(i => new InvoiceItem
    //        {
    //            Item = i.Item,
    //            Description = i.Description,
    //            Quantity = i.Quantity,
    //            // Round the rate and the line item amount
    //            Unit = i.Unit,
    //            UnitPrice = Math.Round(i.UnitPrice, 2),
    //            Discount = Math.Round(i.Discount ?? 0m, 2),
    //            TotalAmount = Math.Round(i.TotalAmount, 2)
    //        }).ToList();

    //        _context.Invoices.Add(invoice);
    //        await _context.SaveChangesAsync();
    //        return Ok(new { Message = "Invoice Created", InvoiceNo = newInvoiceNo });
    //    }

    //    [HttpPost("ConvertToPO/{id}")]
    //    public async Task<IActionResult> ConvertToPO(Guid id)
    //    {
    //        var source = await _context.Quotations.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
    //        if (source == null) return NotFound();

    //        var lastPo = await _context.PurchaseOrders.OrderByDescending(p => p.CreatedAt).Select(p => p.PONo).FirstOrDefaultAsync();
    //        string newPoNo = IncrementStringNumber(lastPo ?? "PO-000");

    //        var po = new PurchaseOrder
    //        {
    //            Id = Guid.NewGuid(),
    //            PONo = newPoNo,
    //            POReceivedDate = DateTime.UtcNow,
    //            Status = "ConvertedToPO",
    //            TotalAmount = source.TotalAmount,
    //            CreatedAt = DateTime.UtcNow
    //        };

    //        po.POItems = source.Items.Select(i => new POItem
    //        {
    //            Item = i.Item,
    //            Description = i.Description,
    //            Quantity = i.Quantity,
    //            Unit = i.Unit,
    //            UnitPrice = i.UnitPrice,
    //            Discount = i.Discount,
    //            TotalAmount = i.TotalAmount
    //        }).ToList();

    //        _context.PurchaseOrders.Add(po);
    //        await _context.SaveChangesAsync();
    //        return Ok(new { Message = "PO Created", PoNo = newPoNo });
    //    }
    }
}