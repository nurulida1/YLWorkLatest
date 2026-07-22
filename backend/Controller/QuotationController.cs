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
using System.Text;
using ClosedXML.Excel;
using System.Text.RegularExpressions;
using GemBox.Pdf;
using GemBox.Pdf.Html;
using DocumentFormat.OpenXml.Vml.Spreadsheet;

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
                        query = query.Include(include.Trim());
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
                                condition = Expression.Equal(propertyAccess, Expression.Constant(enumValue, propertyAccess.Type));
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr,
                                    Nullable.GetUnderlyingType(propertyAccess.Type) ?? propertyAccess.Type);

                                condition = Expression.Equal(propertyAccess,
                                    Expression.Constant(convertedValue, propertyAccess.Type));
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(orExpression, condition);
                        }

                        finalExpression = finalExpression == null
                            ? orExpression
                            : Expression.OrElse(finalExpression, orExpression);
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<Quotation, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }

                if (!string.IsNullOrEmpty(orderBy))
                {
                    bool desc = orderBy.EndsWith(" desc", StringComparison.OrdinalIgnoreCase);
                    var property = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();

                    query = desc
                        ? query.OrderByDescending(x => EF.Property<object>(x, property))
                        : query.OrderBy(x => EF.Property<object>(x, property));
                }

                var now = DateTimeHelper.Now();

                var expiredQuotes = query
                    .AsEnumerable()
                    .Where(q =>
                        q.Status != "Expired" &&
                        q.Status != "Accepted" &&
                        q.Status != "Cancelled" &&
                        q.DueDate.HasValue &&
                        q.DueDate.Value < now
                    )
                    .ToList();

                if (expiredQuotes.Any())
                {
                    foreach (var q in expiredQuotes)
                    {
                        q.Status = "Expired";

                        _context.QuotationStatusHistories.Add(new QuotationStatusHistory
                        {
                            Id = Guid.NewGuid(),
                            QuotationId = q.Id,
                            Status = "Expired",
                            ActionAt = now,
                            Remarks = "Quotation auto-expired based on due date."
                        });
                    }

                    _context.SaveChanges();
                }

                var totalElements = query.Count();

                var items = query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                if (!string.IsNullOrEmpty(select))
                {
                    var fields = select.Split(',').Select(f => f.Trim()).ToList();

                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object?>();

                        foreach (var field in fields)
                        {
                            var prop = item.GetType().GetProperty(field);
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

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(string? filter = null)
        {
            var query = _context.Quotations
                .Include(x => x.QuotationItems)
                .Include(x => x.QuotationStatusHistories)
                .Include(x => x.FromCompany).ThenInclude(x => x.BillingAddress)
                .Include(x => x.FromCompany).ThenInclude(x => x.DeliveryAddress)
                .Include(x => x.Client).ThenInclude(x => x.BillingAddress)
                .Include(x => x.Client).ThenInclude(x => x.DeliveryAddress)
                .Include(x => x.TermsAndConditions).ThenInclude(t => t.TermsAndCondition)
                .Include(x => x.QuotationOtherInformations)
                .Include(x => x.CreatedBy)
                .AsQueryable();

            if (string.IsNullOrWhiteSpace(filter))
                return BadRequest("Filter is required");

            var parts = filter.Split('=', 2);

            if (parts.Length != 2)
                return BadRequest("Invalid filter format");

            var key = parts[0];
            var value = parts[1];

            Quotation? data;

            if (key.Equals("Id", StringComparison.OrdinalIgnoreCase))
            {
                if (!Guid.TryParse(value, out Guid id))
                    return BadRequest("Invalid Id");

                data = await query.FirstOrDefaultAsync(x => x.Id == id);
            }
            else if (key.Equals("QuotationNo", StringComparison.OrdinalIgnoreCase))
            {
                data = await query.FirstOrDefaultAsync(x => x.QuotationNo == value);
            }
            else
            {
                return BadRequest("Unsupported filter type");
            }

            if (data == null)
                return NotFound();

            var now = DateTimeHelper.Now();

            if (data.DueDate.HasValue &&
                data.DueDate.Value < now &&
                data.Status != "Expired" &&
                data.Status != "Accepted" &&
                data.Status != "Cancelled")
            {
                data.Status = "Expired";

                _context.QuotationStatusHistories.Add(new QuotationStatusHistory
                {
                    Id = Guid.NewGuid(),
                    QuotationId = data.Id,
                    Status = "Expired",
                    ActionAt = now,
                    Remarks = "Quotation auto-expired based on due date."
                });

                await _context.SaveChangesAsync();
            }

            return Ok(data);
        }

        private QuotationItemDto MapToItemDto(QuotationItems item, IEnumerable<QuotationItems> allItems)
        {
            return new QuotationItemDto
            {
                Id = item.Id,
                RowType = item.RowType,
                ProductServiceId = item.ProductServiceId,
                Item = item.Item,
                Description = item.Description,
                Quantity = item.Quantity,
                Unit = item.Unit,
                UnitPrice = item.UnitPrice,
                Discount = item.Discount,
                TotalPrice = item.TotalPrice,
                SortOrder = item.SortOrder
            };
        }

        [HttpPost("Create")]
        public async Task<ActionResult<object>> Create([FromBody] CreateQuotationRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            try
            {
                var userId = Guid.Parse(userIdClaim);

                var quotationId = Guid.NewGuid();

                var quotation = new Quotation
                {
                    Id = quotationId,
                    QuotationNo = request.QuotationNo ?? await GenerateQuotationNo(),
                    QuotationDate = request.QuotationDate,
                    FromCompanyId = request.FromCompanyId,
                    ClientId = request.ClientId,
                    ProjectCode = request.ProjectCode,
                    Subject = request.Subject,
                    SubTotal = request.SubTotal,
                    Discount = request.Discount,
                    TaxAmount = request.TaxAmount,
                    TotalAmount = request.TotalAmount,
                    PaymentTerms = request.PaymentTerms,
                    Validity = request.Validity,
                    ValidityType = request.ValidityType,
                    DueDate = CalculateDueDate(request.QuotationDate, request.Validity, request.ValidityType),
                    Status = "Draft",
                    CreatedById = userId,
                    CreatedAt = DateTimeHelper.Now()
                };

                var items = new List<QuotationItems>();

                foreach (var x in request.QuotationItems ?? new())
                {
                    Guid? productId = x.ProductServiceId;

                    if (!productId.HasValue && !string.IsNullOrWhiteSpace(x.Item))
                    {
                        var existingProduct = await _context.ProductServices
                            .FirstOrDefaultAsync(p =>
                                p.ItemCode.ToLower() == x.Item.ToLower());

                        if (existingProduct != null)
                        {
                            productId = existingProduct.Id;
                        }
                        else
                        {
                            var newProduct = new ProductService
                            {
                                Id = Guid.NewGuid(),
                                ItemCode = x.Item,
                                Description = x.Description,
                                Unit = x.Unit,
                                Price = x.UnitPrice,
                                Type = x.RowType,
                            };

                            _context.ProductServices.Add(newProduct);
                            productId = newProduct.Id;
                        }
                    }

                    items.Add(new QuotationItems
                    {
                        Id = Guid.NewGuid(),
                        QuotationId = quotationId,
                        ProductServiceId = productId,
                        RowType = x.RowType,
                        Item = x.Item,
                        Description = x.Description,
                        Quantity = x.Quantity,
                        Unit = x.Unit,
                        UnitPrice = x.UnitPrice,
                        Discount = x.Discount,
                        TotalPrice = x.TotalPrice,
                        SortOrder = x.SortOrder
                    });
                }

                quotation.QuotationItems = items;

                _context.QuotationStatusHistories.Add(new QuotationStatusHistory
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotationId,
                    Status = "Draft",
                    ActionAt = DateTimeHelper.Now(),
                    ActionUserId = userId,
                    Remarks = "Quotation created"
                });

                _context.Quotations.Add(quotation);

                if (request.TermsAndConditions?.Any() == true)
                {
                    var quotationTerms = new List<QuotationTermsAndCondition>();

                    foreach (var x in request.TermsAndConditions.OrderBy(t => t.SortOrder))
                    {
                        Guid termId;

                        if (x.Id.HasValue)
                        {
                            termId = x.Id.Value;
                        }
                        else
                        {
                            if (string.IsNullOrWhiteSpace(x.Title))
                                continue;

                            var existingTerm = await _context.TermsAndConditions
                                .FirstOrDefaultAsync(t =>
                                    t.Title.Trim().ToLower() == x.Title.Trim().ToLower());

                            if (existingTerm != null)
                            {
                                termId = existingTerm.Id;
                            }
                            else
                            {
                                var newTerm = new TermsAndCondition
                                {
                                    Id = Guid.NewGuid(),
                                    Title = x.Title.Trim(),
                                    Description = x.Description ?? ""
                                };

                                _context.TermsAndConditions.Add(newTerm);
                                termId = newTerm.Id;
                            }
                        }

                        quotationTerms.Add(new QuotationTermsAndCondition
                        {
                            Id = Guid.NewGuid(),
                            QuotationId = quotationId,
                            TermsAndConditionId = termId,
                            SortOrder = x.SortOrder
                        });
                    }

                    _context.QuotationTermsAndConditions.AddRange(quotationTerms);
                }

                if (request.QuotationOtherInformations?.Any() == true)
                {
                    _context.QuotationOtherInformations.AddRange(
                        request.QuotationOtherInformations.Select((x, index) => new QuotationOtherInformation
                        {
                            Id = Guid.NewGuid(),
                            QuotationId = quotationId,
                            Key = x.Key,
                            Value = x.Value,
                            SortOrder = index + 1
                        })
                    );
                }

                await _context.SaveChangesAsync();

                var result = MapToDto(quotation);

                await _hub.Clients.All.SendAsync("QuotationAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to create.",
                    Details = ex.Message
                });
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
                    ProductServiceId = req.ProductServiceId,
                    RowType = req.RowType,
                    Item = req.Item,
                    Description = req.Description,
                    Quantity = req.Quantity,
                    Unit = req.Unit,
                    UnitPrice = req.UnitPrice,
                    Discount = req.Discount,
                    TotalPrice = req.TotalPrice,
                    SortOrder = req.SortOrder,
                    CreatedAt = DateTimeHelper.Now()
                };

                items.Add(newItem);
            }
            return items;
        }

        [HttpPut("Update")]
        public async Task<ActionResult> Update([FromBody] UpdateQuotationRequest request)
        {
            var quotation = await _context.Quotations
                .Include(q => q.QuotationItems)
                .Include(q => q.TermsAndConditions)
                .Include(q => q.QuotationOtherInformations)
                .FirstOrDefaultAsync(q => q.Id == request.Id);

            if (quotation == null)
                return NotFound();

            quotation.QuotationNo = request.QuotationNo;
            quotation.QuotationDate = request.QuotationDate;
            quotation.Subject = request.Subject;
            quotation.SubTotal = request.SubTotal;
            quotation.TaxAmount = request.TaxAmount;
            quotation.Discount = request.Discount;
            quotation.TotalAmount = request.TotalAmount;
            quotation.ClientId = request.ClientId;
            quotation.FromCompanyId = request.FromCompanyId;
            quotation.ProjectCode = request.ProjectCode;
            quotation.PaymentTerms = request.PaymentTerms;
            quotation.Validity = request.Validity;
            quotation.ValidityType = request.ValidityType;
            quotation.DueDate = CalculateDueDate(request.QuotationDate, request.Validity, request.ValidityType);
            quotation.UpdatedAt = DateTimeHelper.Now();

            var existingItems = _context.QuotationItems
                .Where(x => x.QuotationId == quotation.Id);

            _context.QuotationItems.RemoveRange(existingItems);

            var newItems = new List<QuotationItems>();

            foreach (var x in request.QuotationItems ?? new())
            {
                Guid? productId = x.ProductServiceId;

                if (!productId.HasValue && !string.IsNullOrWhiteSpace(x.Item))
                {
                    var itemName = x.Item.Trim();

                    var existingProduct = await _context.ProductServices
                        .FirstOrDefaultAsync(p => p.ItemCode == itemName);

                    if (existingProduct != null)
                    {
                        productId = existingProduct.Id;
                    }
                    else
                    {
                        var newProduct = new ProductService
                        {
                            Id = Guid.NewGuid(),
                            ItemCode = itemName,
                            Description = x.Description,
                            Unit = x.Unit,
                            Price = x.UnitPrice,
                            Type = x.RowType,
                        };

                        await _context.ProductServices.AddAsync(newProduct);
                        await _context.SaveChangesAsync(); 

                        productId = newProduct.Id;
                    }
                }
            

                newItems.Add(new QuotationItems
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotation.Id,
                    ProductServiceId = productId,
                    RowType = x.RowType,
                    Item = x.Item,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    UnitPrice = x.UnitPrice,
                    Discount = x.Discount,
                    TotalPrice = x.TotalPrice,
                    SortOrder = x.SortOrder
                });
            }

            _context.QuotationItems.AddRange(newItems);

            var existingTerms = _context.QuotationTermsAndConditions
                .Where(x => x.QuotationId == quotation.Id);

            _context.QuotationTermsAndConditions.RemoveRange(existingTerms);

            if (request.TermsAndConditions?.Any() == true)
            {
                var quotationTerms = new List<QuotationTermsAndCondition>();

                foreach (var x in request.TermsAndConditions.OrderBy(t => t.SortOrder))
                {
                    Guid termId;

                    if (x.Id.HasValue)
                        termId = x.Id.Value;
                    else
                    {
                        var existingTerm = await _context.TermsAndConditions
                            .FirstOrDefaultAsync(t =>
                                t.Title.Trim().ToLower() == x.Title.Trim().ToLower());

                        if (existingTerm != null)
                            termId = existingTerm.Id;
                        else
                        {
                            var newTerm = new TermsAndCondition
                            {
                                Id = Guid.NewGuid(),
                                Title = x.Title.Trim(),
                                Description = x.Description ?? ""
                            };

                            _context.TermsAndConditions.Add(newTerm);
                            termId = newTerm.Id;
                        }
                    }

                    quotationTerms.Add(new QuotationTermsAndCondition
                    {
                        Id = Guid.NewGuid(),
                        QuotationId = quotation.Id,
                        TermsAndConditionId = termId,
                        SortOrder = x.SortOrder
                    });
                }

                _context.QuotationTermsAndConditions.AddRange(quotationTerms);
            }

            var existingInfos = _context.QuotationOtherInformations
                .Where(x => x.QuotationId == quotation.Id);

            _context.QuotationOtherInformations.RemoveRange(existingInfos);

            if (request.QuotationOtherInformations?.Any() == true)
            {
                _context.QuotationOtherInformations.AddRange(
                    request.QuotationOtherInformations.Select((x, index) => new QuotationOtherInformation
                    {
                        Id = Guid.NewGuid(),
                        QuotationId = quotation.Id,
                        Key = x.Key,
                        Value = x.Value,
                        SortOrder = index + 1
                    })
                );
            }

            await _context.SaveChangesAsync();

            var updatedQuotation = await _context.Quotations
                .Include(q => q.QuotationItems)
                .Include(q => q.TermsAndConditions)
                    .ThenInclude(t => t.TermsAndCondition)
                .Include(q => q.QuotationOtherInformations)
                .FirstOrDefaultAsync(q => q.Id == quotation.Id);

            return Ok(MapToDto(updatedQuotation));
        }

        private object MapToDto(Quotation q)
        {
            return new
            {
                q.Id,
                q.QuotationNo,
                q.QuotationDate,
                q.ClientId,
                q.FromCompanyId,
                FromCompany = MapCompany(q.FromCompany),
                Client = MapCompany(q.Client),
                q.ProjectCode,
                q.Subject,
                q.SubTotal,
                q.TaxAmount,
                q.Discount,
                q.TotalAmount,
                q.PaymentTerms,
                q.Validity,
                q.ValidityType,
                q.Status,
                q.Remarks,
                TermsAndConditions = q.TermsAndConditions?
    .Where(t => t.TermsAndCondition != null)
    .OrderBy(t => t.SortOrder)
    .Select(t => new
    {
        t.TermsAndCondition.Id,
        t.TermsAndCondition.Title,
        t.TermsAndCondition.Description,
        t.SortOrder
    })
    .ToList(),

                QuotationOtherInformations = q.QuotationOtherInformations?
    .OrderBy(x => x.SortOrder)
    .Select(o => new
    {
        o.Id,
        o.Key,
        o.Value,
        o.SortOrder
    })
    .ToList(),

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
                item.RowType,
                item.Item,
                item.Description,
                item.Quantity,
                item.Unit,
                item.UnitPrice,
                item.Discount,
                item.TotalPrice,
                item.SortOrder
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
                    QuotationDate = DateTimeHelper.Now(),
                    FromCompanyId = source.FromCompanyId,
                    ClientId = source.ClientId,
                    Subject = source.Subject,
                    ProjectCode = source.ProjectCode,
                    Status = "Draft",
                    SubTotal = source.SubTotal,
                    TaxAmount = source.TaxAmount,
                    Discount = source.Discount,
                    TotalAmount = source.TotalAmount,
                    PaymentTerms = source.PaymentTerms,
                    Validity = source.Validity,
                    ValidityType = source.ValidityType,
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
                        RowType = oldItem.RowType,
                        Item = oldItem.Item,
                        Description = oldItem.Description,
                        Quantity = oldItem.Quantity,
                        Unit = oldItem.Unit,
                        UnitPrice = oldItem.UnitPrice,
                        Discount = oldItem.Discount,
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

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteQuotation([FromQuery] Guid id)
        {
            var quote = await _context.Quotations.FindAsync(id);
            if (quote == null)
                return NotFound(new { Error = "Quotation not found." });

            try
            {
                var items = await _context.QuotationItems
    .Where(x => x.QuotationId == id)
    .ToListAsync();

                _context.QuotationItems.RemoveRange(items);
                _context.Quotations.Remove(quote);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("QuotationDeleted", id);

                return Ok(new { Message = "Quotation deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete quotation." });
            }
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

        [HttpPost("ConvertFromQuotation/{quotationId}")]
        public async Task<IActionResult> ConvertFromQuotation(Guid quotationId, [FromForm] ConvertQuotationToSoRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var actionUserId = Guid.Parse(userIdClaim);

            var quotation = await _context.Quotations
                .Include(q => q.QuotationItems)
                .FirstOrDefaultAsync(q => q.Id == quotationId);

            if (quotation == null)
                return NotFound(new { Error = "Source quotation not found." });

            try
            {
                string? attachmentPath = null;
                if (request.ClientPOAttachment != null && request.ClientPOAttachment.Length > 0)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "ClientPOs");
                    if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                    var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(request.ClientPOAttachment.FileName)}";
                    attachmentPath = Path.Combine("Uploads", "ClientPOs", uniqueFileName);

                    using (var fileStream = new FileStream(Path.Combine(Directory.GetCurrentDirectory(), attachmentPath), FileMode.Create))
                    {
                        await request.ClientPOAttachment.CopyToAsync(fileStream);
                    }
                }

                var salesOrder = new SalesOrder
                {
                    Id = Guid.NewGuid(),
                    SalesOrderNo = await GenerateSalesOrderNo(),
                    QuotationId = quotation.Id,
                    ClientId = quotation.ClientId,
                    CompanyId = quotation.FromCompanyId,
                    SODate = DateTimeHelper.Now(),
                    Status = "Draft",
                    SubTotal = quotation.SubTotal,
                    Discount = quotation.Discount,
                    TaxAmount = quotation.TaxAmount,
                    TotalAmount = quotation.TotalAmount.GetValueOrDefault(),
                    Notes = $"Converted from Quotation {quotation.QuotationNo}.",
                    Remarks = request.Remarks,
                    PaymentTerms = quotation.PaymentTerms,

                    ClientPONumber = request.ClientPONumber,
                    ClientPODate = request.ClientPODate,
                    ClientPOAttachment = attachmentPath,

                    CreatedAt = DateTimeHelper.Now(),
                    CreatedById = actionUserId
                };

                var oldRootItems = quotation.QuotationItems
                    .OrderBy(i => i.SortOrder)
                    .ToList();

                salesOrder.SalesOrderItems = ProcessConvertedItems(oldRootItems, quotation.QuotationItems, salesOrder.Id, null);

                var statusHistory = new SalesOrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    SalesOrderId = salesOrder.Id,
                    Status = "Draft",
                    ActionAt = DateTimeHelper.Now(),
                    ActionUserId = actionUserId,
                    Remarks = $"Sales Order generated and matched from Quotation {quotation.QuotationNo} via Client PO."
                };

                quotation.Status = "Accepted";
                quotation.Remarks = $"Converted into Sales Order {salesOrder.SalesOrderNo}";

                var quotationHistory = new QuotationStatusHistory
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotation.Id,
                    Status = "Accepted",
                    ActionAt = DateTimeHelper.Now(),
                    ActionUserId = actionUserId,
                    Remarks = $"System auto-accepted upon successful conversion to Sales Order {salesOrder.SalesOrderNo}."
                };
                _context.QuotationStatusHistories.Add(quotationHistory);

                _context.SalesOrders.Add(salesOrder);
                _context.SalesOrderStatusHistories.Add(statusHistory);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("SalesOrderAdded", new { salesOrder.Id, salesOrder.SalesOrderNo, salesOrder.Status });
                await _hub.Clients.All.SendAsync("QuotationUpdated", new { Id = quotation.Id, Status = quotation.Status, Remarks = quotation.Remarks });

                return Ok(new { Message = "Quotation successfully converted to Sales Order.", SalesOrderId = salesOrder.Id, SalesOrderNo = salesOrder.SalesOrderNo });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Conversion processing failed.", Details = ex.Message });
            }
        }

        private List<SalesOrderItem> ProcessConvertedItems(
     IEnumerable<QuotationItems> currentLevelItems,
     IEnumerable<QuotationItems> allSourceItems,
     Guid salesOrderId,
     Guid? parentId)
        {
            var convertedList = new List<SalesOrderItem>();

            foreach (var qItem in currentLevelItems)
            {
                var soItemId = Guid.NewGuid();

                var qty = qItem.Quantity ?? 0m;

                var newSoItem = new SalesOrderItem
                {
                    Id = soItemId,
                    SalesOrderId = salesOrderId,
                    ProductServiceId = qItem.ProductServiceId,
                    RowType = qItem.RowType,
                    Item = qItem.Item,
                    Description = qItem.Description,
                    Quantity = qItem.Quantity,
                    Unit = qItem.Unit,
                    UnitPrice = qItem.UnitPrice,
                    Discount = qItem.Discount,
                    TaxRate = 0,
                    TotalPrice = qItem.TotalPrice,

                    SortOrder = qItem.SortOrder,

                    QuantityDelivered = 0m

                };

                convertedList.Add(newSoItem);
            }

            return convertedList;
        }

        private async Task<string> GenerateSalesOrderNo()
        {
            var yearShort = DateTime.UtcNow.Year % 100;

            var lastSO = await _context.SalesOrders
                .Where(so => so.SalesOrderNo.Contains("YL/SO/") && so.SalesOrderNo.EndsWith($"/{yearShort}"))
                .OrderByDescending(so => so.CreatedAt)
                .Select(so => so.SalesOrderNo)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (!string.IsNullOrEmpty(lastSO))
            {
                var parts = lastSO.Split('/');
                if (parts.Length >= 3 && int.TryParse(parts[2], out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"YL/SO/{nextNumber}/{yearShort}";
        }

        [HttpGet("ExportExcel")]
        public async Task<IActionResult> ExportExcel()
        {
            var data = await _context.Quotations
                .Include(q => q.Client)
                .ToListAsync();

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("Quotations");

            // HEADER
            ws.Cell(1, 1).Value = "QuotationNo";
            ws.Cell(1, 2).Value = "QuotationDate";
            ws.Cell(1, 3).Value = "Client";
            ws.Cell(1, 4).Value = "SubTotal";
            ws.Cell(1, 5).Value = "Discount";
            ws.Cell(1, 6).Value = "TotalAmount";
            ws.Cell(1, 7).Value = "Status";

            var headerRange = ws.Range(1, 1, 1, 7);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

            int row = 2;

            foreach (var q in data)
            {
                ws.Cell(row, 1).Value = q.QuotationNo;
                ws.Cell(row, 2).Value = q.QuotationDate.ToString("yyyy-MM-dd");
                ws.Cell(row, 3).Value = q.Client?.Name;
                ws.Cell(row, 4).Value = q.SubTotal ?? 0;
                ws.Cell(row, 5).Value = q.Discount ?? 0;
                ws.Cell(row, 6).Value = q.TotalAmount ?? 0;
                ws.Cell(row, 7).Value = q.Status;

                row++;
            }

            ws.Columns().AdjustToContents();

            var stream = new MemoryStream();

            wb.SaveAs(stream);
            stream.Position = 0;

            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Quotations_{DateTime.Now:yyyyMMddHHmmss}.xlsx");
        }


        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetQuoteDropdown(CancellationToken cancellationToken)
        {
            try
            {
                var companies = await _context.Companies
                    .AsNoTracking()
                    .Where(x => x.Type == CompanyType.Own || x.Type == CompanyType.Client)
                    .OrderByDescending(x => x.Name)
                    .Select(x => new
                    {
                        x.Id,
                        x.Name,
                        x.Type,
                        x.BillingAddress,
                        x.DeliveryAddress
                    })
                    .ToListAsync(cancellationToken);

                var ownCompanies = companies
                    .Where(x => x.Type == CompanyType.Own)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name,
                        BillingAddress = x.BillingAddress,
                        DeliveryAddress = x.DeliveryAddress
                    })
                    .ToList();

                var clients = companies
                    .Where(x => x.Type == CompanyType.Client)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name,
                        BillingAddress = x.BillingAddress,
                        DeliveryAddress = x.DeliveryAddress
                    })
                    .ToList();

                var terms = await _context.TermsAndConditions
                    .AsNoTracking()
                    .OrderByDescending(x => x.Title)
                    .Select(x => new TermsAndConditionOrderDto
                    {
                        Id = x.Id,
                        Title = x.Title
                    })
                    .ToListAsync(cancellationToken);

                var inventories = await _context.Inventories
                    .AsNoTracking()
                    .OrderBy(x => x.ItemName)
                    .Select(x => new Inventory
                    {
                        Id = x.Id,
                        ItemCode = x.ItemCode,
                        ItemName = x.ItemName
                    })
                    .ToListAsync(cancellationToken);

                var productServices = await _context.ProductServices
                    .AsNoTracking()
                    .OrderBy(x => x.Type)
                    .ThenBy(x => x.ItemCode)
                    .Select(x => new ProductService
                    {
                        Id = x.Id,
                        ItemCode = x.ItemCode,
                        Description = x.Description,
                        Type = x.Type
                    })
                    .ToListAsync(cancellationToken);

                return Ok(new
                {
                    Companies = ownCompanies,
                    Clients = clients,
                    TermsAndConditions = terms,
                    Inventories = inventories,
                    ProductAndServices = productServices
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load dropdown",
                    Details = ex.Message
                });
            }
        }

        private DateTime? CalculateDueDate(DateTime date, int? validity, string? validityType)
        {
            if (!validity.HasValue || validity <= 0 || string.IsNullOrWhiteSpace(validityType))
                return null;

            return validityType.ToLower() switch
            {
                "day" or "days" => date.AddDays(validity.Value),
                "month" or "months" => date.AddMonths(validity.Value),
                "year" or "years" => date.AddYears(validity.Value),
                _ => null
            };
        }

    }
}