using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetMany")]
        public async Task<IActionResult> GetMany(
    int page = 1,
    int pageSize = 10,
    string? filter = null,
    string? orderBy = null,
    string? includes = null)
        {
            try
            {
                var query = _context.Payments.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    query = query.Where(x =>
                        x.PaymentNo.Contains(filter) ||
                        x.Notes!.Contains(filter) ||
                        x.Status.Contains(filter)
                    );
                }

                if (!string.IsNullOrEmpty(orderBy))
                {
                    bool desc = orderBy.EndsWith(" desc", StringComparison.OrdinalIgnoreCase);
                    var field = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();

                    query = desc
                        ? query.OrderByDescending(x => EF.Property<object>(x, field))
                        : query.OrderBy(x => EF.Property<object>(x, field));
                }
                else
                {
                    query = query.OrderByDescending(x => x.PaymentDate);
                }

                var totalElements = await query.CountAsync();

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var result = items.Select(x => new
                {
                    x.Id,
                    x.PaymentNo,
                    x.InvoiceId,
                    x.SupplierId,
                    x.ClientId,
                    x.PaymentDate,
                    x.PaymentMode,
                    x.Amount,
                    x.Notes,
                    x.Status,
                    x.Attachment,
                    Supplier = x.Supplier == null ? null : new
                    {
                        Name = x.Supplier.Name
                    },
                    Client = x.Client == null ? null : new
                    {
                        Name = x.Client.Name
                    },
                    Invoice = x.Invoice == null ? null : new
                    {
                        x.Invoice.Id,
                        x.Invoice.InvoiceNo,
                        x.Invoice.TotalAmount,
                        x.Invoice.PaidAmount
                    }
                });

                return Ok(new
                {
                    Data = result,
                    TotalElements = totalElements,
                    Page = page,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to fetch payments",
                    Details = ex.Message
                });
            }
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
                return NotFound("Invoice not found");

            string? filePath = null;

            if (request.Attachment != null)
            {
                var uploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/payments");

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
                PaymentNo = string.IsNullOrWhiteSpace(request.PaymentNo)
                    ? GeneratePaymentNo()
                    : request.PaymentNo,

                InvoiceId = request.InvoiceId,
                SupplierId = request.SupplierId,
                PaymentDate = request.PaymentDate,
                PaymentMode = request.PaymentMode,
                Amount = request.Amount,
                Notes = request.Notes,
                Attachment = filePath,
                Status = "Paid",
                ProcessedById = userId
            };

            _context.Payments.Add(payment);

            var expense = new Expense
            {
                Id = Guid.NewGuid(),
                ExpenseNo = await GenerateExpenseNo(),
                PaymentId = payment.Id,
                Amount = request.Amount,
                ExpenseDate = request.PaymentDate,
                PaymentMode = request.PaymentMode,
                Description = $"Payment for Invoice {invoice.InvoiceNo}",
                ProcessedById = userId
            };

            _context.Expenses.Add(expense);

            var totalPaid = await _context.Payments
                .Where(x => x.InvoiceId == request.InvoiceId)
                .SumAsync(x => x.Amount);

            invoice.PaidAmount = totalPaid;

            invoice.Status = totalPaid >= invoice.TotalAmount
                ? "Paid"
                : "PartiallyPaid";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                payment,
                expense,
                invoice
            });
        }

        private string GeneratePaymentNo()
        {
            var date = DateTime.UtcNow.ToString("yyyyMMdd");

            var countToday = _context.Payments
                .Count(x => x.PaymentDate.Date == DateTime.UtcNow.Date);

            return $"PAY-{date}-{(countToday + 1):D4}";
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
                return $"{prefix}-0001";

            var lastNumber = int.Parse(lastExpense.ExpenseNo.Split('-').Last());
            return $"{prefix}-{(lastNumber + 1):D4}";
        }
    }
}