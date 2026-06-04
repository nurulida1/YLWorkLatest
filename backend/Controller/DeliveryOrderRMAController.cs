using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveryOrderRMAController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public DeliveryOrderRMAController(
            AppDbContext context,
            IHubContext<NotificationHub> hub)
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
                var query = _context.DeliveryOrderRMAs.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(DeliveryOrderRMA), "q");
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
                        var lambda = Expression.Lambda<Func<DeliveryOrderRMA, bool>>(finalExpression, parameter);
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
                IQueryable<DeliveryOrderRMA> query = _context.DeliveryOrderRMAs.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

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

                var data = await query.FirstOrDefaultAsync();

                if (data == null)
                    return NotFound();

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
                    data.ActionUserId,
                    data.ActionUserName,
                    data.SignatureImage,
                    DORMAItems = data.DORMAItems?.Select(i => new
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
        public async Task<IActionResult> Create([FromBody] CreateDeliveryOrderRMARequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var exists = await _context.DeliveryOrderRMAs
                .AnyAsync(x => x.DeliveryOrderRMANo == request.DeliveryOrderRMANo);

            if (exists)
                return BadRequest("RMA No already exists");

            var rma = new DeliveryOrderRMA
            {
                Id = Guid.NewGuid(),
                DeliveryOrderRMANo = request.DeliveryOrderRMANo ?? await GenerateDORMANo(),
                DeliveryOrderId = request.DeliveryOrderId,
                Date = request.Date ?? DateTime.UtcNow,
                ReturnMethod = request.ReturnMethod,
                ReturnType = request.ReturnType,
                ReturnQuantity = request.ReturnQuantity,
                ReturnAction = request.ReturnAction,
                SenderCompanyId = request.SenderCompanyId,
                ReceiverCompanyId = request.ReceiverCompanyId,
                Reason = request.Reason,
                Remarks = request.Remarks,
                Status = "Reported",
                CreatedAt = DateTime.UtcNow,
                CreatedById = Guid.Parse(userId)
            };

            if (request.DORMAItems != null)
            {
                rma.DORMAItems = request.DORMAItems.Select(x => new DORMAItem
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderRMAId = rma.Id,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    Condition = x.Condition,
                    Remarks = x.Remarks
                }).ToList();
            }

            if (request.DORMAProofImages != null)
            {
                rma.DORMAProofImages = request.DORMAProofImages.Select(x => new DORMAProofImage
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderRMAId = rma.Id,
                    Url = x.Url
                }).ToList();
            }

            _context.DeliveryOrderRMAs.Add(rma);
            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("RMAAdded", rma);

            return Ok(rma);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] UpdateDeliveryOrderRMARequest request)
        {
            var rma = await _context.DeliveryOrderRMAs
                .Include(x => x.DORMAItems)
                .Include(x => x.DORMAProofImages)
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (rma == null)
                return NotFound();

            rma.DeliveryOrderRMANo = request.DeliveryOrderRMANo;
            rma.ReturnType = request.ReturnType;
            rma.ReturnQuantity = request.ReturnQuantity;
            rma.ReturnAction = request.ReturnAction;
            rma.SenderCompanyId = request.SenderCompanyId;
            rma.ReceiverCompanyId = request.ReceiverCompanyId;
            rma.Reason = request.Reason;
            rma.Remarks = request.Remarks;
            rma.UpdatedAt = DateTime.UtcNow;

            _context.DORMAItems.RemoveRange(rma.DORMAItems);
            _context.DORMAProofImages.RemoveRange(rma.DORMAProofImages);

            if (request.DORMAItems != null)
            {
                rma.DORMAItems = request.DORMAItems.Select(x => new DORMAItem
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderRMAId = rma.Id,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    Condition = x.Condition,
                    Remarks = x.Remarks
                }).ToList();
            }

            if (request.DORMAProofImages != null)
            {
                rma.DORMAProofImages = request.DORMAProofImages.Select(x => new DORMAProofImage
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderRMAId = rma.Id,
                    Url = x.Url
                }).ToList();
            }

            await _context.SaveChangesAsync();
            await _hub.Clients.All.SendAsync("RMAUpdated", rma);

            return Ok(rma);
        }

        [HttpPost("UpdateStatus/{id}")] 
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateRMAStatusRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var rma = await _context.DeliveryOrderRMAs.FirstOrDefaultAsync(x => x.Id == id);
            if (rma == null)
                return NotFound();

            rma.Status = request.Status;
            rma.ActionUserId = Guid.Parse(userId);
            rma.ActionUserName = request.ActionUserName;
            rma.Remarks = request.Remarks;
            rma.SignatureImage = request.SignatureImage; 

            _context.DORMAStatusHistories.Add(new DORMAStatusHistory
            {
                Id = Guid.NewGuid(),
                RMAId = rma.Id,
                Status = request.Status,
                ActionUserId = Guid.Parse(userId),
                Remarks = request.Remarks,
                ActionAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("RMAStatusUpdated", new { rma.Id, rma.Status });

            return Ok(rma);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var rma = await _context.DeliveryOrderRMAs
                .Include(x => x.DORMAItems)
                .Include(x => x.DORMAProofImages)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (rma == null)
                return NotFound();

            _context.DORMAItems.RemoveRange(rma.DORMAItems);
            _context.DORMAProofImages.RemoveRange(rma.DORMAProofImages);
            _context.DeliveryOrderRMAs.Remove(rma);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("RMADeleted", id);

            return Ok(new { Message = "Deleted Successfully" });
        }


        private async Task<string> GenerateDORMANo()
        {
            var yearShort = DateTime.UtcNow.Year % 100; // 2026 -> 26

            var lastRMA = await _context.DeliveryOrderRMAs
                .Where(q => q.DeliveryOrderRMANo.StartsWith($"YL/DO-RMA/") && q.DeliveryOrderRMANo.EndsWith($"/{yearShort}"))
                .OrderByDescending(q => q.CreatedAt)
                .Select(q => q.DeliveryOrderRMANo)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (!string.IsNullOrEmpty(lastRMA))
            {
                var parts = lastRMA.Split('/');
                if (parts.Length >= 3 && int.TryParse(parts[2], out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"YL/DO-RMA/{nextNumber}/{yearShort}";
        }


        [HttpGet("generate-no")]
        public async Task<IActionResult> GenerateDORMANoEndPoint()
        {
            var rmaNo = await GenerateDORMANo();
            return Ok(new { rmaNo });

        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDORMADropdown()
        {
            try
            {
                var deliveryOrders = await _context.DeliveryOrders
     .Where(x => x.Status == "Accepted")
     .OrderByDescending(x => x.CreatedAt)
     .Select(x => new DODropdownDto
     {
         Id = x.Id,
         DeliveryOrderNo = x.DeliveryOrderNo,

         SalesOrderId = x.SalesOrderId,
         ProjectId = x.ProjectId,

         SenderCompanyId = x.SenderCompanyId,

         SenderCompany = x.SenderCompany == null ? null : new CompanyDropdownItem
         {
             Id = x.SenderCompany.Id,
             Name = x.SenderCompany.Name
         }
     })
     .ToListAsync();

                var projects = await _context.Projects
                    .OrderByDescending(x => x.CreatedAt)
                    .Select(x => new ProjectDropdownDto
                    {
                        Id = x.Id,
                        ProjectCode = x.ProjectCode,
                        ProjectTitle = x.ProjectTitle
                    })
                    .ToListAsync();

                var companies = await _context.Companies
                    .OrderBy(x => x.Name)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync();

                var users = await _context.Users
                    .Where(x => x.JobTitle != "SuperAdmin")
                    .OrderBy(x => x.FullName)
                    .Select(x => new UserDto
                    {
                        Id = x.Id,
                        FullName = x.FullName,
                        DisplayName = x.DisplayName,
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
                    Error = "Failed to load dropdown",
                    Details = ex.Message
                });
            }
        }
    }
}