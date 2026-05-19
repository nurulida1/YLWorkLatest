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

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var value = filter.Contains('=')
                        ? filter.Split('=')[1].Trim()
                        : filter;

                    if (Guid.TryParse(value, out var id))
                    {
                        query = query.Where(x => x.Id == id);
                    }
                }

                var data = await query.FirstOrDefaultAsync();

                if (data == null)
                    return NotFound();

                return Ok(MapToDto(data));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
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

                invoice.InvoiceItems = request.InvoiceItems.Select(x => new InvoiceItem
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
                }).ToList();

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                if (invoice.SupplierId != null)
                {
                    await _context.Entry(invoice)
                        .Reference(i => i.Supplier)
                        .LoadAsync();
                }

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
                // update fields
                invoice.InvoiceNo = request.InvoiceNo;
                invoice.InvoiceDate = request.InvoiceDate;
                invoice.DueDate = request.DueDate;
                invoice.Gross = request.Gross;
                invoice.Discount = request.Discount;
                invoice.TotalAmount = request.TotalAmount;
                invoice.Remarks = request.Remarks;
                invoice.Type = request.Type;
                invoice.Notes = request.Notes;

                _context.InvoiceItems.RemoveRange(invoice.InvoiceItems);

                invoice.InvoiceItems = request.InvoiceItems?.Select(x => new InvoiceItem
                {
                    Id = x.Id ?? Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    Item = x.Item,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    UnitPrice = x.UnitPrice,
                    Discount = x.Discount,
                    Amount = x.Amount
                }).ToList();

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

            var deliveryOrders = await _context.DeliveryOrders.Select(x => new DeliveryOrder
            {
                Id = x.Id,
                DeliveryOrderNo = x.DeliveryOrderNo
            }).ToListAsync();

            var quotations = await _context.Quotations
                .Select(x => new QuotationDropdownDto
                {
                    Id = x.Id,
                    QuotationNo = x.QuotationNo,
                    TotalAmount = x.TotalAmount,
                    ClientId = x.ClientId
                })
                .ToListAsync();

            var purchaseOrders = await _context.PurchaseOrders
                .Select(x => new PurchaseOrder
                {
                    Id = x.Id,
                    PurchaseOrderNo = x.PurchaseOrderNo,
                    TotalAmount = x.TotalAmount,
                    ClientId = x.ClientId
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
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateInvoiceStatusRequest request)
        {
            var invoice = await _context.Invoices.FindAsync(request.InvoiceId);

            if (invoice == null)
                return NotFound();

            invoice.Status = request.Status;

            await _context.SaveChangesAsync();

            return Ok(new { invoice.Id, invoice.Status });
        }

        [HttpPost("MarkPaid")]
        public async Task<IActionResult> MarkPaid([FromBody] MarkInvoicePaidRequest request)
        {
            var invoice = await _context.Invoices.FindAsync(request.InvoiceId);

            if (invoice == null)
                return NotFound();

            invoice.PaidAmount = (invoice.PaidAmount ?? 0) + request.Amount;

            if (invoice.PaidAmount >= invoice.TotalAmount)
                invoice.Status = "Paid";
            else
                invoice.Status = "Partially Paid";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                invoice.Id,
                invoice.PaidAmount,
                invoice.Status
            });
        }

        private string GenerateInvoiceNo(string type)
        {
            var prefix = type == "Purchase" ? "PI" : "SI";
            var datePart = DateTime.Now.ToString("yyyyMMdd");
            var randomPart = new Random().Next(1000, 9999);

            return $"{prefix}-{datePart}-{randomPart}";
        }
    }
}
