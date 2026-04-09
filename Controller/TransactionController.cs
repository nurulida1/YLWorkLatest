using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.Linq.Expressions;
using System.Reflection;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionController : ControllerBase
    {

        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public TransactionController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;

        }
        [HttpGet("GetMany")]
        public async Task<ActionResult<object>> GetMany(
            int page = 1,
            int pageSize = 10,
            string? filter = null,
            string? orderBy = null,
            string? select = null,
            string? includes = null)
        {
            try
            {
                var query = _context.Transactions.AsQueryable();

                // 1. Dynamic Includes
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // 2. Dynamic Filtering (Expressions)
                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(Transaction), "u");
                    Expression? finalExpression = null;

                    foreach (var orPart in filter.Split('|'))
                    {
                        Expression? orExpression = null;
                        foreach (var andPart in orPart.Split(','))
                        {
                            bool isNotEqual = andPart.Contains("!=");
                            var kv = isNotEqual ? andPart.Split("!=") : andPart.Split('=');
                            if (kv.Length != 2) continue;

                            var propertyName = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            // Access property (handles nested properties if needed)
                            var propertyAccess = Expression.PropertyOrField(parameter, propertyName);
                            Expression condition;

                            if (propertyAccess.Type == typeof(string))
                            {
                                var method = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                                var containsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));
                                condition = isNotEqual ? Expression.Not(containsExpr) : containsExpr;
                            }
                            else if (Nullable.GetUnderlyingType(propertyAccess.Type) != null || propertyAccess.Type == typeof(Guid))
                            {
                                var converter = TypeDescriptor.GetConverter(propertyAccess.Type);
                                var convertedValue = converter.ConvertFromInvariantString(valueStr);
                                condition = isNotEqual
                                    ? Expression.NotEqual(propertyAccess, Expression.Constant(convertedValue, propertyAccess.Type))
                                    : Expression.Equal(propertyAccess, Expression.Constant(convertedValue, propertyAccess.Type));
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
                        var lambda = Expression.Lambda<Func<Transaction, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }

                // 3. Sorting
                if (!string.IsNullOrEmpty(orderBy))
                {
                    string prop = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();
                    query = orderBy.Contains("desc", StringComparison.OrdinalIgnoreCase)
                        ? query.OrderByDescending(x => EF.Property<object>(x, prop))
                        : query.OrderBy(x => EF.Property<object>(x, prop));
                }

                var totalElements = await query.CountAsync();

                // 4. Execution & Paging
                // Note: We include the structured addresses in the projection
                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new
                    {
                        u.Id,
                        u.TransactionId,
                        u.Amount,
                        u.Description,
                        u.Date,
                        u.Method,
                        u.Attachment,
                    })
                    .ToListAsync();

                // 5. Dynamic Selection (Optional)
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object?>();
                        foreach (var field in selectedFields)
                        {
                            var prop = item.GetType().GetProperty(field, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                            dict[field] = prop?.GetValue(item);
                        }
                        return dict;
                    });

                    return Ok(new { Data = projected, TotalElements = totalElements });
                }

                return Ok(new { Data = items, TotalElements = totalElements });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Search failed.", Details = ex.Message });
            }
        }
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromForm] CreateTransactionRequest request)
        {
            if (request == null) return BadRequest("Request data is missing.");

            try
            {
                string? filePath = null;
                if (request.Attachment != null)
                {
                    var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
                    if (!Directory.Exists(uploadDir))
                        Directory.CreateDirectory(uploadDir);

                    var fileName = Guid.NewGuid() + Path.GetExtension(request.Attachment.FileName);
                    var physicalPath = Path.Combine(uploadDir, fileName);

                    using var stream = new FileStream(physicalPath, FileMode.Create);
                    await request.Attachment.CopyToAsync(stream);

                    // store relative URL in DB
                    filePath = $"/uploads/{fileName}";
                }

                var transaction = new Transaction
                {
                    Id = Guid.NewGuid(),
                    TransactionId = GenerateTransactionId(),
                    Amount = request.Amount,
                    Date = DateTime.UtcNow,
                    Description = request.Description,
                    Method = request.Method,
                    Attachment = filePath, // store path in DB
                };

                _context.Transactions.Add(transaction);
                await _context.SaveChangesAsync();

                return Ok(transaction);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Database failure", Details = ex.Message });
            }
        }
        private string GenerateTransactionId()
        {
            return $"TXN-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        }
    }
    }
