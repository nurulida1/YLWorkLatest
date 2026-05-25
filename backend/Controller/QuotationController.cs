using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;

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
                var query = _context.Quotations.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

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
                        var lambda = Expression.Lambda<Func<Quotation, bool>>(finalExpression, parameter);
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
        public async Task<IActionResult> GetOne(string? filter = null)
        {
            var query = _context.Quotations
                .Include(x => x.QuotationItems)
                .AsQueryable();

            var filterValue = filter?.Split('=')[1];

            if (!Guid.TryParse(filterValue, out Guid id))
                return BadRequest("Invalid Id");

            var data = await query
    .Where(x => x.Id == id)
    .Select(x => new
    {
        x.Id,
        x.QuotationNo,
        x.QuotationDate,
        x.FromCompanyId,
        x.ClientId,
        x.TotalAmount,
        x.TermsAndConditions,
        x.Subject,
        x.QuotationItems
    })
    .FirstOrDefaultAsync();

            if (data == null) return NotFound();

            return Ok(data);
        }

        private QuotationItemDto MapToItemDto(QuotationItems item, IEnumerable<QuotationItems> allItems)
        {
            return new QuotationItemDto
            {
                Id = item.Id,
                Type = item.Type,
                IsGroup = item.IsGroup,
                Description = item.Description,
                Quantity = item.Quantity,
                Unit = item.Unit,
                UnitPrice = item.UnitPrice,
                TotalPrice = item.TotalPrice,
                SortOrder = item.SortOrder,
                Children = allItems
                    .Where(child => child.ParentId == item.Id)
                    .OrderBy(child => child.SortOrder)
                    .Select(child => MapToItemDto(child, allItems))
                    .ToList()
            };
        }

        [HttpPost("Create")]
        public async Task<ActionResult<object>> Create([FromBody] CreateQuotationRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });

            try
            {
                var quotation = new Quotation
                {
                    Id = Guid.NewGuid(),
                    QuotationNo = request.QuotationNo ?? await GenerateQuotationNo(),
                    ReferenceNo = request.ReferenceNo,
                    QuotationDate = request.QuotationDate,
                    FromCompanyId = request.FromCompanyId,
                    ClientId = request.ClientId,
                    ProjectCode = request.ProjectCode,
                    Subject = request.Subject,
                    TotalAmount = request.TotalAmount,
                    TermsAndConditions = request.TermsAndConditions,
                    Status = "Draft",
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTimeHelper.Now()
                };

                quotation.QuotationItems = ProcessRequestItems(request.QuotationItems, quotation.Id, null);

                var statusHistory = new QuotationStatusHistory
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotation.Id,
                    Status = "Draft",
                    ActionAt = DateTimeHelper.Now(),
                    ActionUserId = Guid.Parse(userIdClaim),
                    Remarks = "Quotation created",
                };

                _context.Quotations.Add(quotation);
                _context.QuotationStatusHistories.Add(statusHistory);

                await _context.SaveChangesAsync();

                var result = MapToDto(quotation); 
                await _hub.Clients.All.SendAsync("QuotationAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to create.", Details = ex.Message });
            }
        }

        private List<QuotationItems> ProcessRequestItems(List<QuotationItemRequest> requests, Guid quotationId, Guid? parentId)
        {
            var items = new List<QuotationItems>();
            foreach (var req in requests ?? new())
            {
                var itemId = Guid.NewGuid();
                var newItem = new QuotationItems
                {
                    Id = itemId,
                    QuotationId = quotationId,
                    ParentId = parentId,
                    IsGroup = req.IsGroup,
                    Type = req.Type,
                    Description = req.Description,
                    Quantity = req.Quantity,
                    Unit = req.Unit ?? "Nos",
                    UnitPrice = req.UnitPrice,
                    TotalPrice = req.TotalPrice,
                    SortOrder = req.SortOrder,
                    CreatedAt = DateTimeHelper.Now()
                };

                if (req.Children?.Any() == true)
                {
                    newItem.Children = ProcessRequestItems(req.Children, quotationId, itemId);
                }

                items.Add(newItem);
            }
            return items;
        }

        [HttpPut("Update")]
        public async Task<ActionResult> Update([FromBody] UpdateQuotationRequest request)
        {
            var quotation = await _context.Quotations
                .Include(q => q.QuotationItems)
                .FirstOrDefaultAsync(q => q.Id == request.Id);

            if (quotation == null)
                return NotFound();

            quotation.QuotationNo = request.QuotationNo;
            quotation.QuotationDate = request.QuotationDate;
            quotation.Subject = request.Subject;
            quotation.TotalAmount = request.TotalAmount;
            quotation.ClientId = request.ClientId;
            quotation.FromCompanyId = request.FromCompanyId;
            quotation.UpdatedAt = DateTimeHelper.Now();

            var existingItems = _context.QuotationItems
                .Where(x => x.QuotationId == quotation.Id);

            _context.QuotationItems.RemoveRange(existingItems);

            await _context.SaveChangesAsync();

            var newItems = ProcessRequestItems(
                request.QuotationItems?
                    .Select(x => new QuotationItemRequest
                    {
                        Id = x.Id,
                        IsGroup = x.IsGroup,
                        Type = x.Type,
                        Description = x.Description,
                        Quantity = x.Quantity,
                        Unit = x.Unit,
                        UnitPrice = x.UnitPrice,
                        TotalPrice = x.TotalPrice,
                        SortOrder = x.SortOrder,
                        ParentId = x.ParentId,
                        Children = x.Children
                    })
                    .ToList() ?? new List<QuotationItemRequest>(),
                quotation.Id,
                null
            );

            _context.QuotationItems.AddRange(newItems);

            await _context.SaveChangesAsync();

            return Ok(MapToDto(quotation));
        }

        private object MapToDto(Quotation q)
        {
            return new
            {
                q.Id,
                q.QuotationNo,
                q.ReferenceNo,
                q.QuotationDate,
                q.ClientId,
                q.FromCompanyId,
                FromCompany = MapCompany(q.FromCompany),
                Client = MapCompany(q.Client),
                q.ProjectCode,
                q.Subject,
                q.TotalAmount,
                q.TermsAndConditions,
                q.Status,
                q.Remarks,
                QuotationStatusHistories = q.QuotationStatusHistories.OrderByDescending(h => h.ActionAt).Select(i => new
                {
                    i.Id,
                    i.Status,
                    i.ActionAt,
                    i.ActionUserId,
                    i.Remarks,
                    i.SignatureImage
                }),
                QuotationItems = q.QuotationItems
                    .Where(i => i.ParentId == null || i.ParentId == Guid.Empty)
                    .OrderBy(i => i.SortOrder)
                    .Select(i => MapItemRecursive(i, q.QuotationItems))
                    .ToList()
            };
        }

        private object MapItemRecursive(QuotationItems item, IEnumerable<QuotationItems> allItems)
        {
            return new
            {
                item.Id,
                item.Type, 
                item.IsGroup,
                item.Description,
                item.Quantity,
                item.Unit,
                item.UnitPrice,
                item.TotalPrice,
                item.SortOrder,
                Children = allItems
                    .Where(c => c.ParentId == item.Id)
                    .OrderBy(c => c.SortOrder)
                    .Select(c => MapItemRecursive(c, allItems))
                    .ToList()
            };
        }

        private object? MapCompany(Company? c)
        {
            if (c == null) return null;
            return new
            {
                c.Id,
                c.Name,
                c.ContactNo,
                c.Email,
                c.ContactPerson1,
                c.FaxNo,
                BillingAddress = MapAddress(c.BillingAddress),
                DeliveryAddress = MapAddress(c.DeliveryAddress)
            };
        }

        private object? MapAddress(Address? a)
        {
            if (a == null) return null;
            return new { a.Id, a.AddressLine1, a.AddressLine2, a.City, a.State, a.Country, a.Poscode };
        }

        [HttpPost("Clone/{id}")]
        public async Task<IActionResult> Clone(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            var source = await _context.Quotations
                .Include(q => q.QuotationItems)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (source == null) return NotFound("Source quotation not found.");

            try
            {
                string newQuotationNo = await GenerateQuotationNo();

                var clonedQuotation = new Quotation
                {
                    Id = Guid.NewGuid(),
                    QuotationNo = newQuotationNo,
                    ReferenceNo = source.ReferenceNo,
                    QuotationDate = DateTimeHelper.Now(),
                    FromCompanyId = source.FromCompanyId,
                    ClientId = source.ClientId,
                    Subject = source.Subject,
                    ProjectCode = source.ProjectCode,
                    Status = "Draft",
                    TotalAmount = source.TotalAmount,
                    TermsAndConditions = source.TermsAndConditions,
                    Remarks = $"Cloned from {source.QuotationNo}",
                    CreatedAt = DateTimeHelper.Now()
                };

                var idMap = new Dictionary<Guid, Guid>();
                var newItems = new List<QuotationItems>();

                foreach (var oldItem in source.QuotationItems)
                {
                    idMap[oldItem.Id] = Guid.NewGuid();
                }

                foreach (var oldItem in source.QuotationItems)
                {
                    var newItem = new QuotationItems
                    {
                        Id = idMap[oldItem.Id],
                        QuotationId = clonedQuotation.Id,
                        ParentId = oldItem.ParentId.HasValue && idMap.ContainsKey(oldItem.ParentId.Value)
                                   ? idMap[oldItem.ParentId.Value]
                                   : null,
                        Type = oldItem.Type,
                        IsGroup = oldItem.IsGroup,
                        Description = oldItem.Description,
                        Quantity = oldItem.Quantity,
                        Unit = oldItem.Unit,
                        UnitPrice = oldItem.UnitPrice,
                        TotalPrice = oldItem.TotalPrice,
                        SortOrder = oldItem.SortOrder,
                        CreatedAt = DateTimeHelper.Now()
                    };
                    newItems.Add(newItem);
                }

                clonedQuotation.QuotationItems = newItems;

                var statusHistory = new QuotationStatusHistory
                {
                    Id = Guid.NewGuid(),
                    QuotationId = clonedQuotation.Id,
                    Status = "Draft",
                    ActionAt = DateTimeHelper.Now(),
                    ActionUserId = Guid.Parse(userIdClaim),
                    Remarks = "Quotation cloned",
                };

                _context.Quotations.Add(clonedQuotation);
                _context.QuotationStatusHistories.Add(statusHistory);

                await _context.SaveChangesAsync();

                var result = MapToDto(clonedQuotation);
                await _hub.Clients.All.SendAsync("QuotationAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Cloning failed", Details = ex.Message });
            }
        }
        
        private async Task<string> GenerateQuotationNo()
        {
            var yearShort = DateTime.UtcNow.Year % 100; // 2026 -> 26

            var lastQuote = await _context.Quotations
                .Where(q => q.QuotationNo.Contains($"YL/Q/") && q.QuotationNo.EndsWith($"/{yearShort}"))
                .OrderByDescending(q => q.CreatedAt)
                .Select(q => q.QuotationNo)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (!string.IsNullOrEmpty(lastQuote))
            {
                var parts = lastQuote.Split('/');
                if (parts.Length >= 3 && int.TryParse(parts[2], out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"YL/Q/{nextNumber}/{yearShort}";
        }

        [HttpGet("generate-no")]
        public async Task<IActionResult> GenerateQuotationNoEndpoint()
        {
            var quotationNo = await GenerateQuotationNo();
            return Ok(new { quotationNo });
        
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

            var quotation = await _context.Quotations
                .FirstOrDefaultAsync(x => x.Id == id);

            if (quotation == null)
                return NotFound();

            quotation.Status = status;

            var history = new QuotationStatusHistory
            {
                Id = Guid.NewGuid(),
                QuotationId = id,
                Status = quotation.Status,
                ActionUserId = actionUserId,
                ActionAt = DateTimeHelper.Now(),
                Remarks = GenerateStatusRemark(
                    quotation.Status,
                    userName ?? "System"
                )
            };

            _context.QuotationStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            var result = await _context.QuotationStatusHistories
                .Where(x => x.Id == history.Id)
                .Include(x => x.ActionUser)
                .Select(x => new
                {
                    x.Id,
                    x.Status,
                    x.ActionAt,
                    x.Remarks,
                    ActionUser = x.ActionUser == null ? null : new
                    {
                        x.ActionUser.Id,
                        x.ActionUser.FullName,
                        x.ActionUser.DisplayName
                    }
                })
                .FirstOrDefaultAsync();

            return Ok(result);
        }

        private string GenerateStatusRemark(string status, string userName)
        {
            return status switch
            {
                "Reviewed" => $"Quotation reviewed by {userName}",
                "Approved" => $"Quotation approved by {userName}",
                "Rejected" => $"Quotation rejected by {userName}",
                "Sent" => $"Quotation sent by {userName}",
                "Accepted" => $"Quotation accepted by {userName}",
                "Cancelled" => $"Quotation cancelled by {userName}",
                _ => $"Quotation updated to {status} by {userName}"
            };
        }
    }
}