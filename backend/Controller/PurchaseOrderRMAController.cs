using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using System.Text.Json;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseOrderRMAController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public PurchaseOrderRMAController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.PurchaseOrderRMAs.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(PurchaseOrderRMA), "q");
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
                        var lambda = Expression.Lambda<Func<PurchaseOrderRMA, bool>>(finalExpression, parameter);
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
                IQueryable<PurchaseOrderRMA> query = _context.PurchaseOrderRMAs.AsQueryable();

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
                    data.PurchaseOrderRMANo,
                    data.PurchaseOrderId,
                    data.GoodsReceivingId,
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
                    PORMAItems = data.PORMAItems?.Select(i => new
                    {
                        i.Id,
                        i.PurchaseOrderRMAId,
                        i.PurchaseOrderItemId,
                        i.GoodsReceivedItemId,
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
        public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderRMARequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var exists = await _context.PurchaseOrderRMAs
                .AnyAsync(x => x.PurchaseOrderRMANo == request.PurchaseOrderRMANo);

            if (exists)
                return BadRequest("RMA No already exists");

            var rma = new PurchaseOrderRMA
            {
                Id = Guid.NewGuid(),
                PurchaseOrderRMANo = request.PurchaseOrderRMANo,
                PurchaseOrderId = request.PurchaseOrderId,
                GoodsReceivingId = request.GoodsReceivingId,
                Date = request.Date ?? DateTime.UtcNow,
                ReturnMethod = request.ReturnMethod,
                ReturnType = request.ReturnType,
                ReturnQuantity = request.ReturnQuantity,
                ReturnAction = request.ReturnAction,
                SenderCompanyId = request.SenderCompanyId,
                ReceiverCompanyId = request.ReceiverCompanyId,
                Reason = request.Reason,
                Remarks = request.Remarks,
                Status = "Prepared",
                CreatedAt = DateTime.UtcNow,
                CreatedById = Guid.Parse(userId)
            };

            if (request.PORMAItems != null)
            {
                rma.PORMAItems = request.PORMAItems.Select(x => new PORMAItem
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderRMAId = rma.Id,
                    PurchaseOrderItemId = x.PurchaseOrderItemId,
                    GoodsReceivedItemId = x.GoodsReceivedItemId,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    Condition = x.Condition,
                    Remarks = x.Remarks
                }).ToList();
            }

            _context.PurchaseOrderRMAs.Add(rma);
            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("PORMAAdded", rma);

            return Ok(rma);
        }

        private async Task<string> GeneratePORMANo()
        {
            var yearShort = DateTime.UtcNow.Year % 100; // 2026 -> 26

            var lastRMA = await _context.PurchaseOrderRMAs
                .Where(q => q.PurchaseOrderRMANo.StartsWith($"YL/PO-RMA/") && q.PurchaseOrderRMANo.EndsWith($"/{yearShort}"))
                .OrderByDescending(q => q.CreatedAt)
                .Select(q => q.PurchaseOrderRMANo)
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

            return $"YL/PO-RMA/{nextNumber}/{yearShort}";
        }

        [HttpGet("generate-no")]
        public async Task<IActionResult> GeneratePurchaseOrderRMANoEndpoint()
        {
            var purchaseOrderRMANo = await GeneratePORMANo();
            return Ok(new { purchaseOrderRMANo });

        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] UpdatePurchaseOrderRMARequest request)
        {
            var rma = await _context.PurchaseOrderRMAs
                .Include(x => x.PORMAItems)
                .Include(x => x.PORMAProofImages)
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (rma == null)
                return NotFound();

            rma.PurchaseOrderRMANo = request.PurchaseOrderRMANo;
            rma.PurchaseOrderId = request.PurchaseOrderId;
            rma.GoodsReceivingId = request.GoodsReceivingId;
            rma.Date = request.Date;
            rma.ReturnMethod = request.ReturnMethod;
            rma.ReturnType = request.ReturnType;
            rma.ReturnQuantity = request.ReturnQuantity;
            rma.ReturnAction = request.ReturnAction;
            rma.SenderCompanyId = request.SenderCompanyId;
            rma.ReceiverCompanyId = request.ReceiverCompanyId;
            rma.Reason = request.Reason;
            rma.Remarks = request.Remarks;
            rma.UpdatedAt = DateTime.UtcNow;

            _context.PORMAItems.RemoveRange(rma.PORMAItems);

            if (request.PORMAItems != null)
            {
                rma.PORMAItems = request.PORMAItems.Select(x => new PORMAItem
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderRMAId = rma.Id,
                    PurchaseOrderItemId = x.PurchaseOrderItemId,
                    GoodsReceivedItemId = x.GoodsReceivedItemId,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit,
                    Condition = x.Condition,
                    Remarks = x.Remarks
                }).ToList();
            }

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("PORMAUpdated", rma);

            return Ok(rma);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var rma = await _context.PurchaseOrderRMAs
                .Include(x => x.PORMAItems)
                .Include(x => x.PORMAProofImages)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (rma == null)
                return NotFound();

            _context.PORMAItems.RemoveRange(rma.PORMAItems);
            _context.PORMAProofImages.RemoveRange(rma.PORMAProofImages);
            _context.PurchaseOrderRMAs.Remove(rma);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("PORMADeleted", id);

            return Ok("Deleted");
        }

        private object MapToDto(PurchaseOrderRMA q)
        {
            var items = q.PORMAItems ?? new List<PORMAItem>();

            return new
            {
                q.Id,
                q.PurchaseOrderRMANo,
                q.PurchaseOrderId,
                q.GoodsReceivingId,
                q.Date,
                q.ReturnType,
                q.ReturnQuantity,
                q.ReturnMethod,
                q.ReturnAction,
                q.SenderCompanyId,
                q.ReceiverCompanyId,
                ReceiverCompany = q.ReceiverCompany == null ? null : new
                {
                    q.ReceiverCompany.Name
                },

                q.Reason,
                q.Remarks,
                q.Status,
                q.ActionUserId,
                q.ActionUserName,
                PORMAItems = items.ToList(),
                PORMAProofImages = q.PORMAProofImages.Select(i => new
                {
                    i.Id,
                    i.PurchaseOrderRMAId,
                    i.Url,
                })
            };
        }

        [HttpPost("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateRMAStatusRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var rma = await _context.PurchaseOrderRMAs.FirstOrDefaultAsync(x => x.Id == id);

            if (rma == null)
                return NotFound();

            rma.Status = request.Status;
            rma.ActionUserId = Guid.Parse(userId);
            rma.ActionUserName = request.ActionUserName;
            rma.Remarks = request.Remarks;
            rma.StatusUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(rma);
        }
        private string GenerateStatusRemark(string status, string userName)
        {
            return status switch
            {
                "Reviewed" => $"PO reviewed by {userName}",
                "Approved" => $"PO approved by {userName}",
                "Rejected" => $"PO rejected by {userName}",
                "Sent" => $"PO sent by {userName} to supplier",
                _ => $"PO updated to {status} by {userName}"
            };
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetPODropdown()
        {
            try
            {
                var quotation = await _context.Quotations
    .Include(x => x.FromCompany)
    .Include(x => x.Project)
    .Where(x => x.Status == "Accepted")
    .OrderByDescending(x => x.CreatedAt)
    .Select(x => new QuotationDropdownDto
    {
        Id = x.Id,
        QuotationNo = x.QuotationNo,
        FromCompanyId = x.FromCompanyId,
        CompanyName = x.FromCompany != null ? x.FromCompany.Name : null
    })
    .ToListAsync();

                var projects = await _context.Projects
                    .OrderByDescending(x => x.CreatedAt)
                    .Select(x => new ProjectDropdownItem
                    {
                        Id = x.Id,
                        ProjectCode = x.ProjectCode,
                        ProjectTitle = x.ProjectTitle,
                    })
                    .ToListAsync();

                var clients = await _context.Companies
               .Where(x => x.Type == CompanyType.Client)
               .Select(x => new CompanyDropdownItem
               {
                   Id = x.Id,
                   Name = x.Name
               })
               .ToListAsync();

                var suppliers = await _context.Companies
                    .Where(x => x.Type == CompanyType.Supplier)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync();


                var companies = await _context.Companies
                    .Where(x => x.Type == CompanyType.Own)
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
                    }).ToListAsync();

                return Ok(new PurchaseOrderDropdownDto
                {
                    Quotations = quotation,
                    Projects = projects,
                    Companies = companies,
                    Suppliers = suppliers,
                    Clients = clients,
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
