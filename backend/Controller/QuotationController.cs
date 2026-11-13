
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;
using ClosedXML.Excel;

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

        private static readonly string[] ValidStatuses =
        {
            "Draft",
            "Reviewed",
            "Approved",
            "Rejected",
            "Sent",
            "Accepted",
            "Cancelled",
            "Expired"
        };

        public QuotationController(
            AppDbContext context,
            IHubContext<NotificationHub> hub,
            IWebHostEnvironment env)
        {
            _context = context;
            _hub = hub;
            _env = env;
        }

        // =========================================================
        // HELPERS
        // =========================================================

        private Guid? CurrentUserId
        {
            get
            {
                var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                return Guid.TryParse(value, out var id)
                    ? id
                    : null;
            }
        }

        private static DateTime Now()
        {
            return DateTimeHelper.Now();
        }

        private static bool IsFinalStatus(string? status)
        {
            return status is "Accepted" or "Cancelled" or "Expired";
        }

        private static DateTime? CalculateDueDate(
            DateTime date,
            int? validity,
            string? validityType)
        {
            if (!validity.HasValue ||
                validity.Value <= 0 ||
                string.IsNullOrWhiteSpace(validityType))
            {
                return null;
            }

            return validityType.Trim().ToLowerInvariant() switch
            {
                "day" or "days" => date.AddDays(validity.Value),
                "month" or "months" => date.AddMonths(validity.Value),
                "year" or "years" => date.AddYears(validity.Value),
                _ => null
            };
        }

        private static string GenerateStatusRemark(
            string status,
            string userName)
        {
            return status switch
            {
                "Reviewed" => $"Quotation reviewed by {userName}",
                "Approved" => $"Quotation approved by {userName}",
                "Rejected" => $"Quotation rejected by {userName}",
                "Sent" => $"Quotation sent by {userName}",
                "Accepted" => $"Quotation accepted by {userName}",
                "Cancelled" => $"Quotation cancelled by {userName}",
                "Expired" => "Quotation automatically expired.",
                _ => $"Quotation updated to {status} by {userName}"
            };
        }

        private async Task AddStatusHistory(
            Guid quotationId,
            string status,
            Guid? userId,
            string remarks)
        {
            _context.QuotationStatusHistories.Add(
                new QuotationStatusHistory
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotationId,
                    Status = status,
                    ActionAt = Now(),
                    ActionUserId = userId,
                    Remarks = remarks
                });

            await Task.CompletedTask;
        }

        private async Task ExpireQuotationIfRequired(
     Quotation quotation,
     CancellationToken cancellationToken = default)
        {
            if (quotation.Status is "Draft"
                or "Approved"
                or "Accepted"
                or "Cancelled"
                or "Expired")
            {
                return;
            }

            if (!quotation.DueDate.HasValue ||
                quotation.DueDate.Value >= Now())
            {
                return;
            }

            quotation.Status = "Expired";

            await AddStatusHistory(
                quotation.Id,
                "Expired",
                null,
                "Quotation automatically expired based on due date.");

            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task<string> GenerateQuotationNo()
        {
            var year = Now().Year % 100;
            var suffix = $"/{year:D2}";

            var numbers = await _context.Quotations
                .AsNoTracking()
                .Where(x => x.QuotationNo.StartsWith("YL/Q/") &&
                            x.QuotationNo.EndsWith(suffix))
                .Select(x => x.QuotationNo)
                .ToListAsync();

            var maxNumber = numbers
                .Select(x =>
                {
                    var parts = x.Split('/');

                    return parts.Length == 4 &&
                           int.TryParse(parts[2], out var number)
                        ? number
                        : 0;
                })
                .DefaultIfEmpty(0)
                .Max();

            return $"YL/Q/{maxNumber + 1}/{year:D2}";
        }

        private async Task<string> GenerateSalesOrderNo()
        {
            var year = Now().Year % 100;
            var suffix = $"/{year:D2}";

            var numbers = await _context.SalesOrders
                .AsNoTracking()
                .Where(x => x.SalesOrderNo.StartsWith("YL/SO/") &&
                            x.SalesOrderNo.EndsWith(suffix))
                .Select(x => x.SalesOrderNo)
                .ToListAsync();

            var maxNumber = numbers
                .Select(x =>
                {
                    var parts = x.Split('/');

                    return parts.Length == 4 &&
                           int.TryParse(parts[2], out var number)
                        ? number
                        : 0;
                })
                .DefaultIfEmpty(0)
                .Max();

            return $"YL/SO/{maxNumber + 1}/{year:D2}";
        }

        private async Task<Guid?> FindOrCreateProductService(
            QuotationItemBase item,
            CancellationToken cancellationToken = default)
        {
            if (item.ProductServiceId.HasValue)
            {
                var exists = await _context.ProductServices
                    .AnyAsync(
                        x => x.Id == item.ProductServiceId.Value,
                        cancellationToken);

                if (!exists)
                {
                    throw new InvalidOperationException(
                        $"Product/service '{item.ProductServiceId}' was not found.");
                }

                return item.ProductServiceId;
            }

            if (string.IsNullOrWhiteSpace(item.Item))
                return null;

            var itemCode = item.Item.Trim();

            var existing = await _context.ProductServices
                .FirstOrDefaultAsync(
                    x => x.ItemCode.ToLower() == itemCode.ToLower(),
                    cancellationToken);

            if (existing != null)
                return existing.Id;

            var product = new ProductService
            {
                Id = Guid.NewGuid(),
                ItemCode = itemCode,
                Description = item.Description,
                Unit = item.Unit,
                Price = item.UnitPrice,
                Type = item.RowType
            };

            _context.ProductServices.Add(product);

            return product.Id;
        }

        private async Task<List<QuotationItems>> BuildQuotationItems(
            IEnumerable<QuotationItemBase>? requests,
            Guid quotationId,
            CancellationToken cancellationToken = default)
        {
            var result = new List<QuotationItems>();

            foreach (var item in requests ?? Enumerable.Empty<QuotationItemBase>())
            {
                var productId = await FindOrCreateProductService(
                    item,
                    cancellationToken);

                result.Add(new QuotationItems
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotationId,
                    ProductServiceId = productId,
                    RowType = item.RowType,
                    Item = item.Item,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    Unit = item.Unit,
                    UnitPrice = item.UnitPrice,
                    Discount = item.Discount,
                    TotalPrice = item.TotalPrice,
                    SortOrder = item.SortOrder,
                    CreatedAt = Now()
                });
            }

            return result;
        }

        private async Task<List<QuotationTermsAndCondition>> BuildQuotationTerms(
    List<TermsAndConditionOrderDto>? requestTerms,
    Guid quotationId,
    CancellationToken cancellationToken)
        {
            var result = new List<QuotationTermsAndCondition>();

            if (requestTerms == null || requestTerms.Count == 0)
                return result;

            var termIds = requestTerms
                .Where(x => x.Id != Guid.Empty)
                .Select(x => x.Id)
                .Distinct()
                .ToList();

            var existingTerms = await _context.TermsAndConditions
                .Where(x => termIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, cancellationToken);

            foreach (var term in requestTerms.OrderBy(x => x.SortOrder))
            {
                if (!term.Id.HasValue ||
    term.Id.Value == Guid.Empty ||
    !existingTerms.TryGetValue(term.Id.Value, out var existingTerm))
                {
                    throw new InvalidOperationException(
                        $"Terms and Conditions record not found: {term.Id}");
                }

                result.Add(new QuotationTermsAndCondition
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotationId,
                    TermsAndConditionId = existingTerm.Id,
                    SortOrder = term.SortOrder
                });
            }

            return result;
        }

        private List<QuotationOtherInformation> BuildOtherInformation(
            IEnumerable<QuotationOtherInfoRequest>? requests,
            Guid quotationId)
        {
            return (requests ?? Enumerable.Empty<QuotationOtherInfoRequest>())
                .Select((item, index) => new QuotationOtherInformation
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotationId,
                    Key = item.Key,
                    Value = item.Value,
                    SortOrder = index + 1
                })
                .ToList();
        }

        private async Task<Quotation?> LoadQuotation(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            return await _context.Quotations
                .Include(x => x.QuotationItems)
                .Include(x => x.QuotationStatusHistories)
                    .ThenInclude(x => x.ActionUser)
                .Include(x => x.FromCompany)
                    .ThenInclude(x => x.BillingAddress)
                .Include(x => x.FromCompany)
                    .ThenInclude(x => x.DeliveryAddress)
                .Include(x => x.Client)
                    .ThenInclude(x => x.BillingAddress)
                .Include(x => x.Client)
                    .ThenInclude(x => x.DeliveryAddress)
                .Include(x => x.TermsAndConditions)
                    .ThenInclude(x => x.TermsAndCondition)
                .Include(x => x.QuotationOtherInformations)
                .Include(x => x.CreatedBy)
                .Include(x => x.Documents)
                .FirstOrDefaultAsync(
                    x => x.Id == id,
                    cancellationToken);
        }

        // =========================================================
        // DTO MAPPING
        // =========================================================

        private object MapToDto(Quotation q)
        {
            return new
            {
                q.Id,
                q.QuotationNo,
                q.QuotationDate,
                q.DueDate,

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

                q.CreatedById,
                CreatedBy = q.CreatedBy == null
                    ? null
                    : new
                    {
                        q.CreatedBy.Id,
                        q.CreatedBy.FullName,
                        q.CreatedBy.DisplayName
                    },

                q.CreatedAt,
                q.UpdatedAt,

                TermsAndConditions = q.TermsAndConditions?
                    .Where(x => x.TermsAndCondition != null)
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new
                    {
                        x.TermsAndCondition!.Id,
                        x.TermsAndCondition.Title,
                        x.TermsAndCondition.Description,
                        x.SortOrder
                    })
                    .ToList(),

                QuotationOtherInformations = q.QuotationOtherInformations?
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new
                    {
                        x.Id,
                        x.Key,
                        x.Value,
                        x.SortOrder
                    })
                    .ToList(),

                QuotationStatusHistories = q.QuotationStatusHistories?
                    .OrderByDescending(x => x.ActionAt)
                    .Select(x => new
                    {
                        x.Id,
                        x.Status,
                        x.ActionAt,
                        x.ActionUserId,
                        x.Remarks,
                        x.SignatureImage,
                        ActionUser = x.ActionUser == null
                            ? null
                            : new
                            {
                                x.ActionUser.Id,
                                x.ActionUser.FullName,
                                x.ActionUser.DisplayName
                            }
                    })
                    .ToList(),

                QuotationItems = q.QuotationItems?
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new
                    {
                        x.Id,
                        x.ProductServiceId,
                        x.RowType,
                        x.Item,
                        x.Description,
                        x.Quantity,
                        x.Unit,
                        x.UnitPrice,
                        x.Discount,
                        x.TotalPrice,
                        x.SortOrder
                    })
                    .ToList(),

                Documents = q.Documents?
                    .OrderByDescending(x => x.Version)
                    .Select(x => new
                    {
                        x.Id,
                        x.FileName,
                        x.FilePath,
                        x.Version,
                        x.GeneratedAt,
                        x.GeneratedById
                    })
                    .ToList()
            };
        }

        private static object? MapCompany(Company? company)
        {
            if (company == null)
                return null;

            return new
            {
                company.Id,
                company.Name,
                company.ContactNo,
                company.Email,
                company.PrimaryContactPerson,
                company.SecondaryContactPerson,
                company.FaxNo,
                company.LogoImage,
                company.WebsiteUrl,
                company.SSMRegNo,
                BillingAddress = MapAddress(company.BillingAddress),
                DeliveryAddress = MapAddress(company.DeliveryAddress)
            };
        }

        private static object? MapAddress(Address? address)
        {
            if (address == null)
                return null;

            return new
            {
                address.Id,
                address.AddressLine1,
                address.AddressLine2,
                address.City,
                address.State,
                address.Country,
                address.Postcode
            };
        }

        // =========================================================
        // GET MANY
        // =========================================================

        [HttpGet("GetMany")]
        public async Task<ActionResult<object>> GetMany(
            int page = 1,
            int pageSize = 10,
            string? filter = null,
            string? orderBy = null,
            string? select = null,
            string? includes = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                page = Math.Max(1, page);
                pageSize = Math.Clamp(pageSize, 1, 200);

                var now = Now();

                // Expiry is updated in the database before paging.
                var expired = await _context.Quotations
    .Where(x =>
        x.DueDate.HasValue &&
        x.DueDate.Value < now &&
        x.Status != "Draft" &&
        x.Status != "Approved" &&
        x.Status != "Expired" &&
        x.Status != "Accepted" &&
        x.Status != "Cancelled")
    .ToListAsync(cancellationToken);

                foreach (var quotation in expired)
                {
                    quotation.Status = "Expired";

                    await AddStatusHistory(
                        quotation.Id,
                        "Expired",
                        null,
                        "Quotation automatically expired based on due date.");
                }

                if (expired.Count > 0)
                    await _context.SaveChangesAsync(cancellationToken);

                IQueryable<Quotation> query = _context.Quotations
                    .AsNoTracking();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(
                                 ',',
                                 StringSplitOptions.RemoveEmptyEntries))
                    {
                        var path = include.Trim();

                        // Only accept valid EF navigation paths.
                        if (!string.IsNullOrWhiteSpace(path))
                            query = query.Include(path);
                    }
                }

                if (!string.IsNullOrWhiteSpace(filter))
                {
                    query = ApplyQuotationFilter(query, filter);
                }

                var totalElements = await query.CountAsync(cancellationToken);

                if (!string.IsNullOrWhiteSpace(orderBy))
                {
                    var desc = orderBy.EndsWith(
                        " desc",
                        StringComparison.OrdinalIgnoreCase);

                    var property = desc
                        ? orderBy[..^5].Trim()
                        : orderBy.Trim();

                    var allowedProperties = typeof(Quotation)
                        .GetProperties()
                        .Select(x => x.Name)
                        .ToHashSet(StringComparer.OrdinalIgnoreCase);

                    if (allowedProperties.Contains(property))
                    {
                        query = desc
                            ? query.OrderByDescending(
                                x => EF.Property<object>(x, property))
                            : query.OrderBy(
                                x => EF.Property<object>(x, property));
                    }
                }
                else
                {
                    query = query.OrderByDescending(x => x.CreatedAt);
                }

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync(cancellationToken);

                if (!string.IsNullOrWhiteSpace(select))
                {
                    var fields = select.Split(
                        ',',
                        StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList();

                    var projected = items.Select(item =>
                    {
                        var dictionary = new Dictionary<string, object?>();

                        foreach (var field in fields)
                        {
                            var property = typeof(Quotation).GetProperty(
                                field,
                                System.Reflection.BindingFlags.IgnoreCase |
                                System.Reflection.BindingFlags.Public |
                                System.Reflection.BindingFlags.Instance);

                            if (property != null)
                                dictionary[field] = property.GetValue(item);
                        }

                        return dictionary;
                    }).ToList();

                    return Ok(new
                    {
                        Data = projected,
                        TotalElements = totalElements,
                        Page = page,
                        PageSize = pageSize
                    });
                }

                return Ok(new
                {
                    Data = items,
                    TotalElements = totalElements,
                    Page = page,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to retrieve quotations.",
                    Details = ex.Message
                });
            }
        }

        private static IQueryable<Quotation> ApplyQuotationFilter(
            IQueryable<Quotation> query,
            string filter)
        {
            // Supported format:
            // Status=Draft
            // QuotationNo=YL/Q
            // Status=Draft|Status=Sent
            // Status=Draft,ClientId=<guid>

            var orGroups = filter.Split(
                '|',
                StringSplitOptions.RemoveEmptyEntries);

            foreach (var group in orGroups)
            {
                var andParts = group.Split(
                    ',',
                    StringSplitOptions.RemoveEmptyEntries);

                foreach (var part in andParts)
                {
                    var notEqual = part.Contains("!=");

                    var pair = notEqual
                        ? part.Split("!=", 2)
                        : part.Split('=', 2);

                    if (pair.Length != 2)
                        continue;

                    var property = pair[0].Trim();
                    var value = pair[1].Trim();

                    switch (property.ToLowerInvariant())
                    {
                        case "quotationno":
                            query = notEqual
                                ? query.Where(x => !x.QuotationNo.Contains(value))
                                : query.Where(x => x.QuotationNo.Contains(value));
                            break;

                        case "status":
                            query = notEqual
                                ? query.Where(x => x.Status != value)
                                : query.Where(x => x.Status == value);
                            break;

                        case "subject":
                            query = notEqual
                                ? query.Where(x => x.Subject != null &&
                                                   !x.Subject.Contains(value))
                                : query.Where(x => x.Subject != null &&
                                                   x.Subject.Contains(value));
                            break;

                        case "clientid":
                            if (Guid.TryParse(value, out var clientId))
                            {
                                query = notEqual
                                    ? query.Where(x => x.ClientId != clientId)
                                    : query.Where(x => x.ClientId == clientId);
                            }
                            break;

                        case "fromcompanyid":
                            if (Guid.TryParse(value, out var companyId))
                            {
                                query = notEqual
                                    ? query.Where(x => x.FromCompanyId != companyId)
                                    : query.Where(x => x.FromCompanyId == companyId);
                            }
                            break;

                        case "projectcode":
                            query = notEqual
                                ? query.Where(x => x.ProjectCode != value)
                                : query.Where(x => x.ProjectCode == value);
                            break;
                    }
                }
            }

            return query;
        }

        // =========================================================
        // GET ONE
        // =========================================================

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(
            string? filter = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(filter))
                return BadRequest("Filter is required.");

            var parts = filter.Split('=', 2);

            if (parts.Length != 2)
                return BadRequest("Invalid filter format.");

            var key = parts[0].Trim();
            var value = parts[1].Trim();

            IQueryable<Quotation> query = _context.Quotations;

            Quotation? quotation;

            if (key.Equals("Id", StringComparison.OrdinalIgnoreCase))
            {
                if (!Guid.TryParse(value, out var id))
                    return BadRequest("Invalid quotation Id.");

                quotation = await LoadQuotation(id, cancellationToken);
            }
            else if (key.Equals("QuotationNo", StringComparison.OrdinalIgnoreCase))
            {
                var id = await query
                    .Where(x => x.QuotationNo == value)
                    .Select(x => x.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (id == Guid.Empty)
                    return NotFound();

                quotation = await LoadQuotation(id, cancellationToken);
            }
            else
            {
                return BadRequest("Unsupported filter type.");
            }

            if (quotation == null)
                return NotFound();

            await ExpireQuotationIfRequired(
                quotation,
                cancellationToken);

            return Ok(MapToDto(quotation));
        }

        // =========================================================
        // CREATE
        // =========================================================

        [HttpPost("Create")]
        public async Task<ActionResult<object>> Create(
            [FromBody] CreateQuotationRequest request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId == null)
                return Unauthorized(new { Error = "Invalid token." });

            if (request.FromCompanyId == Guid.Empty ||
                request.ClientId == Guid.Empty)
            {
                return BadRequest(new
                {
                    Error = "A company and client are required."
                });
            }

            try
            {
                var userId = CurrentUserId.Value;
                var quotationId = Guid.NewGuid();

                var quotationNo = string.IsNullOrWhiteSpace(request.QuotationNo)
                    ? await GenerateQuotationNo()
                    : request.QuotationNo.Trim();

                var duplicateNo = await _context.Quotations
                    .AnyAsync(
                        x => x.QuotationNo == quotationNo,
                        cancellationToken);

                if (duplicateNo)
                {
                    return Conflict(new
                    {
                        Error = "Quotation number already exists."
                    });
                }

                var quotation = new Quotation
                {
                    Id = quotationId,
                    QuotationNo = quotationNo,
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

                    DueDate = CalculateDueDate(
                        request.QuotationDate,
                        request.Validity,
                        request.ValidityType),

                    Status = "Draft",
                    CreatedById = userId,
                    CreatedAt = Now()
                };

                quotation.QuotationItems = await BuildQuotationItems(
                    request.QuotationItems,
                    quotationId,
                    cancellationToken);

                _context.Quotations.Add(quotation);

                var terms = await BuildQuotationTerms(
                    request.TermsAndConditions,
                    quotationId,
                    cancellationToken);

                if (terms.Count > 0)
                    _context.QuotationTermsAndConditions.AddRange(terms);

                var otherInfo = BuildOtherInformation(
                    request.QuotationOtherInformations,
                    quotationId);

                if (otherInfo.Count > 0)
                    _context.QuotationOtherInformations.AddRange(otherInfo);

                await AddStatusHistory(
                    quotationId,
                    "Draft",
                    userId,
                    "Quotation created.");

                await _context.SaveChangesAsync(cancellationToken);

                var result = await LoadQuotation(
                    quotationId,
                    cancellationToken);

                var dto = MapToDto(result!);

                await _hub.Clients.All.SendAsync(
                    "QuotationAdded",
                    dto,
                    cancellationToken);

                return Ok(dto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    Error = "Unable to save quotation. Check the quotation number and related records."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to create quotation.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // UPDATE
        // =========================================================

        [HttpPut("Update")]
        public async Task<ActionResult> Update(
            [FromBody] UpdateQuotationRequest request,
            CancellationToken cancellationToken)
        {
            if (request.Id == Guid.Empty)
                return BadRequest(new { Error = "Quotation Id is required." });

            var quotation = await _context.Quotations
                .Include(x => x.QuotationItems)
                .Include(x => x.TermsAndConditions)
                .Include(x => x.QuotationOtherInformations)
                .FirstOrDefaultAsync(
                    x => x.Id == request.Id,
                    cancellationToken);

            if (quotation == null)
                return NotFound(new { Error = "Quotation not found." });

            if (quotation.Status == "Accepted")
            {
                return Conflict(new
                {
                    Error = "An accepted quotation cannot be edited."
                });
            }

            if (quotation.Status == "Cancelled")
            {
                return Conflict(new
                {
                    Error = "A cancelled quotation cannot be edited."
                });
            }

            try
            {
                var quotationNo = request.QuotationNo?.Trim();

                if (string.IsNullOrWhiteSpace(quotationNo))
                    return BadRequest(new { Error = "Quotation number is required." });

                var duplicate = await _context.Quotations
                    .AnyAsync(
                        x => x.Id != quotation.Id &&
                             x.QuotationNo == quotationNo,
                        cancellationToken);

                if (duplicate)
                {
                    return Conflict(new
                    {
                        Error = "Quotation number already exists."
                    });
                }

                quotation.QuotationNo = quotationNo;
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
                quotation.NoValidity = request.NoValidity;
                quotation.Validity = request.Validity;
                quotation.ValidityType = request.ValidityType;

                quotation.DueDate = CalculateDueDate(
                    request.QuotationDate,
                    request.Validity,
                    request.ValidityType);

                quotation.UpdatedAt = Now();

                // Replace quotation items.
                _context.QuotationItems.RemoveRange(
                    quotation.QuotationItems);

                var newItems = await BuildQuotationItems(
                    request.QuotationItems,
                    quotation.Id,
                    cancellationToken);

                _context.QuotationItems.AddRange(newItems);

                // Replace quotation term links.
                var oldTerms = await _context.QuotationTermsAndConditions
                    .Where(x => x.QuotationId == quotation.Id)
                    .ToListAsync(cancellationToken);

                _context.QuotationTermsAndConditions.RemoveRange(oldTerms);

                var newTerms = await BuildQuotationTerms(
                    request.TermsAndConditions,
                    quotation.Id,
                    cancellationToken);

                if (newTerms.Count > 0)
                    _context.QuotationTermsAndConditions.AddRange(newTerms);

                // Replace additional information.
                var oldInfo = await _context.QuotationOtherInformations
                    .Where(x => x.QuotationId == quotation.Id)
                    .ToListAsync(cancellationToken);

                _context.QuotationOtherInformations.RemoveRange(oldInfo);

                var newInfo = BuildOtherInformation(
                    request.QuotationOtherInformations,
                    quotation.Id);

                if (newInfo.Count > 0)
                    _context.QuotationOtherInformations.AddRange(newInfo);

                await _context.SaveChangesAsync(cancellationToken);

                var updated = await LoadQuotation(
                    quotation.Id,
                    cancellationToken);

                var dto = MapToDto(updated!);

                await _hub.Clients.All.SendAsync(
                    "QuotationUpdated",
                    dto,
                    cancellationToken);

                return Ok(dto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    Error = "Unable to update quotation. Check the quotation number and related records."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update quotation.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // CLONE
        // =========================================================

        [HttpPost("Clone/{id}")]
        public async Task<IActionResult> Clone(
            Guid id,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId == null)
                return Unauthorized();

            var source = await LoadQuotation(id, cancellationToken);

            if (source == null)
                return NotFound(new
                {
                    Error = "Source quotation not found."
                });

            try
            {
                var newId = Guid.NewGuid();
                var now = Now();

                var clone = new Quotation
                {
                    Id = newId,
                    QuotationNo = await GenerateQuotationNo(),
                    QuotationDate = now,

                    FromCompanyId = source.FromCompanyId,
                    ClientId = source.ClientId,
                    ProjectCode = source.ProjectCode,
                    Subject = source.Subject,

                    SubTotal = source.SubTotal,
                    Discount = source.Discount,
                    TaxAmount = source.TaxAmount,
                    TotalAmount = source.TotalAmount,

                    PaymentTerms = source.PaymentTerms,
                    Validity = source.Validity,
                    ValidityType = source.ValidityType,

                    DueDate = CalculateDueDate(
                        now,
                        source.Validity,
                        source.ValidityType),

                    Status = "Draft",
                    Remarks = $"Cloned from {source.QuotationNo}",
                    CreatedById = CurrentUserId.Value,
                    CreatedAt = now
                };

                clone.QuotationItems = source.QuotationItems
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new QuotationItems
                    {
                        Id = Guid.NewGuid(),
                        QuotationId = newId,
                        ProductServiceId = x.ProductServiceId,
                        RowType = x.RowType,
                        Item = x.Item,
                        Description = x.Description,
                        Quantity = x.Quantity,
                        Unit = x.Unit,
                        UnitPrice = x.UnitPrice,
                        Discount = x.Discount,
                        TotalPrice = x.TotalPrice,
                        SortOrder = x.SortOrder,
                        CreatedAt = now
                    })
                    .ToList();

                var sourceTerms = source.TermsAndConditions
                    .Where(x => x.TermsAndCondition != null)
                    .Select(x => new QuotationTermsAndCondition
                    {
                        Id = Guid.NewGuid(),
                        QuotationId = newId,
                        TermsAndConditionId = x.TermsAndConditionId,
                        SortOrder = x.SortOrder
                    })
                    .ToList();

                var sourceInfo = source.QuotationOtherInformations
                    .Select(x => new QuotationOtherInformation
                    {
                        Id = Guid.NewGuid(),
                        QuotationId = newId,
                        Key = x.Key,
                        Value = x.Value,
                        SortOrder = x.SortOrder
                    })
                    .ToList();

                _context.Quotations.Add(clone);

                if (sourceTerms.Count > 0)
                    _context.QuotationTermsAndConditions.AddRange(sourceTerms);

                if (sourceInfo.Count > 0)
                    _context.QuotationOtherInformations.AddRange(sourceInfo);

                await AddStatusHistory(
                    newId,
                    "Draft",
                    CurrentUserId,
                    $"Quotation cloned from {source.QuotationNo}.");

                await _context.SaveChangesAsync(cancellationToken);

                var created = await LoadQuotation(newId, cancellationToken);
                var dto = MapToDto(created!);

                await _hub.Clients.All.SendAsync(
                    "QuotationAdded",
                    dto,
                    cancellationToken);

                return Ok(dto);
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    Error = "Unable to clone quotation. A quotation number may already exist."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Cloning failed.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // GENERATE QUOTATION NUMBER
        // =========================================================

        [HttpGet("generate-no")]
        public async Task<IActionResult> GenerateQuotationNoEndpoint()
        {
            try
            {
                return Ok(new
                {
                    quotationNo = await GenerateQuotationNo()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to generate quotation number.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // DELETE
        // =========================================================

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteQuotation(
            [FromQuery] Guid id,
            CancellationToken cancellationToken)
        {
            var quotation = await _context.Quotations
                .FirstOrDefaultAsync(
                    x => x.Id == id,
                    cancellationToken);

            if (quotation == null)
            {
                return NotFound(new
                {
                    Error = "Quotation not found."
                });
            }

            var linkedSalesOrder = await _context.SalesOrders
                .AnyAsync(
                    x => x.QuotationId == id,
                    cancellationToken);

            if (linkedSalesOrder)
            {
                return Conflict(new
                {
                    Error = "This quotation has been converted into a Sales Order and cannot be deleted."
                });
            }

            if (quotation.Status != "Draft" &&
    quotation.Status != "Rejected" &&
    quotation.Status != "Expired")
            {
                return Conflict(new
                {
                    Error = "Only Draft, Rejected or Expired quotations can be deleted."
                });
            }

            try
            {
                // Remove join records and additional information.
                // Items, documents and status history use configured cascades.
                var terms = await _context.QuotationTermsAndConditions
                    .Where(x => x.QuotationId == id)
                    .ToListAsync(cancellationToken);

                var otherInfo = await _context.QuotationOtherInformations
                    .Where(x => x.QuotationId == id)
                    .ToListAsync(cancellationToken);

                _context.QuotationTermsAndConditions.RemoveRange(terms);
                _context.QuotationOtherInformations.RemoveRange(otherInfo);

                _context.Quotations.Remove(quotation);

                await _context.SaveChangesAsync(cancellationToken);

                await _hub.Clients.All.SendAsync(
                    "QuotationDeleted",
                    id,
                    cancellationToken);

                return Ok(new
                {
                    Message = "Quotation deleted successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to delete quotation.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // UPDATE STATUS
        // =========================================================

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(
            Guid id,
            string status,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId == null)
                return Unauthorized(new { Error = "Invalid token." });

            if (string.IsNullOrWhiteSpace(status))
                return BadRequest(new { Error = "Status is required." });

            status = status.Trim();

            var validStatus = ValidStatuses.FirstOrDefault(
                x => x.Equals(status, StringComparison.OrdinalIgnoreCase));

            if (validStatus == null)
            {
                return BadRequest(new
                {
                    Error = "Invalid quotation status.",
                    AllowedStatuses = ValidStatuses
                });
            }

            var quotation = await _context.Quotations
                .FirstOrDefaultAsync(
                    x => x.Id == id,
                    cancellationToken);

            if (quotation == null)
                return NotFound();

            if (quotation.Status == "Accepted" ||
                quotation.Status == "Cancelled")
            {
                return Conflict(new
                {
                    Error = $"A quotation with status '{quotation.Status}' cannot be changed."
                });
            }

            if (quotation.Status == validStatus)
            {
                return BadRequest(new
                {
                    Error = "Quotation already has this status."
                });
            }

            if (validStatus == "Accepted")
            {
                return BadRequest(new
                {
                    Error = "Use Sales Order conversion to accept a quotation."
                });
            }

            var userId = CurrentUserId.Value;

            var userName = await _context.Users
                .Where(x => x.Id == userId)
                .Select(x => x.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            quotation.Status = validStatus;
            quotation.UpdatedAt = Now();

            var history = new QuotationStatusHistory
            {
                Id = Guid.NewGuid(),
                QuotationId = id,
                Status = validStatus,
                ActionUserId = userId,
                ActionAt = Now(),
                Remarks = GenerateStatusRemark(
                    validStatus,
                    userName ?? "System")
            };

            _context.QuotationStatusHistories.Add(history);

            await _context.SaveChangesAsync(cancellationToken);

            await _hub.Clients.All.SendAsync(
                "QuotationUpdated",
                new
                {
                    Id = quotation.Id,
                    quotation.QuotationNo,
                    quotation.Status
                },
                cancellationToken);

            return Ok(new
            {
                history.Id,
                history.Status,
                history.ActionAt,
                history.Remarks,
                ActionUser = new
                {
                    Id = userId,
                    FullName = userName
                }
            });
        }

        // =========================================================
        // CONVERT QUOTATION TO SALES ORDER
        // =========================================================

        [HttpPost("ConvertFromQuotation/{quotationId}")]
        public async Task<IActionResult> ConvertFromQuotation(
            Guid quotationId,
            [FromForm] ConvertQuotationToSoRequest request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId == null)
                return Unauthorized(new { Error = "Invalid token." });

            var userId = CurrentUserId.Value;

            var quotation = await _context.Quotations
                .Include(x => x.QuotationItems)
                .FirstOrDefaultAsync(
                    x => x.Id == quotationId,
                    cancellationToken);

            if (quotation == null)
            {
                return NotFound(new
                {
                    Error = "Source quotation not found."
                });
            }

            if (quotation.Status == "Cancelled" ||
                quotation.Status == "Expired")
            {
                return Conflict(new
                {
                    Error = "Cancelled or expired quotations cannot be converted."
                });
            }

            var alreadyConverted = await _context.SalesOrders
                .AnyAsync(
                    x => x.QuotationId == quotationId,
                    cancellationToken);

            if (alreadyConverted)
            {
                return Conflict(new
                {
                    Error = "This quotation has already been converted into a Sales Order."
                });
            }

            string? attachmentPath = null;

            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    cancellationToken);

            try
            {
                if (request.ClientPOAttachment != null &&
                    request.ClientPOAttachment.Length > 0)
                {
                    const long maxFileSize = 10 * 1024 * 1024;

                    if (request.ClientPOAttachment.Length > maxFileSize)
                    {
                        return BadRequest(new
                        {
                            Error = "Client PO attachment cannot exceed 10 MB."
                        });
                    }

                    var extension = Path.GetExtension(
                        request.ClientPOAttachment.FileName);

                    var allowedExtensions = new[]
                    {
                        ".pdf", ".jpg", ".jpeg", ".png"
                    };

                    if (!allowedExtensions.Contains(
                            extension,
                            StringComparer.OrdinalIgnoreCase))
                    {
                        return BadRequest(new
                        {
                            Error = "Only PDF, JPG and PNG files are allowed."
                        });
                    }

                    var uploadsFolder = Path.Combine(
                        _env.WebRootPath ?? _env.ContentRootPath,
                        "uploads",
                        "ClientPOs");

                    Directory.CreateDirectory(uploadsFolder);

                    var fileName =
                        $"{Guid.NewGuid()}{extension.ToLowerInvariant()}";

                    var fullPath = Path.Combine(
                        uploadsFolder,
                        fileName);

                    await using (var stream = new FileStream(
                                     fullPath,
                                     FileMode.CreateNew))
                    {
                        await request.ClientPOAttachment.CopyToAsync(
                            stream,
                            cancellationToken);
                    }

                    attachmentPath = Path
                        .Combine("uploads", "ClientPOs", fileName)
                        .Replace("\\", "/");
                }

                var salesOrderId = Guid.NewGuid();

                var salesOrder = new SalesOrder
                {
                    Id = salesOrderId,
                    SalesOrderNo = await GenerateSalesOrderNo(),
                    QuotationId = quotation.Id,

                    ClientId = quotation.ClientId,
                    CompanyId = quotation.FromCompanyId,

                    SODate = Now(),
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

                    CreatedAt = Now(),
                    CreatedById = userId
                };

                salesOrder.SalesOrderItems = quotation.QuotationItems
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new SalesOrderItem
                    {
                        Id = Guid.NewGuid(),
                        SalesOrderId = salesOrderId,

                        ProductServiceId = x.ProductServiceId,
                        RowType = x.RowType,
                        Item = x.Item,
                        Description = x.Description,

                        Quantity = x.Quantity,
                        Unit = x.Unit,
                        UnitPrice = x.UnitPrice,
                        Discount = x.Discount,
                        TaxRate = 0,
                        TotalPrice = x.TotalPrice,

                        SortOrder = x.SortOrder,
                        QuantityDelivered = 0m
                    })
                    .ToList();

                _context.SalesOrders.Add(salesOrder);

                _context.SalesOrderStatusHistories.Add(
                    new SalesOrderStatusHistory
                    {
                        Id = Guid.NewGuid(),
                        SalesOrderId = salesOrderId,
                        Status = "Draft",
                        ActionAt = Now(),
                        ActionUserId = userId,
                        Remarks = $"Sales Order generated from Quotation {quotation.QuotationNo}."
                    });

                quotation.Status = "Accepted";
                quotation.Remarks =
                    $"Converted into Sales Order {salesOrder.SalesOrderNo}";
                quotation.UpdatedAt = Now();

                await AddStatusHistory(
                    quotation.Id,
                    "Accepted",
                    userId,
                    $"System auto-accepted upon conversion to Sales Order {salesOrder.SalesOrderNo}.");

                await _context.SaveChangesAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                await _hub.Clients.All.SendAsync(
                    "SalesOrderAdded",
                    new
                    {
                        salesOrder.Id,
                        salesOrder.SalesOrderNo,
                        salesOrder.Status
                    },
                    cancellationToken);

                await _hub.Clients.All.SendAsync(
                    "QuotationUpdated",
                    new
                    {
                        Id = quotation.Id,
                        quotation.Status,
                        quotation.Remarks
                    },
                    cancellationToken);

                return Ok(new
                {
                    Message = "Quotation successfully converted to Sales Order.",
                    SalesOrderId = salesOrder.Id,
                    SalesOrderNo = salesOrder.SalesOrderNo
                });
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync(cancellationToken);

                if (!string.IsNullOrWhiteSpace(attachmentPath))
                {
                    var fullPath = Path.Combine(
                        _env.WebRootPath ?? _env.ContentRootPath,
                        attachmentPath.Replace(
                            '/',
                            Path.DirectorySeparatorChar));

                    if (System.IO.File.Exists(fullPath))
                        System.IO.File.Delete(fullPath);
                }

                return Conflict(new
                {
                    Error = "Unable to convert quotation. Check whether a Sales Order already exists or a document number is duplicated."
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);

                if (!string.IsNullOrWhiteSpace(attachmentPath))
                {
                    var fullPath = Path.Combine(
                        _env.WebRootPath ?? _env.ContentRootPath,
                        attachmentPath.Replace(
                            '/',
                            Path.DirectorySeparatorChar));

                    if (System.IO.File.Exists(fullPath))
                        System.IO.File.Delete(fullPath);
                }

                return StatusCode(500, new
                {
                    Error = "Conversion processing failed.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // EXPORT EXCEL
        // =========================================================

        [HttpGet("ExportExcel")]
        public async Task<IActionResult> ExportExcel(
            CancellationToken cancellationToken)
        {
            var data = await _context.Quotations
                .AsNoTracking()
                .Include(x => x.Client)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);

            using var workbook = new XLWorkbook();

            var worksheet = workbook.Worksheets.Add("Quotations");

            var headers = new[]
            {
                "Quotation No",
                "Quotation Date",
                "Client",
                "Subject",
                "Sub Total",
                "Discount",
                "Tax Amount",
                "Total Amount",
                "Status"
            };

            for (var i = 0; i < headers.Length; i++)
                worksheet.Cell(1, i + 1).Value = headers[i];

            var header = worksheet.Range(1, 1, 1, headers.Length);

            header.Style.Font.Bold = true;
            header.Style.Fill.BackgroundColor =
                XLColor.FromHtml("#2148BC");
            header.Style.Font.FontColor = XLColor.White;

            var row = 2;

            foreach (var quotation in data)
            {
                worksheet.Cell(row, 1).Value = quotation.QuotationNo;
                worksheet.Cell(row, 2).Value =
                    quotation.QuotationDate.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 3).Value = quotation.Client?.Name;
                worksheet.Cell(row, 4).Value = quotation.Subject;

                worksheet.Cell(row, 5).Value =
                    quotation.SubTotal ?? 0;

                worksheet.Cell(row, 6).Value =
                    quotation.Discount ?? 0;

                worksheet.Cell(row, 7).Value =
                    quotation.TaxAmount ?? 0;

                worksheet.Cell(row, 8).Value =
                    quotation.TotalAmount ?? 0;

                worksheet.Cell(row, 9).Value = quotation.Status;

                row++;
            }

            worksheet.Columns().AdjustToContents();

            worksheet.SheetView.FreezeRows(1);

            using var stream = new MemoryStream();

            workbook.SaveAs(stream);
            stream.Position = 0;

            return File(
                stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Quotations_{Now():yyyyMMddHHmmss}.xlsx");
        }

        // =========================================================
        // DROPDOWN
        // =========================================================


        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetQuoteDropdown(
            CancellationToken cancellationToken)
        {
            try
            {
                var companies = await _context.Companies
                    .AsNoTracking()
                    .Where(x =>
                        x.Type == CompanyType.Own ||
                        x.Type == CompanyType.Client)
                    .OrderBy(x => x.Name)
                    .Select(x => new
                    {
                        x.Id,
                        x.Name,
                        x.Type,
                        x.BillingAddress,
                        x.DeliveryAddress,

                        // Contact information
                        x.PrimaryContactPerson,
                        x.SecondaryContactPerson,
                        x.ContactNo,
                        x.FaxNo,
                        x.Email
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
                        PrimaryContactPerson = x.PrimaryContactPerson,
                        SecondaryContactPerson = x.SecondaryContactPerson,
                        ContactNo = x.ContactNo,
                        FaxNo = x.FaxNo,
                        Email = x.Email,
                        BillingAddress = x.BillingAddress,
                        DeliveryAddress = x.DeliveryAddress
                    })
                    .ToList();

                var terms = await _context.TermsAndConditions
                    .AsNoTracking()
                    .OrderBy(x => x.Title)
                    .Select(x => new TermsAndConditionOrderDto
                    {
                        Id = x.Id,
                        Title = x.Title,
                        Description = x.Description
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

                var projects = await _context.Projects.AsNoTracking()
                    .OrderBy(x => x.ProjectCode)
                    .Select(x => new Project
                    {
                        Id = x.Id,
                        ProjectCode = x.ProjectCode,
                        ProjectTitle = x.ProjectTitle,
                    })
                    .ToListAsync(cancellationToken);

                return Ok(new
                {
                    Companies = ownCompanies,
                    Clients = clients,
                    TermsAndConditions = terms,
                    Inventories = inventories,
                    ProductAndServices = productServices,
                    Projects = projects
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load quotation dropdowns.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // SAVE AS TEMPLATE
        // =========================================================

        [HttpPost("SaveAsTemplate/{quotationId:guid}")]
        public async Task<IActionResult> SaveAsTemplate(
    Guid quotationId,
    [FromBody] SaveQuotationAsTemplateRequest request,
    CancellationToken cancellationToken)
        {
            if (CurrentUserId == null)
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    Error = "Template name is required."
                });
            }

            var quotation = await _context.Quotations
                .Include(x => x.QuotationItems)
                .Include(x => x.TermsAndConditions)
                    .ThenInclude(x => x.TermsAndCondition)
                .FirstOrDefaultAsync(
                    x => x.Id == quotationId,
                    cancellationToken);

            if (quotation == null)
            {
                return NotFound(new
                {
                    Error = "Quotation not found."
                });
            }

            var name = request.Name.Trim();

            var duplicate = await _context.QuotationTemplates
                .AnyAsync(
                    x => x.IsActive &&
                         x.FromCompanyId == quotation.FromCompanyId &&
                         x.Name.ToLower() == name.ToLower(),
                    cancellationToken);

            if (duplicate)
            {
                return Conflict(new
                {
                    Error = "A template with this name already exists for this company."
                });
            }

            var templateId = Guid.NewGuid();
            var now = Now();

            var template = new QuotationTemplate
            {
                Id = templateId,
                Name = name,
                Description = request.Description,
                FromCompanyId = quotation.FromCompanyId,
                Subject = quotation.Subject,

                Discount = quotation.Discount,
                TaxAmount = quotation.TaxAmount,

                PaymentTerms = quotation.PaymentTerms,
                NoValidity = quotation.NoValidity,
                Validity = quotation.Validity,
                ValidityType = quotation.ValidityType,

                IsActive = true,
                CreatedById = CurrentUserId.Value,
                CreatedAt = now
            };

            template.Items = quotation.QuotationItems
                .OrderBy(x => x.SortOrder)
                .Select(x => new QuotationTemplateItem
                {
                    Id = Guid.NewGuid(),
                    TemplateId = templateId,
                    ProductServiceId = x.ProductServiceId,
                    RowType = x.RowType,
                    Item = x.Item,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    UnitPrice = x.UnitPrice,
                    Discount = x.Discount,
                    TotalPrice = x.TotalPrice,
                    SortOrder = x.SortOrder
                })
                .ToList();

            template.Terms = quotation.TermsAndConditions
                .Where(x => x.TermsAndCondition != null)
                .OrderBy(x => x.SortOrder)
                .Select(x => new QuotationTemplateTerm
                {
                    Id = Guid.NewGuid(),
                    TemplateId = templateId,
                    TermsAndConditionId = x.TermsAndConditionId,
                    Title = x.TermsAndCondition!.Title,
                    Description = x.TermsAndCondition.Description,
                    SortOrder = x.SortOrder
                })
                .ToList();

            _context.QuotationTemplates.Add(template);

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                Message = "Quotation template saved successfully.",
                TemplateId = template.Id,
                template.Name
            });
        }


        [HttpPost("CreateTemplate")]
        public async Task<IActionResult> CreateTemplate(
            [FromBody] CreateQuotationTemplateRequest request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId == null)
                return Unauthorized(new { Error = "Invalid token." });

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new
                {
                    Error = "Template name is required."
                });
            }

            if (request.FromCompanyId == Guid.Empty)
            {
                return BadRequest(new
                {
                    Error = "A company is required."
                });
            }

            var companyExists = await _context.Companies
                .AnyAsync(
                    x => x.Id == request.FromCompanyId,
                    cancellationToken);

            if (!companyExists)
            {
                return BadRequest(new
                {
                    Error = "Selected company was not found."
                });
            }

            var name = request.Name.Trim();

            var duplicate = await _context.QuotationTemplates
                .AnyAsync(
                    x => x.IsActive &&
                         x.FromCompanyId == request.FromCompanyId &&
                         x.Name.ToLower() == name.ToLower(),
                    cancellationToken);

            if (duplicate)
            {
                return Conflict(new
                {
                    Error = "A template with this name already exists for this company."
                });
            }

            var templateId = Guid.NewGuid();
            var now = Now();

            var template = new QuotationTemplate
            {
                Id = templateId,
                Name = name,
                Description = request.Description,
                FromCompanyId = request.FromCompanyId,
                Subject = request.Subject,
                ProjectCode = request.ProjectCode,
                Discount = request.Discount,
                TaxAmount = request.TaxAmount,
                PaymentTerms = request.PaymentTerms,
                NoValidity = request.NoValidity,
                Validity = request.NoValidity ? null : request.Validity,
                ValidityType = request.NoValidity ? null : request.ValidityType,
                IsActive = true,
                CreatedById = CurrentUserId.Value,
                CreatedAt = now
            };

            template.Items = (request.Items ?? new List<QuotationItemRequest>())
                .OrderBy(x => x.SortOrder)
                .Select(x => new QuotationTemplateItem
                {
                    Id = Guid.NewGuid(),
                    TemplateId = templateId,
                    ProductServiceId = x.ProductServiceId,
                    RowType = x.RowType,
                    Item = x.Item,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    UnitPrice = x.UnitPrice,
                    Discount = x.Discount,
                    TotalPrice = x.TotalPrice,
                    SortOrder = x.SortOrder
                })
                .ToList();

            template.Terms = (request.TermsAndConditions ??
                              new List<TermsAndConditionOrderDto>())
                .OrderBy(x => x.SortOrder)
                .Select(x => new QuotationTemplateTerm
                {
                    Id = Guid.NewGuid(),
                    TemplateId = templateId,
                    TermsAndConditionId = x.Id,
                    Title = x.Title ?? string.Empty,
                    Description = x.Description,
                    SortOrder = x.SortOrder
                })
                .ToList();

            _context.QuotationTemplates.Add(template);

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                Message = "Quotation template created successfully.",
                template.Id,
                template.Name
            });
        }


        // =========================================================
        // GET TEMPLATES
        // =========================================================

        [HttpGet("GetTemplates")]
        public async Task<IActionResult> GetTemplates(
            CancellationToken cancellationToken)
        {
            var templates = await _context.QuotationTemplates
                .AsNoTracking()
                .Where(x => x.IsActive)
                .OrderBy(x => x.Name)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.Description,
                    x.Subject,
                    x.FromCompanyId,
                    x.CreatedAt,
                    CreatedBy = x.CreatedBy != null
            ? new {
                FullName = x.CreatedBy.FullName,
                DisplayName = x.CreatedBy.DisplayName
                }
            : null,
                    ItemCount = x.Items.Count
                })
                .ToListAsync(cancellationToken);

            return Ok(templates);
        }

        // =========================================================
        // GET TEMPLATE
        // =========================================================

        [HttpGet("GetTemplate/{id}")]
        public async Task<IActionResult> GetTemplate(
            Guid id,
            CancellationToken cancellationToken)
        {
            var template = await _context.QuotationTemplates
                .AsNoTracking()
                .Include(x => x.Items)
                .Include(x => x.Terms)
                .FirstOrDefaultAsync(
                    x => x.Id == id && x.IsActive,
                    cancellationToken);

            if (template == null)
            {
                return NotFound(new
                {
                    Error = "Template not found."
                });
            }

            return Ok(new
            {
                template.Id,
                template.Name,
                template.Description,

                template.FromCompanyId,
                template.Subject,
                template.ProjectCode,

                template.Discount,
                template.TaxAmount,

                template.PaymentTerms,
                template.Validity,
                template.ValidityType,
                template.NoValidity,
                Items = template.Items
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new
                    {
                        x.ProductServiceId,
                        x.RowType,
                        x.Item,
                        x.Description,
                        x.Quantity,
                        x.Unit,
                        x.UnitPrice,
                        x.Discount,
                        x.TotalPrice,
                        x.SortOrder
                    })
                    .ToList(),

                Terms = template.Terms
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new
                    {
                        Id = x.TermsAndConditionId,
                        x.Title,
                        x.Description,
                        x.SortOrder
                    })
                    .ToList()
            });
        }

        // =========================================================
        // DELETE TEMPLATE (SOFT DELETE)
        // =========================================================

        [HttpDelete("DeleteTemplate/{id:guid}")]
        public async Task<IActionResult> DeleteTemplate(
     Guid id,
     CancellationToken cancellationToken)
        {
            var template = await _context.QuotationTemplates
                .FirstOrDefaultAsync(
                    x => x.Id == id,
                    cancellationToken);

            if (template == null)
            {
                return NotFound(new
                {
                    Error = "Template not found."
                });
            }

            _context.QuotationTemplates.Remove(template);

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                Message = "Template deleted successfully."
            });
        }

        [HttpPut("UpdateTemplate")]
        public async Task<IActionResult> UpdateTemplate(
            [FromBody] UpdateQuotationTemplateRequest request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId == null)
                return Unauthorized(new { Error = "Invalid token." });

            if (request.Id == Guid.Empty)
                return BadRequest(new { Error = "Template Id is required." });

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { Error = "Template name is required." });

            // Load template and existing child records.
            var template = await _context.QuotationTemplates
                .Include(x => x.Items)
                .Include(x => x.Terms)
                .FirstOrDefaultAsync(
                    x => x.Id == request.Id,
                    cancellationToken);

            if (template == null)
                return NotFound(new { Error = "Template not found." });

            if (!template.IsActive)
                return BadRequest(new
                {
                    Error = "Inactive templates cannot be edited."
                });

            var name = request.Name.Trim();

            // Check duplicate template name.
            var duplicate = await _context.QuotationTemplates
                .AnyAsync(
                    x => x.Id != request.Id &&
                         x.IsActive &&
                         x.FromCompanyId == request.FromCompanyId &&
                         x.Name.ToLower() == name.ToLower(),
                    cancellationToken);

            if (duplicate)
            {
                return Conflict(new
                {
                    Error = "A template with this name already exists for this company."
                });
            }

            // Update main template fields.
            template.Name = name;
            template.Description = request.Description;
            template.FromCompanyId = request.FromCompanyId;
            template.Subject = request.Subject;
            template.ProjectCode = request.ProjectCode;
            template.Discount = request.Discount;
            template.TaxAmount = request.TaxAmount;
            template.PaymentTerms = request.PaymentTerms;

            template.NoValidity = request.NoValidity;
            template.Validity = request.NoValidity ? null : request.Validity;
            template.ValidityType = request.NoValidity
                ? null
                : request.ValidityType;

            template.UpdatedAt = Now();
            template.UpdatedById = CurrentUserId;

            // Remove existing child records explicitly.
            var existingItems = template.Items.ToList();
            var existingTerms = template.Terms.ToList();

            _context.QuotationTemplateItems.RemoveRange(existingItems);
            _context.QuotationTemplateTerms.RemoveRange(existingTerms);

            // Prepare replacement items.
            var newItems = (request.Items ?? new List<QuotationItemRequest>())
                .OrderBy(x => x.SortOrder)
                .Select(x => new QuotationTemplateItem
                {
                    Id = Guid.NewGuid(),
                    TemplateId = template.Id,
                    ProductServiceId = x.ProductServiceId,
                    RowType = x.RowType,
                    Item = x.Item,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    UnitPrice = x.UnitPrice,
                    Discount = x.Discount,
                    TotalPrice = x.TotalPrice,
                    SortOrder = x.SortOrder
                })
                .ToList();

            // Prepare replacement terms.
            var newTerms = (request.TermsAndConditions ??
                            new List<TermsAndConditionOrderDto>())
                .OrderBy(x => x.SortOrder)
                .Select(x => new QuotationTemplateTerm
                {
                    Id = Guid.NewGuid(),
                    TemplateId = template.Id,

                    // Null means custom term.
                    TermsAndConditionId =
                        x.Id.HasValue && x.Id.Value != Guid.Empty
                            ? x.Id
                            : null,

                    Title = x.Title?.Trim() ?? string.Empty,
                    Description = x.Description,
                    SortOrder = x.SortOrder
                })
                .ToList();

            // Add replacement records.
            _context.QuotationTemplateItems.AddRange(newItems);
            _context.QuotationTemplateTerms.AddRange(newTerms);

            try
            {
                await _context.SaveChangesAsync(cancellationToken);

                return Ok(new
                {
                    Message = "Quotation template updated successfully.",
                    template.Id,
                    template.Name
                });
            }
            catch (DbUpdateConcurrencyException ex)
            {
                var conflicts = new List<object>();

                foreach (var entry in ex.Entries)
                {
                    var primaryKey = entry.Metadata.FindPrimaryKey();

                    var keyValues = primaryKey?.Properties.ToDictionary(
                        property => property.Name,
                        property => entry.Property(property.Name).CurrentValue
                    );

                    var databaseValues =
                        await entry.GetDatabaseValuesAsync(cancellationToken);

                    conflicts.Add(new
                    {
                        Entity = entry.Metadata.ClrType.Name,
                        State = entry.State.ToString(),
                        PrimaryKey = keyValues,
                        ExistsInDatabase = databaseValues != null
                    });
                }

                return Conflict(new
                {
                    Error = "Quotation template update failed due to a concurrency conflict.",
                    Conflicts = conflicts
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "An error occurred while updating the quotation template.",
                    Details = ex.Message
                });
            }
        }


        // =========================================================
        // DOWNLOAD QUOTATION PDF
        // =========================================================

        [HttpGet("DownloadPdf/{id:guid}")]
        public async Task<IActionResult> DownloadPdf(
            Guid id,
            CancellationToken cancellationToken)
        {
            try
            {
                var quotation = await _context.Quotations
                    .AsNoTracking()
                    .Include(x => x.Documents)
                    .FirstOrDefaultAsync(
                        x => x.Id == id,
                        cancellationToken);

                if (quotation == null)
                {
                    return NotFound(new
                    {
                        Error = "Quotation not found."
                    });
                }

                var document = quotation.Documents?
                    .OrderByDescending(x => x.Version)
                    .FirstOrDefault();

                if (document == null ||
                    string.IsNullOrWhiteSpace(document.FilePath))
                {
                    return NotFound(new
                    {
                        Error = "No generated PDF is available for this quotation."
                    });
                }

                // Resolve the stored relative file path.
                var webRoot = Path.GetFullPath(
                    _env.WebRootPath ?? _env.ContentRootPath);

                var relativePath = document.FilePath
                    .Replace('/', Path.DirectorySeparatorChar)
                    .Replace('\\', Path.DirectorySeparatorChar);

                var fullPath = Path.GetFullPath(
                    Path.Combine(webRoot, relativePath));

                // Prevent directory traversal.
                var rootWithSeparator = webRoot.TrimEnd(
                    Path.DirectorySeparatorChar) +
                    Path.DirectorySeparatorChar;

                if (!fullPath.StartsWith(
                        rootWithSeparator,
                        StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        Error = "Invalid document path."
                    });
                }

                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound(new
                    {
                        Error = "PDF file could not be found on the server."
                    });
                }

                var fileName = string.IsNullOrWhiteSpace(document.FileName)
                    ? $"{quotation.QuotationNo}.pdf"
                    : document.FileName;

                return PhysicalFile(
                    fullPath,
                    "application/pdf",
                    fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to download quotation PDF.",
                    Details = ex.Message
                });
            }
        }

    }
}
