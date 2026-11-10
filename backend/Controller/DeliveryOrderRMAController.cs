
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Linq.Expressions;
using System.Reflection;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveryOrderRMAController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        private static readonly HashSet<string> AllowedIncludes =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "DeliveryOrder",
                "SenderCompany",
                "ReceiverCompany",
                "DORMAItems",
                "DORMAProofImages",
                "DORMAStatusHistories"
            };

        public DeliveryOrderRMAController(
            AppDbContext context,
            IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;
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
            string? includes = null)
        {
            try
            {
                page = Math.Max(1, page);
                pageSize = Math.Clamp(pageSize, 1, 200);

                IQueryable<DeliveryOrderRMA> query =
                    _context.DeliveryOrderRMAs.AsNoTracking();

                query = ApplyIncludes(query, includes);

                if (!string.IsNullOrWhiteSpace(filter))
                {
                    query = ApplyFilter(query, filter);
                }

                // Sorting
                if (!string.IsNullOrWhiteSpace(orderBy))
                {
                    var sortParts = orderBy.Trim()
                        .Split(' ', StringSplitOptions.RemoveEmptyEntries);

                    if (sortParts.Length > 2)
                        return BadRequest("Invalid sorting format.");

                    string propertyName = sortParts[0];

                    bool descending = sortParts.Length == 2 &&
                        sortParts[1].Equals(
                            "desc",
                            StringComparison.OrdinalIgnoreCase);

                    if (sortParts.Length == 2 &&
                        !descending &&
                        !sortParts[1].Equals(
                            "asc",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest("Invalid sorting direction.");
                    }

                    var property = typeof(DeliveryOrderRMA).GetProperty(
                        propertyName,
                        BindingFlags.Public |
                        BindingFlags.Instance |
                        BindingFlags.IgnoreCase);

                    if (property == null || !IsScalarProperty(property.PropertyType))
                    {
                        return BadRequest("Invalid sorting property.");
                    }

                    query = descending
                        ? query.OrderByDescending(x =>
                            EF.Property<object>(x, property.Name))
                        : query.OrderBy(x =>
                            EF.Property<object>(x, property.Name));
                }
                else
                {
                    query = query.OrderByDescending(x => x.CreatedAt);
                }

                int totalElements = await query.CountAsync();

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Optional selected fields
                if (!string.IsNullOrWhiteSpace(select))
                {
                    var selectedFields = select
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .Where(x => !string.IsNullOrWhiteSpace(x))
                        .ToList();

                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object?>();

                        foreach (var field in selectedFields)
                        {
                            var property = typeof(DeliveryOrderRMA).GetProperty(
                                field,
                                BindingFlags.Public |
                                BindingFlags.Instance |
                                BindingFlags.IgnoreCase);

                            if (property != null)
                            {
                                dict[property.Name] =
                                    property.GetValue(item);
                            }
                        }

                        return dict;
                    }).ToList();

                    return Ok(new
                    {
                        Data = projected,
                        TotalElements = totalElements
                    });
                }

                return Ok(new
                {
                    Data = items,
                    TotalElements = totalElements
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    Error = "Invalid filter.",
                    Details = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Search failed.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // GET ONE
        // =========================================================

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(
            string? filter = null,
            string? includes = null)
        {
            try
            {
                IQueryable<DeliveryOrderRMA> query =
                    _context.DeliveryOrderRMAs.AsNoTracking();

                // Always load required navigation properties.
                query = query
                    .Include(x => x.DORMAItems)
                    .Include(x => x.DORMAProofImages)
                    .Include(x => x.DORMAStatusHistories)
                    .Include(x => x.DeliveryOrder)
                    .Include(x => x.SenderCompany)
                    .Include(x => x.ReceiverCompany);

                // Additional allowed includes.
                query = ApplyIncludes(query, includes);

                if (!string.IsNullOrWhiteSpace(filter))
                {
                    string filterValue = filter.Trim();

                    if (filterValue.Contains('='))
                    {
                        var parts = filterValue.Split('=', 2);
                        filterValue = parts[1].Trim();
                    }

                    if (!Guid.TryParse(filterValue, out Guid guidId))
                    {
                        return BadRequest("Invalid RMA ID.");
                    }

                    query = query.Where(x => x.Id == guidId);
                }

                var data = await query.FirstOrDefaultAsync();

                if (data == null)
                    return NotFound("RMA not found.");

                var safeResult = new
                {
                    data.Id,
                    data.DeliveryOrderRMANo,
                    data.DeliveryOrderId,
                    data.Date,
                    data.ReturnType,
                    data.ReturnQuantity,
                    data.ReturnMethod,
                    data.ReturnAction,
                    data.SenderCompanyId,
                    data.ReceiverCompanyId,
                    data.Reason,
                    data.Remarks,
                    data.Status,
                    data.ActionUserId,
                    data.ActionUserName,
                    data.SignatureImage,

                    DeliveryOrder = data.DeliveryOrder == null
                        ? null
                        : new
                        {
                            data.DeliveryOrder.Id,
                            data.DeliveryOrder.DeliveryOrderNo
                        },

                    SenderCompany = data.SenderCompany == null
                        ? null
                        : new
                        {
                            data.SenderCompany.Id,
                            data.SenderCompany.Name
                        },

                    ReceiverCompany = data.ReceiverCompany == null
                        ? null
                        : new
                        {
                            data.ReceiverCompany.Id,
                            data.ReceiverCompany.Name
                        },

                    DORMAItems = data.DORMAItems.Select(i => new
                    {
                        i.Id,
                        i.DeliveryOrderRMAId,
                        i.SalesOrderItemId,
                        i.DeliveryOrderItemId,
                        i.Description,
                        i.Quantity,
                        i.Unit,
                        i.Condition,
                        i.Remarks
                    }).ToList(),

                    DORMAProofImages = data.DORMAProofImages.Select(i => new
                    {
                        i.Id,
                        i.DeliveryOrderRMAId,
                        i.Url
                    }).ToList(),

                    DORMAStatusHistories = data.DORMAStatusHistories
                        .OrderByDescending(x => x.ActionAt)
                        .Select(x => new
                        {
                            x.Id,
                            x.RMAId,
                            x.Status,
                            x.ActionAt,
                            x.ActionUserId,
                            x.Remarks
                        }).ToList()
                };

                return Ok(safeResult);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    Error = "Invalid request.",
                    Details = ex.Message
                });
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

        // =========================================================
        // CREATE
        // =========================================================

        [HttpPost("Create")]
        public async Task<IActionResult> Create(
            [FromBody] CreateDeliveryOrderRMARequest request)
        {
            try
            {
                var userId = User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value;

                if (!Guid.TryParse(userId, out Guid createdById))
                    return Unauthorized();

                // Generate RMA number if not supplied.
                string rmaNo = string.IsNullOrWhiteSpace(
                    request.DeliveryOrderRMANo)
                    ? await GenerateDORMANo()
                    : request.DeliveryOrderRMANo.Trim();

                bool exists = await _context.DeliveryOrderRMAs
                    .AnyAsync(x => x.DeliveryOrderRMANo == rmaNo);

                if (exists)
                    return BadRequest("RMA No already exists.");

                // Validate related records.
                if (request.DeliveryOrderId.HasValue)
                {
                    bool deliveryOrderExists = await _context.DeliveryOrders
                        .AnyAsync(x => x.Id == request.DeliveryOrderId.Value);

                    if (!deliveryOrderExists)
                        return BadRequest("Delivery Order not found.");
                }

                if (!await CompaniesExist(
                    request.SenderCompanyId,
                    request.ReceiverCompanyId))
                {
                    return BadRequest("Sender or receiver company not found.");
                }

                var now = DateTime.UtcNow;

                var rma = new DeliveryOrderRMA
                {
                    Id = Guid.NewGuid(),

                    DeliveryOrderRMANo = rmaNo,
                    DeliveryOrderId = request.DeliveryOrderId,

                    Date = request.Date ?? now,

                    ReturnType = request.ReturnType,
                    ReturnQuantity = request.ReturnQuantity,
                    ReturnMethod = request.ReturnMethod,
                    ReturnAction = request.ReturnAction,

                    SenderCompanyId = request.SenderCompanyId,
                    ReceiverCompanyId = request.ReceiverCompanyId,

                    Reason = request.Reason,
                    Remarks = request.Remarks,

                    Status = "Reported",

                    CreatedAt = now,
                    CreatedById = createdById
                };

                // RMA items.
                if (request.DORMAItems != null)
                {
                    rma.DORMAItems = request.DORMAItems
                        .Select(x => new DORMAItem
                        {
                            Id = Guid.NewGuid(),
                            DeliveryOrderRMAId = rma.Id,

                            SalesOrderItemId = x.SalesOrderItemId,
                            DeliveryOrderItemId = x.DeliveryOrderItemId,

                            Description = x.Description,
                            Quantity = x.Quantity,
                            Unit = x.Unit,
                            Condition = x.Condition,
                            Remarks = x.Remarks
                        })
                        .ToList();
                }

                // Proof images.
                if (request.DORMAProofImages != null)
                {
                    rma.DORMAProofImages = request.DORMAProofImages
                        .Where(x => !string.IsNullOrWhiteSpace(x.Url))
                        .Select(x => new DORMAProofImage
                        {
                            Id = Guid.NewGuid(),
                            DeliveryOrderRMAId = rma.Id,
                            Url = x.Url
                        })
                        .ToList();
                }

                // Initial status history.
                rma.DORMAStatusHistories.Add(
                    new DORMAStatusHistory
                    {
                        Id = Guid.NewGuid(),
                        RMAId = rma.Id,
                        Status = "Reported",
                        ActionAt = now,
                        ActionUserId = createdById,
                        Remarks = request.Remarks
                    });

                _context.DeliveryOrderRMAs.Add(rma);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("RMAAdded", new
                {
                    rma.Id,
                    rma.DeliveryOrderRMANo,
                    rma.DeliveryOrderId,
                    rma.Status
                });

                return Ok(new
                {
                    rma.Id,
                    rma.DeliveryOrderRMANo,
                    rma.Status
                });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to create RMA.",
                    Details = ex.InnerException?.Message ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to create RMA.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // UPDATE
        // =========================================================

        [HttpPut("Update")]
        public async Task<IActionResult> Update(
            [FromBody] UpdateDeliveryOrderRMARequest request)
        {
            try
            {
                var rma = await _context.DeliveryOrderRMAs
                    .Include(x => x.DORMAItems)
                    .Include(x => x.DORMAProofImages)
                    .FirstOrDefaultAsync(x => x.Id == request.Id);

                if (rma == null)
                    return NotFound("RMA not found.");

                string rmaNo = request.DeliveryOrderRMANo?.Trim() ?? "";

                if (string.IsNullOrWhiteSpace(rmaNo))
                    return BadRequest("RMA No is required.");

                bool duplicate = await _context.DeliveryOrderRMAs
                    .AnyAsync(x =>
                        x.Id != request.Id &&
                        x.DeliveryOrderRMANo == rmaNo);

                if (duplicate)
                    return BadRequest("RMA No already exists.");

                if (request.DeliveryOrderId.HasValue)
                {
                    bool deliveryOrderExists = await _context.DeliveryOrders
                        .AnyAsync(x => x.Id == request.DeliveryOrderId.Value);

                    if (!deliveryOrderExists)
                        return BadRequest("Delivery Order not found.");
                }

                if (!await CompaniesExist(
                    request.SenderCompanyId,
                    request.ReceiverCompanyId))
                {
                    return BadRequest("Sender or receiver company not found.");
                }

                // Main information.
                rma.DeliveryOrderRMANo = rmaNo;
                rma.DeliveryOrderId = request.DeliveryOrderId;
                rma.Date = request.Date;

                rma.ReturnType = request.ReturnType;
                rma.ReturnQuantity = request.ReturnQuantity;
                rma.ReturnMethod = request.ReturnMethod;
                rma.ReturnAction = request.ReturnAction;

                rma.SenderCompanyId = request.SenderCompanyId;
                rma.ReceiverCompanyId = request.ReceiverCompanyId;

                rma.Reason = request.Reason;
                rma.Remarks = request.Remarks;

                rma.UpdatedAt = DateTime.UtcNow;

                // Replace items only when the request includes the list.
                // Null preserves the existing items; an empty list clears them.
                if (request.DORMAItems != null)
                {
                    _context.DORMAItems.RemoveRange(rma.DORMAItems);

                    rma.DORMAItems = request.DORMAItems
                        .Select(x => new DORMAItem
                        {
                            Id = Guid.NewGuid(),
                            DeliveryOrderRMAId = rma.Id,

                            SalesOrderItemId = x.SalesOrderItemId,
                            DeliveryOrderItemId = x.DeliveryOrderItemId,

                            Description = x.Description,
                            Quantity = x.Quantity,
                            Unit = x.Unit,
                            Condition = x.Condition,
                            Remarks = x.Remarks
                        })
                        .ToList();
                }

                // Replace proof images only when the request includes the list.
                if (request.DORMAProofImages != null)
                {
                    _context.DORMAProofImages.RemoveRange(
                        rma.DORMAProofImages);

                    rma.DORMAProofImages = request.DORMAProofImages
                        .Where(x => !string.IsNullOrWhiteSpace(x.Url))
                        .Select(x => new DORMAProofImage
                        {
                            Id = Guid.NewGuid(),
                            DeliveryOrderRMAId = rma.Id,
                            Url = x.Url
                        })
                        .ToList();
                }

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("RMAUpdated", new
                {
                    rma.Id,
                    rma.DeliveryOrderRMANo,
                    rma.Status
                });

                return Ok(new
                {
                    rma.Id,
                    rma.DeliveryOrderRMANo,
                    rma.Status
                });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update RMA.",
                    Details = ex.InnerException?.Message ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update RMA.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // UPDATE STATUS
        // =========================================================

        [HttpPost("UpdateStatus/{id}")]
        public async Task<IActionResult> UpdateStatus(
            Guid id,
            [FromBody] UpdateRMAStatusRequest request)
        {
            try
            {
                var userId = User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value;

                if (!Guid.TryParse(userId, out Guid actionUserId))
                    return Unauthorized();

                if (string.IsNullOrWhiteSpace(request.Status))
                    return BadRequest("Status is required.");

                var rma = await _context.DeliveryOrderRMAs
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (rma == null)
                    return NotFound("RMA not found.");

                var now = DateTime.UtcNow;

                rma.Status = request.Status.Trim();
                rma.ActionUserId = actionUserId;

                rma.ActionUserName =
                    User.FindFirst(ClaimTypes.Name)?.Value
                    ?? User.Identity?.Name
                    ?? "Unknown";

                rma.Remarks = request.Remarks;
                rma.SignatureImage = request.SignatureImage;
                rma.UpdatedAt = now;

                var history = new DORMAStatusHistory
                {
                    Id = Guid.NewGuid(),
                    RMAId = rma.Id,
                    Status = rma.Status,
                    ActionAt = now,
                    ActionUserId = actionUserId,
                    Remarks = request.Remarks
                };

                _context.DORMAStatusHistories.Add(history);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync(
                    "RMAStatusUpdated",
                    new
                    {
                        rma.Id,
                        rma.DeliveryOrderRMANo,
                        rma.Status,
                        rma.ActionUserId,
                        rma.ActionUserName
                    });

                return Ok(new
                {
                    rma.Id,
                    rma.DeliveryOrderRMANo,
                    rma.Status,
                    rma.ActionUserId,
                    rma.ActionUserName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update RMA status.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // DELETE
        // =========================================================

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var rma = await _context.DeliveryOrderRMAs
                    .Include(x => x.DORMAItems)
                    .Include(x => x.DORMAProofImages)
                    .Include(x => x.DORMAStatusHistories)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (rma == null)
                    return NotFound("RMA not found.");

                _context.DORMAItems.RemoveRange(rma.DORMAItems);

                _context.DORMAProofImages.RemoveRange(
                    rma.DORMAProofImages);

                _context.DORMAStatusHistories.RemoveRange(
                    rma.DORMAStatusHistories);

                _context.DeliveryOrderRMAs.Remove(rma);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("RMADeleted", id);

                return Ok(new
                {
                    Message = "Deleted Successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to delete RMA.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // GENERATE RMA NUMBER
        // =========================================================

        private async Task<string> GenerateDORMANo()
        {
            int yearShort = DateTime.UtcNow.Year % 100;
            string yearText = yearShort.ToString("D2");

            const string prefix = "YL/DO-RMA/";

            var existingNumbers = await _context.DeliveryOrderRMAs
                .AsNoTracking()
                .Where(x =>
                    x.DeliveryOrderRMANo.StartsWith(prefix) &&
                    x.DeliveryOrderRMANo.EndsWith($"/{yearText}"))
                .Select(x => x.DeliveryOrderRMANo)
                .ToListAsync();

            int highestNumber = existingNumbers
                .Select(x => x.Split('/'))
                .Where(parts =>
                    parts.Length == 4 &&
                    int.TryParse(parts[2], out _))
                .Select(parts => int.Parse(
                    parts[2],
                    CultureInfo.InvariantCulture))
                .DefaultIfEmpty(0)
                .Max();

            int nextNumber = highestNumber + 1;

            return $"YL/DO-RMA/{nextNumber}/{yearText}";
        }

        [HttpGet("generate-no")]
        public async Task<IActionResult> GenerateDORMANoEndPoint()
        {
            try
            {
                var rmaNo = await GenerateDORMANo();

                return Ok(new
                {
                    RmaNo = rmaNo
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to generate RMA number.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // DROPDOWN
        // =========================================================

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDORMADropdown()
        {
            try
            {
                var deliveryOrders = await _context.DeliveryOrders
                    .AsNoTracking()
                    .Where(x => x.Status == "Accepted")
                    .OrderByDescending(x => x.CreatedAt)
                    .Select(x => new DODropdownDto
                    {
                        Id = x.Id,
                        DeliveryOrderNo = x.DeliveryOrderNo,

                        SalesOrderId = x.SalesOrderId,
                        ProjectId = x.ProjectId,

                        SenderCompanyId = x.SenderCompanyId,

                        SenderCompany = x.SenderCompany == null
                            ? null
                            : new CompanyDropdownItem
                            {
                                Id = x.SenderCompany.Id,
                                Name = x.SenderCompany.Name
                            }
                    })
                    .ToListAsync();

                var projects = await _context.Projects
                    .AsNoTracking()
                    .OrderByDescending(x => x.CreatedAt)
                    .Select(x => new ProjectDropdownDto
                    {
                        Id = x.Id,
                        ProjectCode = x.ProjectCode,
                        ProjectTitle = x.ProjectTitle
                    })
                    .ToListAsync();

                var companies = await _context.Companies
                    .AsNoTracking()
                    .OrderBy(x => x.Name)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync();

                var users = await _context.Users
                    .AsNoTracking()
                    .Where(x => x.JobTitle != "SuperAdmin")
                    .OrderBy(x => x.FullName)
                    .Select(x => new UserDto
                    {
                        Id = x.Id,
                        FullName = x.FullName,
                        DisplayName = x.DisplayName
                    })
                    .ToListAsync();

                return Ok(new DORMADropdownDto
                {
                    DeliveryOrders = deliveryOrders,
                    Projects = projects,
                    Companies = companies,
                    Users = users
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load dropdown.",
                    Details = ex.Message
                });
            }
        }

        // =========================================================
        // INCLUDE HELPER
        // =========================================================

        private static IQueryable<DeliveryOrderRMA> ApplyIncludes(
            IQueryable<DeliveryOrderRMA> query,
            string? includes)
        {
            if (string.IsNullOrWhiteSpace(includes))
                return query;

            foreach (var item in includes.Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries))
            {
                string name = item.Trim();

                if (AllowedIncludes.Contains(name))
                {
                    query = query.Include(name);
                }
            }

            return query;
        }

        // =========================================================
        // COMPANY VALIDATION
        // =========================================================

        private async Task<bool> CompaniesExist(
            Guid? senderCompanyId,
            Guid? receiverCompanyId)
        {
            var companyIds = new[] {
                senderCompanyId,
                receiverCompanyId
            }
            .Where(x => x.HasValue)
            .Select(x => x!.Value)
            .Distinct()
            .ToList();

            if (companyIds.Count == 0)
                return true;

            int count = await _context.Companies
                .CountAsync(x => companyIds.Contains(x.Id));

            return count == companyIds.Count;
        }

        // =========================================================
        // FILTER HELPER
        // =========================================================

        private static IQueryable<DeliveryOrderRMA> ApplyFilter(
            IQueryable<DeliveryOrderRMA> query,
            string filter)
        {
            var parameter = Expression.Parameter(
                typeof(DeliveryOrderRMA),
                "q");

            Expression? finalExpression = null;

            var orParts = filter.Split(
                '|',
                StringSplitOptions.RemoveEmptyEntries);

            foreach (var orPart in orParts)
            {
                Expression? orExpression = null;

                var andParts = orPart.Split(
                    ',',
                    StringSplitOptions.RemoveEmptyEntries);

                foreach (var andPart in andParts)
                {
                    string part = andPart.Trim();

                    bool isNotEqual = part.Contains("!=");

                    var kv = isNotEqual
                        ? part.Split("!=", 2)
                        : part.Split('=', 2);

                    if (kv.Length != 2)
                        throw new ArgumentException(
                            $"Invalid filter expression: {part}");

                    string propertyName = kv[0].Trim();
                    string valueStr = kv[1].Trim();

                    var propertyInfo = typeof(DeliveryOrderRMA).GetProperty(
                        propertyName,
                        BindingFlags.Public |
                        BindingFlags.Instance |
                        BindingFlags.IgnoreCase);

                    if (propertyInfo == null ||
                        !IsScalarProperty(propertyInfo.PropertyType))
                    {
                        throw new ArgumentException(
                            $"Invalid filter property: {propertyName}");
                    }

                    var propertyAccess = Expression.Property(
                        parameter,
                        propertyInfo);

                    Type propertyType = propertyInfo.PropertyType;

                    Type underlyingType =
                        Nullable.GetUnderlyingType(propertyType)
                        ?? propertyType;

                    Expression condition;

                    if (underlyingType == typeof(string))
                    {
                        var notNull = Expression.NotEqual(
                            propertyAccess,
                            Expression.Constant(null, propertyType));

                        var contains = Expression.Call(
                            propertyAccess,
                            typeof(string).GetMethod(
                                nameof(string.Contains),
                                new[] { typeof(string) })!,
                            Expression.Constant(valueStr));

                        // Null strings do not match Contains.
                        // For !=, null is considered not equal.
                        condition = isNotEqual
                            ? Expression.OrElse(
                                Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(null, propertyType)),
                                Expression.AndAlso(
                                    notNull,
                                    Expression.Not(contains)))
                            : Expression.AndAlso(notNull, contains);
                    }
                    else
                    {
                        object convertedValue;

                        try
                        {
                            if (underlyingType == typeof(Guid))
                            {
                                if (!Guid.TryParse(valueStr, out Guid guid))
                                    throw new FormatException();

                                convertedValue = guid;
                            }
                            else if (underlyingType.IsEnum)
                            {
                                convertedValue = Enum.Parse(
                                    underlyingType,
                                    valueStr,
                                    true);
                            }
                            else if (underlyingType == typeof(DateTime))
                            {
                                convertedValue = DateTime.Parse(
                                    valueStr,
                                    CultureInfo.InvariantCulture,
                                    DateTimeStyles.RoundtripKind);
                            }
                            else if (underlyingType == typeof(DateTimeOffset))
                            {
                                convertedValue = DateTimeOffset.Parse(
                                    valueStr,
                                    CultureInfo.InvariantCulture,
                                    DateTimeStyles.RoundtripKind);
                            }
                            else
                            {
                                convertedValue = Convert.ChangeType(
                                    valueStr,
                                    underlyingType,
                                    CultureInfo.InvariantCulture);
                            }
                        }
                        catch
                        {
                            throw new ArgumentException(
                                $"Invalid value '{valueStr}' for {propertyName}.");
                        }

                        var constant = Expression.Constant(
                            convertedValue,
                            underlyingType);

                        Expression right = propertyType == underlyingType
                            ? constant
                            : Expression.Convert(constant, propertyType);

                        condition = isNotEqual
                            ? Expression.NotEqual(propertyAccess, right)
                            : Expression.Equal(propertyAccess, right);
                    }

                    orExpression = orExpression == null
                        ? condition
                        : Expression.AndAlso(
                            orExpression,
                            condition);
                }

                if (orExpression != null)
                {
                    finalExpression = finalExpression == null
                        ? orExpression
                        : Expression.OrElse(
                            finalExpression,
                            orExpression);
                }
            }

            if (finalExpression != null)
            {
                var lambda =
                    Expression.Lambda<Func<DeliveryOrderRMA, bool>>(
                        finalExpression,
                        parameter);

                query = query.Where(lambda);
            }

            return query;
        }

        // =========================================================
        // PROPERTY VALIDATION
        // =========================================================

        private static bool IsScalarProperty(Type type)
        {
            type = Nullable.GetUnderlyingType(type) ?? type;

            return type.IsPrimitive
                || type.IsEnum
                || type == typeof(string)
                || type == typeof(decimal)
                || type == typeof(Guid)
                || type == typeof(DateTime)
                || type == typeof(DateTimeOffset)
                || type == typeof(TimeSpan);
        }
    }
}
