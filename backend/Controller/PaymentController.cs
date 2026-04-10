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
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public PaymentController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.Payments.AsQueryable();

                // 1. Handle Includes
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // 2. Handle Dynamic Filtering (The "null" fix is here)
                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(Payments), "u");
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

                            // SPECIAL HANDLING FOR NULL STRINGS (The fix for SupplierId!=null)
                            if (valueStr.Equals("null", StringComparison.OrdinalIgnoreCase))
                            {
                                condition = isNotEqual
                                    ? Expression.NotEqual(propertyAccess, Expression.Constant(null, propertyAccess.Type))
                                    : Expression.Equal(propertyAccess, Expression.Constant(null, propertyAccess.Type));
                            }
                            else if (propertyAccess.Type == typeof(string))
                            {
                                var method = typeof(string).GetMethod("Equals", new[] { typeof(string) });
                                var equalsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));
                                condition = isNotEqual ? Expression.Not(equalsExpr) : equalsExpr;
                            }
                            else if (propertyAccess.Type == typeof(Guid) || propertyAccess.Type == typeof(Guid?))
                            {
                                var guidValue = Guid.Parse(valueStr);
                                var constant = Expression.Constant(guidValue, propertyAccess.Type);
                                condition = isNotEqual ? Expression.NotEqual(propertyAccess, constant) : Expression.Equal(propertyAccess, constant);
                            }
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue = Enum.Parse(propertyAccess.Type, valueStr);
                                var equalsExpr = Expression.Equal(propertyAccess, Expression.Constant(enumValue));
                                condition = isNotEqual ? Expression.Not(equalsExpr) : equalsExpr;
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
                        var lambda = Expression.Lambda<Func<Payments, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }

                // 3. Handle OrderBy
                if (!string.IsNullOrEmpty(orderBy))
                {
                    var isDesc = orderBy.ToLower().Contains("desc");
                    var propertyName = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();

                    query = isDesc
                        ? query.OrderByDescending(q => EF.Property<object>(q, propertyName))
                        : query.OrderBy(q => EF.Property<object>(q, propertyName));
                }

                // 4. Execute Pagination
                var totalElements = query.Count();
                var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

                // 5. Map to DTOs (Breaks circular references and fixes "Failed to load response")
                var mappedData = items.Select(i => MapToDto(i)).ToList();

                // 6. Handle Select (Projection)
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = mappedData.Select(item =>
                    {
                        var dict = new Dictionary<string, object>();
                        var type = item.GetType();
                        foreach (var field in selectedFields)
                        {
                            var prop = type.GetProperty(field);
                            dict[field] = prop?.GetValue(item) ?? "null";
                        }
                        return dict;
                    });

                    return Ok(new { Data = projected, TotalElements = totalElements });
                }

                return Ok(new { Data = mappedData, TotalElements = totalElements });
            }
            catch (Exception ex)
            {
                // Log ex here for better debugging
                return StatusCode(500, new { Error = "An unexpected error occurred.", Details = ex.Message });
            }
        }
        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(
      string? filter = null,
      string? includes = null)
        {
            IQueryable<Payments> query = _context.Payments.AsQueryable();

            // 🔹 Dynamic includes
            if (!string.IsNullOrWhiteSpace(includes))
            {
                foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    query = query.Include(include.Trim());
                }
            }

            // 🔹 Example filter (simplified)
            if (!string.IsNullOrEmpty(filter))
            {
                query = query.Where(d => d.Id.ToString() == filter);
            }

            var data = await query.FirstOrDefaultAsync();

            if (data == null)
                return NotFound();

            return Ok(data);
        }

        [HttpPost("Create")]
        public async Task<ActionResult<object>> Create([FromBody] CreatePaymentRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            // ✅ VALIDATION (VERY IMPORTANT)
            if (!request.ClientId.HasValue && !request.SupplierId.HasValue)
                return BadRequest(new { Error = "Payment must have either ClientId or SupplierId." });

            if (request.ClientId.HasValue && request.SupplierId.HasValue)
                return BadRequest(new { Error = "Payment cannot be both Client and Supplier." });

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1️⃣ CREATE PAYMENT
                var payment = new Payments
                {
                    Id = Guid.NewGuid(),
                    PaymentNo = request.PaymentNo,
                    ReferenceNo = request.ReferenceNo,
                    ClientId = request.ClientId,
                    SupplierId = request.SupplierId,
                    InvoiceId = request.InvoiceId,
                    PaymentDate = request.PaymentDate,
                    PaymentMode = request.PaymentMode ?? "",
                    Amount = request.Amount, // ✅ ONLY THIS
                    Notes = request.Notes,
                    Attachment = request.Attachment,
                    Status = "Paid",
                    ProcessedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(payment);

                // 2️⃣ UPDATE INVOICE (ONLY IF EXISTS)
                Invoice? invoice = null;

                if (request.InvoiceId.HasValue)
                {
                    invoice = await _context.Invoices.FindAsync(request.InvoiceId);

                    if (invoice == null)
                        return NotFound(new { Error = "Associated invoice not found." });

                    invoice.PaidAmount = (invoice.PaidAmount ?? 0) + request.Amount;

                    // ✅ STATUS LOGIC
                    if (invoice.PaidAmount == 0)
                        invoice.Status = "Unpaid";
                    else if (invoice.PaidAmount < invoice.TotalAmount)
                        invoice.Status = "PartiallyPaid";
                    else if (invoice.PaidAmount == invoice.TotalAmount)
                        invoice.Status = "Paid";
                    else
                        invoice.Status = "Overpaid";
                }

                // 3️⃣ CREATE INCOME (CLIENT PAYMENT)
                if (request.ClientId.HasValue)
                {
                    var income = new Income
                    {
                        Id = Guid.NewGuid(),
                        IncomeNo = await GenerateIncomeNoAsync(),
                        PaymentId = payment.Id, // 🔥 LINK
                        Amount = request.Amount,
                        IncomeDate = request.PaymentDate,
                        PaymentMode = request.PaymentMode ?? "",
                        Description = invoice != null
                            ? $"Payment received from client for Invoice #{invoice.InvoiceNo}"
                            : "Payment received from client"
                    };

                    _context.Incomes.Add(income);
                }

                // 4️⃣ CREATE EXPENSE (SUPPLIER PAYMENT)
                if (request.SupplierId.HasValue)
                {
                    var expense = new Expense
                    {
                        Id = Guid.NewGuid(),
                        ExpenseNo = await GenerateExpenseNoAsync(),
                        PaymentId = payment.Id,
                        Amount = request.Amount,
                        ExpenseDate = request.PaymentDate,
                        PaymentMode = request.PaymentMode ?? "",
                        Description = "Payment made to supplier"
                    };

                    _context.Expenses.Add(expense);

                    // OPTIONAL: update supplier balance
                    var supplier = await _context.Suppliers.FindAsync(request.SupplierId.Value);
                    if (supplier != null)
                    {
                        supplier.Balance = (supplier.Balance ?? 0) - (double)request.Amount;
                    }
                }

                // 5️⃣ SAVE ALL
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var result = MapToDto(payment);
                await _hub.Clients.All.SendAsync("PaymentAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    Error = "Failed to create payment and financial records.",
                    Details = ex.Message
                });
            }
        }

        private async Task<string> GenerateIncomeNoAsync()
        {
            var today = DateTime.Now.ToString("yyMMdd"); // 260409

            var last = await _context.Incomes
                .Where(x => x.IncomeNo.StartsWith($"INC-{today}"))
                .OrderByDescending(x => x.IncomeNo)
                .FirstOrDefaultAsync();

            int next = last == null ? 1 : int.Parse(last.IncomeNo.Split('-').Last()) + 1;

            return $"INC-{today}-{next:D4}";
        }

        private async Task<string> GenerateExpenseNoAsync()
        {
            var today = DateTime.Now.ToString("yyMMdd"); // 260409

            var last = await _context.Expenses
                .Where(x => x.ExpenseNo.StartsWith($"EXP-{today}"))
                .OrderByDescending(x => x.ExpenseNo)
                .FirstOrDefaultAsync();

            int next = last == null ? 1 : int.Parse(last.ExpenseNo.Split('-').Last()) + 1;

            return $"EXP-{today}-{next:D4}";
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

                var invoices = await _context.Invoices.Select(c => new
    {
        Id = c.Id,
        InvoiceNo = c.InvoiceNo
    })
    .OrderBy(c => c.InvoiceNo)
    .ToListAsync();


                return Ok(new
                {
                    Clients = clients,
                    Suppliers = suppliers,
                    Invoices = invoices
                });
            }
            catch
            {
                return StatusCode(500, new { Error = "Failed to load dropdown data." });
            }
        }



        private object MapToDto(Payments p)
        {
            return new
            {
                p.Id,
                p.PaymentNo,
                p.ReferenceNo,
                p.InvoiceId,
                Invoice = p.Invoice != null ? new
                {
                    p.Invoice.Id,
                    p.Invoice.InvoiceNo,
                    p.Invoice.Status,
                    p.Invoice.ClientId
                } : null,
                p.PaymentDate,
                p.PaymentMode,
                p.Amount,
                p.Notes,
                p.Attachment,
                p.Status,
                p.SupplierId,
                Supplier = p.Supplier != null ? new Supplier
                {
                    Id = p.Supplier.Id,
                    Name = p.Supplier.Name,
                    Balance = p.Supplier.Balance,
                    Email = p.Supplier.Email,
                    ContactNo = p.Supplier.ContactNo,
                    FaxNo = p.Supplier.FaxNo,
                    ACNo = p.Supplier.ACNo,
                } : null,
                p.ClientId,
                Client = p.Client != null ? new Client
                {
                    Id = p.ClientId ?? Guid.Empty,
                    Name = p.Client.Name,
                    ContactNo = p.Client.ContactNo,
                    Email = p.Client.Email,
                    ContactPerson = p.Client.ContactPerson, // Added for completeness

                    // Project the new structured addresses
                    BillingAddress = p.Client.BillingAddress != null ? new Address
                    {
                        Id = p.Client.BillingAddress.Id,
                        AddressLine1 = p.Client.BillingAddress.AddressLine1,
                        AddressLine2 = p.Client.BillingAddress.AddressLine2,
                        City = p.Client.BillingAddress.City,
                        State = p.Client.BillingAddress.State,
                        Country = p.Client.BillingAddress.Country,
                        Poscode = p.Client.BillingAddress.Poscode
                    } : null,

                    DeliveryAddress = p.Client.DeliveryAddress != null ? new Address
                    {
                        Id = p.Client.DeliveryAddress.Id,
                        AddressLine1 = p.Client.DeliveryAddress.AddressLine1,
                        AddressLine2 = p.Client.DeliveryAddress.AddressLine2,
                        City = p.Client.DeliveryAddress.City,
                        State = p.Client.DeliveryAddress.State,
                        Country = p.Client.DeliveryAddress.Country,
                        Poscode = p.Client.DeliveryAddress.Poscode
                    } : null
                } : null
              
            };
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return NotFound(new { Error = "Payment not found." });

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. Update the Invoice
                var invoice = await _context.Invoices.FindAsync(payment.InvoiceId);
                if (invoice != null)
                {
                    // Reverse the payment amount
                    invoice.PaidAmount = (invoice.PaidAmount ?? 0) - payment.Amount;

                    // Recalculate status
                    if (invoice.PaidAmount <= 0)
                    {
                        invoice.PaidAmount = 0;
                        invoice.Status = "Unpaid";
                    }
                    else if (invoice.PaidAmount < invoice.TotalAmount)
                    {
                        invoice.Status = "PartiallyPaid";
                    }
                    else
                    {
                        invoice.Status = "Paid";
                    }
                }

                // 2. Update Supplier Balance
                if (payment.SupplierId.HasValue)
                {
                    var supplier = await _context.Suppliers.FindAsync(payment.SupplierId.Value);
                    if (supplier != null)
                    {
                        // Increase the balance (debt) because the payment is gone
                        supplier.Balance = (supplier.Balance ?? 0) + (double)payment.Amount;
                    }
                }

                // 3. Remove the payment and save
                _context.Payments.Remove(payment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Notify SignalR (Optional)
                await _hub.Clients.All.SendAsync("PaymentDeleted", id);

                return Ok(new { Success = true });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Error = "Failed to delete payment and revert balances.", Details = ex.Message });
            }
        }



    }
}
