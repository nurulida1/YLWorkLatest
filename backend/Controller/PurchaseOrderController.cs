using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using System.Text.Json;

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
            try
            {
                IQueryable<PurchaseOrder> query = _context.PurchaseOrders.AsQueryable();

                // 1. Dynamic Includes
                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // 2. Filter by ID
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

                // 3. Execute
                var data = await query.FirstOrDefaultAsync();

                if (data == null)
                    return NotFound();

                // 4. IMPORTANT: prevent circular reference crash
                // (same idea as your GetMany DTO safety)
                var safeResult = new
                {
                    data.Id,
                    data.PurchaseOrderNo,
                    data.Type,
                    data.PODate,
                    data.Status,
                    data.TotalAmount,
                    data.SupplierId,
                    data.ClientId,
                    data.FromCompanyId,
                    data.QuotationId,
                    data.Terms,
                    data.Remarks,
                    data.ProjectId,

                    PurchaseOrderItems = data.PurchaseOrderItems?.Select(i => new
                    {
                        i.Id,
                        i.PurchaseOrderId,
                        i.Item,
                        i.Description,
                        i.Quantity,
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
                    PurchaseOrderNo = request.PurchaseOrderNo,
                    FromCompanyId = request.FromCompanyId,
                    Type = request.Type,
                    PODate = request.PODate,
                    POReceivedDate = request.POReceivedDate,
                    ClientId = request.ClientId,
                    SupplierId = request.SupplierId,
                    Terms = request.Terms,
                    QuotationId = request.QuotationId,
                    ProjectId = request.ProjectId,
                    Gross = request.Gross,
                    Discount = request.Discount,
                    TotalAmount = request.TotalAmount,
                    Notes = request.Notes,
                    Remarks = request.Remarks,
                    TermsAndCondition = request.TermsAndConditions,
                    BankDetails = request.BankDetails,
                    TotalQuantity = request.TotalQuantity,
                    Attachment = filePath,
                    Status = request.ClientId.HasValue ? "Received" : "Draft",
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTime.UtcNow
                };

                po.PurchaseOrderItems = request.PurchaseOrderItems?.Select(x => new PurchaseOrderItem
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderId = po.Id,
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
                    Status = request.Type == "Incoming" ? "Received" : "Draft",
                    ActionAt = DateTime.UtcNow,
                    ActionUserId = Guid.Parse(userIdClaim),
                    Remarks = "PO created",
                };

                _context.PurchaseOrders.Add(po);
                _context.PurchaseOrderStatusHistories.Add(statusHistory);

                await _context.SaveChangesAsync();

                var poWithRelations = await _context.PurchaseOrders
                    .Include(x => x.Client)
                        .ThenInclude(c => c.BillingAddress)
                    .Include(x => x.Client)
                        .ThenInclude(c => c.DeliveryAddress)
                    .Include(x => x.Supplier)
                        .ThenInclude(s => s.BillingAddress)
                    .Include(x => x.Supplier)
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

        [HttpPut("Update")]
        public async Task<ActionResult<object>> Update(
    [FromForm] UpdatePORequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var po = await _context.PurchaseOrders
                .Include(x => x.PurchaseOrderItems)
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

                // Update fields
                po.PurchaseOrderNo = request.PurchaseOrderNo;
                po.FromCompanyId = request.FromCompanyId;
                po.Type = request.Type;
                po.PODate = request.PODate;
                po.POReceivedDate = request.POReceivedDate;
                po.ClientId = request.ClientId;
                po.SupplierId = request.SupplierId;
                po.Terms = request.Terms;
                po.QuotationId = request.QuotationId;
                po.ProjectId = request.ProjectId;
                po.Gross = request.Gross;
                po.Discount = request.Discount;
                po.TotalAmount = request.TotalAmount;
                po.Notes = request.Notes;
                po.Remarks = request.Remarks;
                po.TermsAndCondition = request.TermsAndConditions;
                po.BankDetails = request.BankDetails;
                po.TotalQuantity = request.TotalQuantity;
                po.UpdatedAt = DateTime.Now;

                // Remove existing items from DB first
                var existingItems = await _context.PurchaseOrderItems
                    .Where(x => x.PurchaseOrderId == po.Id)
                    .ToListAsync();

                _context.PurchaseOrderItems.RemoveRange(existingItems);

                await _context.SaveChangesAsync();

                // Add new items
                var newItems = request.PurchaseOrderItems?
                    .Select(x => new PurchaseOrderItem
                    {
                        Id = x.Id ?? Guid.NewGuid(),
                        PurchaseOrderId = po.Id,
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
        public async Task<ActionResult> DeletePurchaseOrder([FromQuery] Guid id)
        {
            var po = await _context.PurchaseOrders.FindAsync(id);
            if (po == null)
                return NotFound(new { Error = "Purchase Order not found." });

            try
            {
                _context.PurchaseOrders.Remove(po);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("PurchaseOrderDeleted", id);

                return Ok(new { Message = "Purchase order deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete purchase order." });
            }
        }



        private object MapToDto(PurchaseOrder q)
        {
            var items = q.PurchaseOrderItems ?? new List<PurchaseOrderItem>();

            return new
            {
                q.Id,
                q.PurchaseOrderNo,
                q.Type,
                q.PODate,
                q.POReceivedDate,
                q.Terms,
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
                q.Remarks,
                q.Notes,
                q.POClientNo,
                q.SOClientNo,
                q.Status,
                q.TermsAndCondition,
                q.BankDetails,
                q.Attachment,
                q.SupplierId,
                q.ClientId,
                q.InvoicedAmount,

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

                Supplier = q.Supplier == null ? null : new
                {
                    Id = q.Supplier.Id,
                    q.Supplier.Name,
                    q.Supplier.ContactNo,
                    q.Supplier.FaxNo,
                    q.Supplier.Email,
                    q.Supplier.ACNo,
                    q.Supplier.ContactPerson1,

                    BillingAddress = q.Supplier.BillingAddress == null ? null : new Address
                    {
                        Id = q.Supplier.BillingAddress.Id,
                        AddressLine1 = q.Supplier.BillingAddress.AddressLine1,
                        AddressLine2 = q.Supplier.BillingAddress.AddressLine2,
                        City = q.Supplier.BillingAddress.City,
                        State = q.Supplier.BillingAddress.State,
                        Country = q.Supplier.BillingAddress.Country,
                        Poscode = q.Supplier.BillingAddress.Poscode
                    },

                    DeliveryAddress = q.Supplier.DeliveryAddress == null ? null : new Address
                    {
                        Id = q.Supplier.DeliveryAddress.Id,
                        AddressLine1 = q.Supplier.DeliveryAddress.AddressLine1,
                        AddressLine2 = q.Supplier.DeliveryAddress.AddressLine2,
                        City = q.Supplier.DeliveryAddress.City,
                        State = q.Supplier.DeliveryAddress.State,
                        Country = q.Supplier.DeliveryAddress.Country,
                        Poscode = q.Supplier.DeliveryAddress.Poscode
                    }
                },

                PurchaseOrderItems = items.ToList()
            };
        }

        private PurchaseOrderItem MapToEntity(POItemRequest req, Guid poId)
        {
            var entity = new PurchaseOrderItem
            {
                Id = Guid.NewGuid(),
                PurchaseOrderId = poId,
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

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            var clients = await _context.Companies
                .Where(x => x.Type == CompanyType.Client)
                .Select(x => new Company
                {
                    Id = x.Id,
                    Name = x.Name
                })
                .ToListAsync();

            var suppliers = await _context.Companies
                .Where(x => x.Type == CompanyType.Supplier)
                .Select(x => new Company
                {
                    Id = x.Id,
                    Name = x.Name
                })
                .ToListAsync();

            var quotations = await _context.Quotations
                .Select(x => new QuotationDropdownDto
                {
                    Id = x.Id,
                    QuotationNo = x.QuotationNo,
                    TotalAmount = x.TotalAmount,
                    ClientId = x.ClientId
                })
                .ToListAsync();

            return Ok(new DropdownResponseDto
            {
                Clients = clients,
                Suppliers = suppliers,
                Quotations = quotations
            });
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(Guid id, string status, Guid? userId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var actionUserId = Guid.Parse(userIdClaim);

            var userName = await _context.Users
                .Where(x => x.Id == actionUserId)
                .Select(x => x.FullName)
                .FirstOrDefaultAsync();

            string? reviewerName = null;

            if (userId.HasValue)
            {
                reviewerName = await _context.Users
                    .Where(x => x.Id == userId.Value)
                    .Select(x => x.FullName)
                    .FirstOrDefaultAsync();
            }

            var po = await _context.PurchaseOrders
                .FirstOrDefaultAsync(x => x.Id == id);

            if (po == null)
                return NotFound();

            if (status == "Rejected")
            {
                po.Status = "Draft";
            }
            else
            {
                po.Status = status;
            }

            var history = new PurchaseOrderStatusHistory
            {
                PurchaseOrderId = id,
                Status = po.Status,

                ActionUserId = actionUserId,
                ActionAt = DateTime.UtcNow,
                ReviewedByUserId = userId,

                Remarks = GenerateStatusRemark(
                    po.Status,
                    userName ?? "System",
                    reviewerName
                )
            };

            _context.PurchaseOrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            var result = await _context.PurchaseOrderStatusHistories
                .Where(x => x.Id == history.Id)
                .Include(x => x.ActionUser).Include(x => x.ReviewedByUser)
                .Select(x => new
                {
                    x.Id,
                    x.Status,
                    x.ActionAt,
                    x.Remarks,
                    ReviewedByUser = x.ReviewedByUser == null ? null : new
                    {
                        x.ReviewedByUser.Id,
                        x.ReviewedByUser.FullName
                    },
                    ActionUser = x.ActionUser == null ? null : new
                    {
                        x.ActionUser.Id,
                        x.ActionUser.FullName
                    }
                })
                .FirstOrDefaultAsync();

            return Ok(result);
        }

        private string GenerateStatusRemark(string status, string userName, string? reviewerName)
        {
            return status switch
            {
                "Revised" => $"PO updated by {userName} and sent for review to {reviewerName ?? "reviewer"}",
                "Approved" => $"PO approved by {userName}",
                "Rejected" => $"PO rejected by {userName}",
                "Sent" => $"PO sent by {userName} to {reviewerName ?? "supplier"}",
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

            var invoiceDate = DateTime.UtcNow;

            var invoice = new Invoice
            {
                InvoiceNo = GenerateInvoiceNo("PUR"),
                InvoiceDate = invoiceDate,
                DueDate = invoiceDate.AddDays(GetTermsDays(po.Terms)),
                SupplierId = po.SupplierId,
                ClientId = po.ClientId,
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

            po.Status =
                newTotalInvoiced == 0 ? "Issued" :
                newTotalInvoiced < poTotalAmount ? "PartiallyInvoiced" :
                "FullyInvoiced";

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var actionUserId = Guid.Parse(userIdClaim);

            _context.PurchaseOrderStatusHistories.Add(new PurchaseOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                PurchaseOrderId = po.Id,
                Status = po.Status,
                ActionAt = DateTime.UtcNow,
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

        private int GetTermsDays(string? terms) => int.TryParse(terms, out int days) ? days : 30;

        private string GenerateInvoiceNo(string prefix)
        {
            var datePart = DateTime.UtcNow.ToString("yyyyMMdd");

            var startOfDay = DateTime.UtcNow.Date;
            var endOfDay = startOfDay.AddDays(1);

            var countToday = _context.Invoices
                .Count(x => x.CreatedAt >= startOfDay && x.CreatedAt < endOfDay);

            return $"{prefix}-{datePart}-{(countToday + 1):D4}";
        }
    }
}
