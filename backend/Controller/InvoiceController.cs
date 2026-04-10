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
    public class InvoiceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public InvoiceController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.Invoices.AsQueryable();

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
                    var parameter = Expression.Parameter(typeof(Invoice), "q");
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
                        var lambda = Expression.Lambda<Func<Invoice, bool>>(finalExpression, parameter);
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
                var dtoItems = items.Select(item => MapToDto(item)).ToList();

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
            IQueryable<Invoice> query = _context.Invoices.AsQueryable();

            // 1. Handle Includes
            if (!string.IsNullOrWhiteSpace(includes))
            {
                foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    query = query.Include(include.Trim());
                }
            }

            // 2. Handle Filter (Parse Guid safely)
            if (!string.IsNullOrEmpty(filter) && Guid.TryParse(filter, out Guid guidId))
            {
                query = query.Where(d => d.Id == guidId);
            }
            else
            {
                return BadRequest(new { Error = "Valid Invoice ID is required." });
            }

            var data = await query.FirstOrDefaultAsync();

            if (data == null)
                return NotFound();

            // 3. IMPORTANT: Map to DTO to prevent Circular Reference Crash
            var result = MapToDto(data);

            return Ok(result);
        }

        [HttpPost("Create")]
        public async Task<ActionResult<object>> Create([FromBody] CreateInvoiceRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });

            if (string.IsNullOrWhiteSpace(request.InvoiceNo))
                return BadRequest(new { Error = "Invoice Number is required for finalized records." });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var invoice = new Invoice
                {
                    Id = Guid.NewGuid(),
                    InvoiceNo = request.InvoiceNo,
                    InvoiceDate = request.InvoiceDate, // Mapping IssueDate to QuotationDate
                    DueDate = request.DueDate,      // Mapping ValidUntil to DueDate
                    ClientId = request.ClientId,
                    SupplierId = request.SupplierId,
                    Description = request.Description,
                    TermsConditions = request.TermsConditions,
                    BankDetails = request.BankDetails,
                    Status = "Draft",
                    Gross = request.Gross,
                    Discount = request.Discount,   // Matching your Quotation model name
                    TotalAmount = request.TotalAmount,
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTime.UtcNow
                };

                // Use the null-coalescing operator ?? to handle empty/null item lists
                invoice.InvoiceItems = (request.InvoiceItems ?? new List<InvoiceItemRequest>()).Select(i => new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    Item = i.Item,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Discount = i.Discount,
                    TotalAmount = i.TotalAmount,
                    Unit = i.Unit,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.Invoices.Add(invoice);

                if (request.SupplierId.HasValue)
                {
                    var supplier = await _context.Suppliers.FindAsync(request.SupplierId.Value);
                    if (supplier != null)
                    {
                        // Increase the balance (debt) owed to supplier
                        supplier.Balance = (supplier.Balance ?? 0) + (double)invoice.TotalAmount;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var result = MapToDto(invoice);
                await _hub.Clients.All.SendAsync("InvoiceAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to create.", Details = ex.Message });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<Invoice>> Update([FromBody] UpdateInvoiceRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var invoice = await _context.Invoices
                .Include(i => i.InvoiceItems)
                .FirstOrDefaultAsync(i => i.Id == request.Id);

            if (invoice == null) return NotFound(new { Error = "Invoice not found." });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // --- 1. CAPTURE OLD STATE ---
                var oldTotal = invoice.Status == "Draft" ? 0m : invoice.TotalAmount;
                var oldSupplierId = invoice.SupplierId;

                // Update main invoice fields
                invoice.InvoiceNo = request.InvoiceNo ?? invoice.InvoiceNo;
                invoice.InvoiceDate = request.InvoiceDate;
                invoice.DueDate = request.DueDate;
                invoice.ClientId = request.ClientId;
                invoice.SupplierId = request.SupplierId;
                invoice.Description = request.Description;
                invoice.TermsConditions = request.TermsConditions;
                invoice.BankDetails = request.BankDetails;
                invoice.Status = invoice.Status ?? "Draft";
                invoice.UpdatedAt = DateTime.UtcNow;

                // ... [Your existing logic to sync InvoiceItems] ...

                // Recalculate TotalAmount after items are synced
                invoice.TotalAmount = invoice.InvoiceItems.Sum(x => x.TotalAmount);

                // --- 2. CALCULATE NEW STATE ---
                var newSupplierId = invoice.SupplierId;
                var newTotal = invoice.TotalAmount;
                // --- 3. SYNC SUPPLIER BALANCES ---
                // Scenario A: Same Supplier, Amount Changed
                if (oldSupplierId == newSupplierId && newSupplierId.HasValue)
                {
                    var supplier = await _context.Suppliers.FindAsync(newSupplierId.Value);
                    if (supplier != null)
                    {
                        // Add the difference (e.g., if new is 100 and old was 80, add 20)
                        supplier.Balance = (supplier.Balance ?? 0) + (double)(newTotal - oldTotal);
                    }
                }
                // Scenario B: Supplier Swapped
                else
                {
                    // Remove amount from old supplier
                    if (oldSupplierId.HasValue)
                    {
                        var oldSup = await _context.Suppliers.FindAsync(oldSupplierId.Value);
                        if (oldSup != null) oldSup.Balance = (oldSup.Balance ?? 0) - (double)oldTotal;
                    }
                    // Add amount to new supplier
                    if (newSupplierId.HasValue)
                    {
                        var newSup = await _context.Suppliers.FindAsync(newSupplierId.Value);
                        if (newSup != null) newSup.Balance = (newSup.Balance ?? 0) + (double)newTotal;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _hub.Clients.All.SendAsync("InvoiceUpdated", invoice);
                return Ok(invoice);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Error = "Failed to update invoice.", Details = ex.Message });
            }
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateInvoiceStatusRequest request)
        {
            if (request.InvoiceId == Guid.Empty)
                return BadRequest(new { Error = "InvoiceId is required." });

            if (string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { Error = "Status is required." });

            var invoice = await _context.Invoices.FindAsync(request.InvoiceId);
            if (invoice == null)
                return NotFound(new { Error = "Invoice not found." });

            try
            {
                invoice.Status = request.Status;
                invoice.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // 🔔 Optional SignalR notification
                await _hub.Clients.All.SendAsync("InvoiceStatusUpdated", new
                {
                    invoice.Id,
                    invoice.Status
                });

                return Ok(new
                {
                    invoice.Id,
                    invoice.Status
                });
            }
            catch
            {
                return StatusCode(500, new { Error = "Failed to update invoice status." });
            }
        }

        [HttpPost("MarkAsPaid")]
        public async Task<IActionResult> MarkAsPaid([FromBody] MarkInvoicePaidRequest request)
        {
            if (request.InvoiceId == Guid.Empty)
                return BadRequest(new { Error = "InvoiceId is required." });

            if (request.Amount <= 0)
                return BadRequest(new { Error = "Amount must be greater than 0." });

            if (request.ProcessedById == Guid.Empty)
                return BadRequest(new { Error = "ProcessedById is required." });

            var invoice = await _context.Invoices
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.Id == request.InvoiceId);

            if (invoice == null)
                return NotFound(new { Error = "Invoice not found." });

            try
            {
                // 🔹 Calculate current total paid
                var totalPaidSoFar = invoice.Payments
                    .Where(p => p.Status == "Completed")
                    .Sum(p => p.Amount);

                var newTotalPaid = totalPaidSoFar + request.Amount;

                // ❌ Prevent overpayment
                if (newTotalPaid > invoice.TotalAmount)
                {
                    return BadRequest(new
                    {
                        Error = "Payment exceeds invoice total amount.",
                        InvoiceTotal = invoice.TotalAmount,
                        TotalPaidSoFar = totalPaidSoFar
                    });
                }

                // 🔹 Create payment record
                var payment = new Payments
                {
                    Id = Guid.NewGuid(),
                    PaymentNo = GeneratePaymentNo(),
                    InvoiceId = invoice.Id,
                    PaymentMode = request.PaymentMethod,
                    Notes = request.Notes,
                    Amount = request.Amount,
                    Status = "Completed",
                    PaymentDate = DateTime.UtcNow,
                    ProcessedById = request.ProcessedById
                };

                _context.Payments.Add(payment);

                // 🔹 Update invoice status
                if (newTotalPaid == invoice.TotalAmount)
                {
                    invoice.Status = "Paid";
                }
                else
                {
                    invoice.Status = "PartialPaid";
                }

                invoice.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // 🔔 SignalR notification
                await _hub.Clients.All.SendAsync("InvoicePaymentUpdated", new
                {
                    invoice.Id,
                    invoice.Status,
                    InvoiceTotal = invoice.TotalAmount,
                    TotalPaid = newTotalPaid,
                    PaymentId = payment.Id,
                    payment.Amount,
                    payment.PaymentMode
                });

                return Ok(new
                {
                    invoice.Id,
                    invoice.Status,
                    InvoiceTotal = invoice.TotalAmount,
                    TotalPaid = newTotalPaid,
                    PaymentId = payment.Id
                });
            }
            catch
            {
                return StatusCode(500, new { Error = "Failed to process payment." });
            }
        }

        private string GeneratePaymentNo()
        {
            var today = DateTime.UtcNow.ToString("yyyyMMdd");

            var lastPaymentNo = _context.Payments
                .Where(p => p.PaymentNo.StartsWith($"PAY-{today}"))
                .OrderByDescending(p => p.PaymentNo)
                .Select(p => p.PaymentNo)
                .FirstOrDefault();

            int nextSequence = 1;

            if (!string.IsNullOrEmpty(lastPaymentNo))
            {
                var lastSequence = int.Parse(lastPaymentNo.Split('-').Last());
                nextSequence = lastSequence + 1;
            }

            return $"PAY-{today}-{nextSequence:D4}";
        }

        private object MapToDto(Invoice q)
        {
            return new
            {
                q.Id,
                q.InvoiceNo,
                q.Description,
                q.InvoiceDate,
                q.DueDate,
                q.Status,
                q.ClientId,
                q.SupplierId,
                Supplier = q.Supplier != null ? new Supplier
                {
                    Id = q.Supplier.Id,
                    Name = q.Supplier.Name,
                    ContactNo = q.Supplier.ContactNo,
                    FaxNo = q.Supplier.FaxNo,
                    ACNo = q.Supplier.ACNo,
                    Email = q.Supplier.Email,
                    ContactPerson = q.Supplier.ContactPerson, // Added for completeness

                    // Project the new structured addresses
                    BillingAddress = q.Supplier.BillingAddress != null ? new Address
                    {
                        Id = q.Supplier.BillingAddress.Id,
                        AddressLine1 = q.Supplier.BillingAddress.AddressLine1,
                        AddressLine2 = q.Supplier.BillingAddress.AddressLine2,
                        City = q.Supplier.BillingAddress.City,
                        State = q.Supplier.BillingAddress.State,
                        Country = q.Supplier.BillingAddress.Country,
                        Poscode = q.Supplier.BillingAddress.Poscode
                    } : null,

                    DeliveryAddress = q.Supplier.DeliveryAddress != null ? new Address
                    {
                        Id = q.Supplier.DeliveryAddress.Id,
                        AddressLine1 = q.Supplier.DeliveryAddress.AddressLine1,
                        AddressLine2 = q.Supplier.DeliveryAddress.AddressLine2,
                        City = q.Supplier.DeliveryAddress.City,
                        State = q.Supplier.DeliveryAddress.State,
                        Country = q.Supplier.DeliveryAddress.Country,
                        Poscode = q.Supplier.DeliveryAddress.Poscode
                    } : null
                } : null,
                Client = q.Client != null ? new Client
                {
                    Id = q.Client.Id,
                    Name = q.Client.Name,
                    ContactNo = q.Client.ContactNo,
                    Email = q.Client.Email,
                    ContactPerson = q.Client.ContactPerson, // Added for completeness

                    // Project the new structured addresses
                    BillingAddress = q.Client.BillingAddress != null ? new Address
                    {
                        Id = q.Client.BillingAddress.Id,
                        AddressLine1 = q.Client.BillingAddress.AddressLine1,
                        AddressLine2 = q.Client.BillingAddress.AddressLine2,
                        City = q.Client.BillingAddress.City,
                        State = q.Client.BillingAddress.State,
                        Country = q.Client.BillingAddress.Country,
                        Poscode = q.Client.BillingAddress.Poscode
                    } : null,

                    DeliveryAddress = q.Client.DeliveryAddress != null ? new Address
                    {
                        Id = q.Client.DeliveryAddress.Id,
                        AddressLine1 = q.Client.DeliveryAddress.AddressLine1,
                        AddressLine2 = q.Client.DeliveryAddress.AddressLine2,
                        City = q.Client.DeliveryAddress.City,
                        State = q.Client.DeliveryAddress.State,
                        Country = q.Client.DeliveryAddress.Country,
                        Poscode = q.Client.DeliveryAddress.Poscode
                    } : null
                } : null,
                q.Gross,
                q.TotalAmount,
                q.PaidAmount,
                q.Discount,
                InvoiceItems = q.InvoiceItems.Select(i => new
                {
                    i.Id,
                    i.Item,
                    i.Description,
                    i.Quantity,
                    i.Unit,
                    i.UnitPrice,
                    i.Discount,
                    i.TotalAmount
                }).ToList()
            };
        }


        [HttpPost("Clone")]
        public async Task<ActionResult<object>> Clone([FromQuery] Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });

            var sourceInvoice = await _context.Invoices
                .Include(i => i.InvoiceItems).Include(i => i.Client)
            .ThenInclude(c => c.BillingAddress).Include(i => i.Client)
            .ThenInclude(c => c.DeliveryAddress)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (sourceInvoice == null)
                return NotFound(new { Error = "Source invoice not found." });

            try
            {
                // --- LOGIC: Generate Next Invoice Number ---
                string nextInvoiceNo = await GenerateNextInvoiceNo();

                var newInvoice = new Invoice
                {
                    Id = Guid.NewGuid(),
                    InvoiceNo = nextInvoiceNo, // Use the newly generated sequence
                    InvoiceDate = DateTime.UtcNow,
                    DueDate = DateTime.UtcNow.AddDays(14),
                    ClientId = sourceInvoice.ClientId,
                    Client = sourceInvoice.Client,
                    Description = sourceInvoice.Description,
                    TermsConditions = sourceInvoice.TermsConditions,
                    BankDetails = sourceInvoice.BankDetails,
                    Status = "Draft",
                    Discount = sourceInvoice.Discount,
                    TotalAmount = sourceInvoice.TotalAmount,
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTime.UtcNow
                };

                newInvoice.InvoiceItems = sourceInvoice.InvoiceItems.Select(i => new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = newInvoice.Id,
                    Item = i.Item,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    Unit = i.Unit,
                    UnitPrice = i.UnitPrice,
                    Discount = i.Discount,
                    TotalAmount = i.TotalAmount,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.Invoices.Add(newInvoice);
                await _context.SaveChangesAsync();

                var result = MapToDto(newInvoice);
                await _hub.Clients.All.SendAsync("InvoiceAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to clone invoice.", Details = ex.Message });
            }
        }

        // Helper method to calculate the next sequence
        private async Task<string> GenerateNextInvoiceNo()
        {
            var year = DateTime.UtcNow.Year;
            var prefix = $"INV-{year}-";

            // Find the highest existing number for the current year
            var lastInvoice = await _context.Invoices
                .Where(i => i.InvoiceNo.StartsWith(prefix))
                .OrderByDescending(i => i.InvoiceNo)
                .Select(i => i.InvoiceNo)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (!string.IsNullOrEmpty(lastInvoice))
            {
                // Assumes format "INV-2026-001", takes the "001" part
                var parts = lastInvoice.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            // Returns format: INV-2026-001, INV-2026-002, etc.
            return $"{prefix}{nextNumber:D3}";
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
                return NotFound(new { Error = "Invoice not found." });


            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return Ok(new { Success = true });
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {
                var clients = await _context.Clients
    .Where(c => c.Status == "Active")
    .Select(c => new
    {
        Id = c.Id,
        Name = c.Name,
        Email = c.Email,
        ContactNo = c.ContactNo,
        ContactPerson = c.ContactPerson,
        DeliveryAddress = c.DeliveryAddress,
        BillingAddress = c.BillingAddress,
    })
    .OrderBy(c => c.Name)
    .ToListAsync();

                var suppliers = await _context.Suppliers
    .Where(c => c.Status == "Active")
    .Select(c => new
    {
        Id = c.Id,
        Name = c.Name,
        Email = c.Email,
        ContactNo = c.ContactNo,
        ContactPerson = c.ContactPerson,
        DeliveryAddress = c.DeliveryAddress,
        BillingAddress = c.BillingAddress,
    })
    .OrderBy(c => c.Name)
    .ToListAsync();


                return Ok(new
                {
                    Clients = clients,
                    Suppliers = suppliers
                });
            }
            catch
            {
                return StatusCode(500, new { Error = "Failed to load dropdown data." });
            }
        }


        [HttpGet("summary")]
        public async Task<ActionResult<InvoiceSummaryDto>> GetSummary()
        {
            var now = DateTime.UtcNow;
            var firstDayCurrentMonth = new DateTime(now.Year, now.Month, 1);
            var firstDayLastMonth = firstDayCurrentMonth.AddMonths(-1);

            var invoices = await _context.Invoices
                .Where(x => x.CreatedAt >= firstDayLastMonth && x.Status != "Cancelled")
                .ToListAsync();

            // Fix 1: Handle nulls in percentage calculation
            decimal CalculatePercentage(decimal? current, decimal? previous)
            {
                decimal cur = current ?? 0;
                decimal prev = previous ?? 0;
                if (prev == 0) return cur > 0 ? 100 : 0;
                return ((cur - prev) / prev) * 100;
            }

            // Current Month Data
            var currentInvoices = invoices.Where(x => x.CreatedAt >= firstDayCurrentMonth).ToList();

            // Fix 2: Explicitly handle nullable subtractions using ?? 0
            var curTotal = currentInvoices.Sum(x => x.TotalAmount);
            var curPaid = currentInvoices.Sum(x => x.PaidAmount ?? 0);
            var curPending = currentInvoices.Where(x => x.Status != "Paid" && x.DueDate >= now)
                                            .Sum(x => x.TotalAmount - (x.PaidAmount ?? 0));
            var curOverdue = currentInvoices.Where(x => x.Status != "Paid" && x.DueDate < now)
                                            .Sum(x => x.TotalAmount - (x.PaidAmount ?? 0));

            // Previous Month Data
            var prevInvoices = invoices.Where(x => x.CreatedAt >= firstDayLastMonth && x.CreatedAt < firstDayCurrentMonth).ToList();
            var prevTotal = prevInvoices.Sum(x => x.TotalAmount);
            var prevPaid = prevInvoices.Sum(x => x.PaidAmount ?? 0);
            var prevPending = prevInvoices.Where(x => x.Status != "Paid" && x.DueDate < firstDayCurrentMonth)
                                            .Sum(x => x.TotalAmount - (x.PaidAmount ?? 0));
            var prevOverdue = prevInvoices.Where(x => x.Status != "Paid" && x.DueDate < firstDayLastMonth)
                                            .Sum(x => x.TotalAmount - (x.PaidAmount ?? 0));

            return Ok(new InvoiceSummaryDto
            {
                TotalAmount = curTotal,
                TotalPercentage = CalculatePercentage(curTotal, prevTotal),

                PaidAmount = curPaid,
                PaidPercentage = CalculatePercentage(curPaid, prevPaid),

                PendingAmount = curPending,
                PendingPercentage = CalculatePercentage(curPending, prevPending),

                OverdueAmount = curOverdue,
                OverduePercentage = CalculatePercentage(curOverdue, prevOverdue)
            });
        }
    }
}
