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
                var query = _context.Invoices.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

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
                        var lambda = Expression.Lambda<Func<Invoice, bool>>(finalExpression, parameter);
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
                IQueryable<Invoice> query = _context.Invoices.AsQueryable();

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
                    data.InvoiceNo,
                    data.Type,
                    data.InvoiceDate,
                    data.Status,
                    data.TotalAmount,
                    data.SupplierId,
                    data.ClientId,
                    data.CompanyId,
                    data.QuotationId,
                    data.Terms,
                    data.Remarks,
                    data.ProjectId,
                    data.DeliveryOrderId,
                    InvoiceItems = data.InvoiceItems?.Select(i => new
                    {
                        i.Id,
                        i.InvoiceId,
                        i.Item,
                        i.Description,
                        i.Quantity,
                        i.UnitPrice,
                        i.Unit,
                        i.Amount,
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
        public async Task<IActionResult> Create([FromForm] CreateInvoiceRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            try
            {
                if (!string.IsNullOrEmpty(Request.Form["invoiceItems"]))
                {
                    request.InvoiceItems =
                        JsonSerializer.Deserialize<List<InvoiceItemRequest>>(
                            Request.Form["invoiceItems"],
                            new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            }
                        );
                }

                string? filePath = null;

                if (request.Attachment != null)
                {
                    var folder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "Invoice");
                    if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.Attachment.FileName)}";
                    var fullPath = Path.Combine(folder, fileName);

                    using var stream = new FileStream(fullPath, FileMode.Create);
                    await request.Attachment.CopyToAsync(stream);

                    filePath = $"Uploads/Invoice/{fileName}";
                }

                var invoice = new Invoice
                {
                    Id = Guid.NewGuid(),
                    InvoiceNo = string.IsNullOrWhiteSpace(request.InvoiceNo)
                        ? GenerateInvoiceNo(request.Type)
                        : request.InvoiceNo,

                    DeliveryOrderId = request.DeliveryOrderId,
                    CompanyId = request.CompanyId,
                    ClientId = request.ClientId,
                    SupplierId = request.SupplierId,
                    ProjectId = request.ProjectId,
                    PurchaseOrderId = request.PurchaseOrderId,
                    QuotationId = request.QuotationId,
                    InvoiceDate = request.InvoiceDate,
                    DueDate = request.DueDate,
                    Gross = request.Gross,
                    Discount = request.Discount,
                    TotalAmount = request.TotalAmount,
                    Type = request.Type,
                    Terms = request.Terms,
                    Remarks = request.Remarks,
                    Notes = request.Notes,
                    BankDetails = request.BankDetails,
                    Attachment = filePath,
                    CreatedById = Guid.Parse(userIdClaim),
                    Status = request.Type == "Purchase" ? "Received" : "Draft"
                };

                invoice.InvoiceItems = request.InvoiceItems?
                    .Select(x => new InvoiceItem
                    {
                        Id = Guid.NewGuid(),
                        InvoiceId = invoice.Id,
                        Item = x.Item,
                        Description = x.Description,
                        Quantity = x.Quantity,
                        Unit = x.Unit,
                        UnitPrice = x.UnitPrice,
                        Discount = x.Discount,
                        Amount = x.Amount
                    })
                    .ToList()
                    ?? new List<InvoiceItem>();

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("InvoiceCreated", invoice.Id);

                return Ok(MapToDto(invoice));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromForm] UpdateInvoiceRequest request)
        {
            var invoice = await _context.Invoices
                .Include(x => x.InvoiceItems)
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (invoice == null)
                return NotFound();

            try
            {
                if (!string.IsNullOrEmpty(Request.Form["invoiceItems"]))
                {
                    request.InvoiceItems =
                        JsonSerializer.Deserialize<List<UpdateInvoiceItemRequest>>(
                            Request.Form["invoiceItems"],
                            new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            }
                        );
                }

                // update scalar fields FIRST
                invoice.InvoiceNo = request.InvoiceNo;
                invoice.CompanyId = request.CompanyId;
                invoice.SupplierId = request.SupplierId;
                invoice.ClientId = request.ClientId;
                invoice.InvoiceDate = request.InvoiceDate;
                invoice.DueDate = request.DueDate;
                invoice.Gross = request.Gross;
                invoice.Discount = request.Discount;
                invoice.TotalAmount = request.TotalAmount;
                invoice.Remarks = request.Remarks;
                invoice.Type = request.Type;
                invoice.Notes = request.Notes;

                // remove old items (IMPORTANT: use DbSet, not navigation)
                var oldItems = _context.InvoiceItems
                    .Where(x => x.InvoiceId == invoice.Id);

                _context.InvoiceItems.RemoveRange(oldItems);

                await _context.SaveChangesAsync(); // commit delete FIRST

                // add new items
                var newItems = request.InvoiceItems?
                    .Select(x => new InvoiceItem
                    {
                        Id = Guid.NewGuid(),
                        InvoiceId = invoice.Id,
                        Item = x.Item,
                        Description = x.Description,
                        Quantity = x.Quantity,
                        Unit = x.Unit,
                        UnitPrice = x.UnitPrice,
                        Discount = x.Discount,
                        Amount = x.Amount
                    })
                    .ToList() ?? new List<InvoiceItem>();

                await _context.InvoiceItems.AddRangeAsync(newItems);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("InvoiceUpdated", invoice.Id);

                return Ok(MapToDto(invoice));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteInvoice([FromQuery] Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
                return NotFound(new { Error = "Invoice not found." });

            try
            {
                _context.Invoices.Remove(invoice);
                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("InvoiceDeleted", id);

                return Ok(new { Message = "Invoice deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete invoice." });
            }
        }

        private object MapToDto(Invoice i)
        {
            var status = i.Status;

            if (
                i.DueDate.Date < DateTime.UtcNow.Date &&
                status != "Paid" &&
                status != "Cancelled"
            )
            {
                status = "Overdue";
            }

            return new
            {
                i.Id,
                i.InvoiceNo,
                i.InvoiceDate,
                i.DueDate,
                Status = status,
                i.TotalAmount,
                i.PaidAmount,
                i.Type,
                i.ClientId,
                i.PurchaseOrderId,
                i.ProjectId,
                i.QuotationId,
                i.DeliveryOrderId,
                i.CompanyId,
                i.Terms,
                i.Remarks,
                Client = i.Client == null ? null : new
                {
                    i.Client.Id,
                    i.Client.Name
                },

                Supplier = i.Supplier == null ? null : new
                {
                    i.Supplier.Id,
                    i.Supplier.Name
                },

                InvoiceItems = i.InvoiceItems.Select(x => new
                {
                    x.Id,
                    x.Item,
                    x.Description,
                    x.Quantity,
                    x.Unit,
                    x.UnitPrice,
                    x.Discount,
                    x.Amount
                })
            };
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {

            var companies = await _context.Companies
               .Select(x => new Company
               {
                   Id = x.Id,
                   Name = x.Name
               })
               .ToListAsync();

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

            var deliveryOrders = await _context.DeliveryOrders
      .Where(x => x.Type == "Outbound")
      .Select(x => new DODropdownDto
      {
          Id = x.Id,
          DeliveryOrderNo = x.DeliveryOrderNo,
          PurchaseOrderId = x.PurchaseOrderId,

          QuotationId = x.PurchaseOrder != null
              ? x.PurchaseOrder.QuotationId
              : null,

          ProjectId = x.PurchaseOrder != null
              ? x.PurchaseOrder.ProjectId
              : null
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

            var purchaseOrders = await _context.PurchaseOrders.Where(x => x.Type == "Incoming")
                .Select(x => new PurchaseOrder
                {
                    Id = x.Id,
                    PurchaseOrderNo = x.PurchaseOrderNo,
                    TotalAmount = x.TotalAmount,
                    ClientId = x.ClientId,
                    QuotationId = x.QuotationId,
                    ProjectId = x.ProjectId
                })
                .ToListAsync();

            var projects = await _context.Projects
                .Select(x => new Project
                {
                    Id = x.Id,
                    ProjectCode = x.ProjectCode,
                    ProjectTitle = x.ProjectTitle,
                    ClientId = x.ClientId
                })
                .ToListAsync();

            return Ok(new DropdownResponseDto
            {
                Companies = companies,
                Clients = clients,
                Suppliers = suppliers,
                Quotations = quotations,
                PurchaseOrders = purchaseOrders,
                Projects = projects,
                DeliveryOrders = deliveryOrders
            });
        }


        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(Guid id, string status)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var actionUserId = Guid.Parse(userIdClaim);

            var userName = await _context.Users
                .Where(x => x.Id == actionUserId)
                .Select(x => x.FullName)
                .FirstOrDefaultAsync();

            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(x => x.Id == id);

            if (invoice == null)
                return NotFound();

            else
            {
                invoice.Status = status;
            }

            await _context.SaveChangesAsync();

            return Ok(invoice);
        }


        [HttpPost("MarkAsPaid")]
        public async Task<IActionResult> MarkAsPaid([FromForm] CreatePaymentRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var userId = Guid.Parse(userIdClaim);

            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(x => x.Id == request.InvoiceId);

            if (invoice == null)
                return NotFound();

            string? filePath = null;

            if (request.Attachment != null && request.Attachment.Length > 0)
            {
                var uploads = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot/uploads/payments"
                );

                if (!Directory.Exists(uploads))
                    Directory.CreateDirectory(uploads);

                var fileName = $"{Guid.NewGuid()}_{request.Attachment.FileName}";
                var fullPath = Path.Combine(uploads, fileName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await request.Attachment.CopyToAsync(stream);
                }

                filePath = $"uploads/payments/{fileName}";
            }

            var payment = new Payments
            {
                Id = Guid.NewGuid(),
                PaymentNo = request.PaymentNo ?? GeneratePaymentNo(),
                InvoiceId = request.InvoiceId,
                SupplierId = request.SupplierId,
                ClientId = request.ClientId,
                PaymentDate = request.PaymentDate,
                PaymentMode = request.PaymentMode,
                Amount = request.Amount,
                Notes = request.Notes,
                Attachment = filePath,
                Status = "Paid",
                ProcessedById = userId
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            if (string.Equals(invoice.Type, "Sales", StringComparison.OrdinalIgnoreCase))
            {
                var income = new Income
                {
                    Id = Guid.NewGuid(),
                    IncomeNo = await GenerateIncomeNo(),
                    PaymentId = payment.Id,
                    Amount = request.Amount,
                    IncomeDate = request.PaymentDate,
                    PaymentMode = request.PaymentMode,
                    Attachment = filePath,
                    Description = $"Payment for Invoice {invoice.InvoiceNo}",
                    ProcessedById = userId
                };

                _context.Incomes.Add(income);
            }
            else
            {
                var expense = new Expense
                {
                    Id = Guid.NewGuid(),
                    ExpenseNo = await GenerateExpenseNo(),
                    PaymentId = payment.Id,
                    Amount = request.Amount,
                    ExpenseDate = request.PaymentDate,
                    PaymentMode = request.PaymentMode,
                    Attachment = filePath,
                    Description = $"Payment for Invoice {invoice.InvoiceNo}",
                    ProcessedById = userId
                };

                _context.Expenses.Add(expense);
            }

            var totalPaid = await _context.Payments
                .Where(x => x.InvoiceId == request.InvoiceId)
                .SumAsync(x => (decimal?)x.Amount) ?? 0m;

            invoice.PaidAmount = totalPaid;

            invoice.Status =
                invoice.PaidAmount >= invoice.TotalAmount
                    ? "Paid"
                    : "PartiallyPaid";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                payment,
                invoice,
                ledgerType = invoice.Type == "Sales" ? "Income" : "Expense"
            });
        }

        private string GenerateInvoiceNo(string type)
        {
            var prefix = type == "Purchase" ? "PI" : "SI";
            var datePart = DateTime.Now.ToString("yyyyMMdd");
            var randomPart = new Random().Next(1000, 9999);

            return $"{prefix}-{datePart}-{randomPart}";
        }

        private async Task<string> GenerateIncomeNo()
        {
            var lastIncomeNo = await _context.Incomes
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.IncomeNo)
                .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(lastIncomeNo))
                return "INC-000001";

            var numberPart = lastIncomeNo.Replace("INC-", "");

            if (int.TryParse(numberPart, out int num))
            {
                return $"INC-{(num + 1).ToString("D6")}";
            }

            return $"INC-000001";
        }

        private string GeneratePaymentNo()
        {
            var date = DateTime.Now.ToString("yyyyMMdd");

            var count = _context.Payments.Count(x =>
                x.CreatedAt == DateTime.Today);

            return $"PAY-{date}-{(count + 1).ToString("0000")}";
        }

        private async Task<string> GenerateExpenseNo()
        {
            var today = DateTime.UtcNow.ToString("yyyyMMdd");

            var prefix = $"EXP-{today}";

            var lastExpense = await _context.Expenses
                .Where(x => x.ExpenseNo.StartsWith(prefix))
                .OrderByDescending(x => x.ExpenseNo)
                .FirstOrDefaultAsync();

            if (lastExpense == null)
            {
                return $"{prefix}-0001";
            }

            var lastNumberStr = lastExpense.ExpenseNo.Split('-').Last();
            var lastNumber = int.Parse(lastNumberStr);

            var nextNumber = lastNumber + 1;

            return $"{prefix}-{nextNumber:D4}";
        }
    }
}
