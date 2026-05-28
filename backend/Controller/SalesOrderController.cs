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
    public class SalesOrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public SalesOrderController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.SalesOrders.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(SalesOrder), "q");
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
                        var lambda = Expression.Lambda<Func<SalesOrder, bool>>(finalExpression, parameter);
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
                IQueryable<SalesOrder> query = _context.SalesOrders.AsQueryable();

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
                    data.SalesOrderNo,
                    data.SODate,
                    data.Status,
                    data.TotalAmount,
                    data.ClientId,
                    data.CompanyId,
                    data.QuotationId,
                    data.Remarks,
                    data.Notes,
                    data.ProjectId,
                    data.ClientPONumber,
                    data.ClientPODate,
                    data.ClientPOAttachment,
                    Quotation = data.Quotation == null
        ? null
        : new
        {
            data.Quotation.Id,
            data.Quotation.QuotationNo
        },

                    SalesOrderItems = data.SalesOrderItems?.Select(i => new
                    {
                        i.Id,
                        i.SalesOrderId,
                        i.Item,
                        i.Description,
                        i.Quantity,
                        i.UnitPrice,
                        i.Unit,
                        i.TotalPrice,
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
        public async Task<ActionResult<object>> Create([FromForm] CreateSalesOrderRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });

            if (string.IsNullOrWhiteSpace(request.SalesOrderNo))
                return BadRequest(new { Error = "Sales Order No is required for finalized records." });

            var itemsJson = Request.Form["salesOrderItems"].FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(itemsJson))
            {
                try
                {
                    request.SalesOrderItems =
                        JsonSerializer.Deserialize<List<SOItemBase>>(
                            itemsJson,
                            new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            }
                        );
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        Error = "Invalid salesOrderItems JSON",
                        RawValue = itemsJson,
                        Details = ex.Message
                    });
                }
            }

            var exists = await _context.SalesOrders
    .AnyAsync(x => x.SalesOrderNo == request.SalesOrderNo);

            if (exists)
            {
                return Ok(new
                {
                    success = false,
                    message = "Sales Order No already exists."
                });
            }

            try
            {
                string? filePath = null;

                if (request.ClientPOAttachment != null)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "SO");

                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.ClientPOAttachment.FileName)}";
                    var fullPath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await request.ClientPOAttachment.CopyToAsync(stream);
                    }

                    filePath = $"Uploads/SO/{fileName}";
                }

                var so = new SalesOrder
                {
                    Id = Guid.NewGuid(),
                    SalesOrderNo = request.SalesOrderNo ?? await GenerateSONo(),
                    CompanyId = request.CompanyId,
                    SODate = request.SODate,
                    ClientId = request.ClientId,
                    QuotationId = request.QuotationId,
                    ProjectId = request.ProjectId,

                    ClientPONumber = request.ClientPONumber,
                    ClientPODate = request.ClientPODate,

                    TotalAmount = request.TotalAmount,
                    Notes = request.Notes,
                    Remarks = request.Remarks,
                    Terms = request.Terms,
                    ClientPOAttachment = filePath,
                    Status = "Draft",
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTimeHelper.Now()
                };

                so.SalesOrderItems = request.SalesOrderItems?.Select(x => new SalesOrderItem
                {
                    Id = Guid.NewGuid(),
                    SalesOrderId = so.Id,

                    Type = x.Type ?? "Item",      
                    IsGroup = x.IsGroup,
                    SortOrder = x.SortOrder,

                    Description = x.Description,
                    Quantity = x.Quantity,
                    Unit = x.Unit ?? "Unit",
                    UnitPrice = x.UnitPrice,
                    TotalPrice = x.TotalPrice
                }).ToList() ?? new List<SalesOrderItem>();

                var statusHistory = new SalesOrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    SalesOrderId = so.Id,
                    Status = "Draft",
                    ActionAt = DateTimeHelper.Now(),
                    ActionUserId = Guid.Parse(userIdClaim),
                    Remarks = "SO created",
                };

                _context.SalesOrders.Add(so);
                _context.SalesOrderStatusHistories.Add(statusHistory);

                await _context.SaveChangesAsync();

                var soWithRelations = await _context.SalesOrders
                    .Include(x => x.Client)
                        .ThenInclude(c => c.BillingAddress)
                    .Include(x => x.Client)
                        .ThenInclude(c => c.DeliveryAddress)
                    .Include(x => x.Project)
                    .Include(x => x.Quotation)
                    .Include(x => x.SalesOrderItems)
                    .FirstOrDefaultAsync(x => x.Id == so.Id);

                var result = MapToDto(soWithRelations);
                await _hub.Clients.All.SendAsync("SalesOrderAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to create.",
                    Details = ex.Message,
                    Inner = ex.InnerException?.Message
                });
            }
        }

        private async Task<string> GenerateSONo()
        {
            var yearShort = DateTime.UtcNow.Year % 100; 

            var lastSO = await _context.SalesOrders
                .Where(q => q.SalesOrderNo.Contains($"YL/SO/") && q.SalesOrderNo.EndsWith($"/{yearShort}"))
                .OrderByDescending(q => q.CreatedAt)
                .Select(q => q.SalesOrderNo)
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

        [HttpGet("generate-no")]
        public async Task<IActionResult> GenerateSalesOrderNoEndpoint()
        {
            var salesOrderNo = await GenerateSONo();
            return Ok(new { salesOrderNo });

        }

        [HttpPut("Update")]
        public async Task<ActionResult<object>> Update([FromForm] UpdateSalesOrderRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var so = await _context.SalesOrders
    .Include(x => x.Client)
        .ThenInclude(c => c.BillingAddress)
    .Include(x => x.Client)
        .ThenInclude(c => c.DeliveryAddress)
    .Include(x => x.Project)
    .Include(x => x.Quotation)
    .Include(x => x.SalesOrderItems)
    .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (so == null)
                return NotFound(new { Error = "Sales Order not found." });

            try
            {
                var itemsJson = Request.Form["salesOrderItems"].FirstOrDefault();

                List<SOItemBase>? items = null;

                if (!string.IsNullOrWhiteSpace(itemsJson))
                {
                    items = JsonSerializer.Deserialize<List<SOItemBase>>(
                        itemsJson,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                }

                so.SalesOrderNo = request.SalesOrderNo;
                so.CompanyId = request.CompanyId;
                so.SODate = request.SODate;
                so.ClientId = request.ClientId;
                so.QuotationId = request.QuotationId;
                so.ProjectId = request.ProjectId;
                so.TotalAmount = request.TotalAmount;
                so.Notes = request.Notes;
                so.Remarks = request.Remarks;
                so.Terms = request.Terms;
                so.ClientPONumber = request.ClientPONumber;
                so.ClientPODate = request.ClientPODate;
                so.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();

                var existingItems = await _context.SalesOrderItems
                    .Where(x => x.SalesOrderId == so.Id)
                    .ToListAsync();

                _context.SalesOrderItems.RemoveRange(existingItems);
                await _context.SaveChangesAsync();

                var newItems = items?
                    .Select(x => new SalesOrderItem
                    {
                        Id = Guid.NewGuid(),
                        SalesOrderId = so.Id,
                        ParentId = x.ParentId,
                        SortOrder = x.SortOrder,
                        Type = x.Type,
                        IsGroup = x.IsGroup,
                        Item = x.Item,
                        Description = x.Description,
                        Quantity = x.Quantity ?? 0,
                        Unit = x.Unit,
                        UnitPrice = x.UnitPrice ?? 0,
                        Discount = x.Discount ?? 0,
                        TotalPrice = x.TotalPrice ?? 0
                    })
                    .ToList() ?? new();

                await _context.SalesOrderItems.AddRangeAsync(newItems);
                await _context.SaveChangesAsync();

                await UpdateSalesOrderStatusAsync(so.Id);

                var result = MapToDto(so);

                await _hub.Clients.All.SendAsync("SalesOrderUpdated", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update sales order.",
                    Details = ex.Message,
                    Inner = ex.InnerException?.Message
                });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteSalesOrder([FromQuery] Guid id)
        {
            var so = await _context.SalesOrders.FindAsync(id);
            if (so == null)
                return NotFound(new { Error = "Sales Order not found." });

            try
            {
                var items = await _context.SalesOrderItems
    .Where(x => x.SalesOrderId == id)
    .ToListAsync();

                _context.SalesOrderItems.RemoveRange(items);
                _context.SalesOrders.Remove(so);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("SalesOrderDeleted", id);

                return Ok(new { Message = "Sales order deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete sales order." });
            }
        }

        private object MapToDto(SalesOrder q)
        {
            var items = q.SalesOrderItems ?? new List<SalesOrderItem>();

            return new
            {
                q.Id,
                q.SalesOrderNo,
                q.SODate,
                q.ProjectId,
                Project = q.Project == null ? null : new
                {
                    q.Project.ProjectCode
                },
                q.QuotationId,

                Quotation = q.Quotation == null ? null : new
                {
                    q.Quotation.QuotationNo
                },
                q.CompanyId,
                Company = q.Company == null ? null : new
                {
                    Name = q.Company.Name
                },
                q.TotalAmount,
                q.Remarks,
                q.Notes,
                q.Status,
                q.Terms,
                q.ClientPOAttachment,
                q.ClientPONumber,
                q.ClientPODate,
                q.ClientId,
                Client = q.Client == null ? null : new
                {
                    Id = q.Client.Id,
                    q.Client.Name,
                    q.Client.ContactNo,
                    q.Client.Email,
                    q.Client.ContactPerson1,

                    BillingAddress = q.Client.BillingAddress == null ? null : new Address
                    {
                        Id = q.Client.BillingAddress.Id,
                        AddressLine1 = q.Client.BillingAddress.AddressLine1,
                        AddressLine2 = q.Client.BillingAddress.AddressLine2,
                        City = q.Client.BillingAddress.City,
                        State = q.Client.BillingAddress.State,
                        Country = q.Client.BillingAddress.Country,
                        Poscode = q.Client.BillingAddress.Poscode
                    },

                    DeliveryAddress = q.Client.DeliveryAddress == null ? null : new Address
                    {
                        Id = q.Client.DeliveryAddress.Id,
                        AddressLine1 = q.Client.DeliveryAddress.AddressLine1,
                        AddressLine2 = q.Client.DeliveryAddress.AddressLine2,
                        City = q.Client.DeliveryAddress.City,
                        State = q.Client.DeliveryAddress.State,
                        Country = q.Client.DeliveryAddress.Country,
                        Poscode = q.Client.DeliveryAddress.Poscode
                    }
                },
                SalesOrderItems = items.Select(x => new
                {
                    x.Id,
                    x.Item,
                    x.Description,
                    x.Quantity,
                    x.Unit,
                    x.UnitPrice,
                    x.TotalPrice
                })
            };
        }

        private SalesOrderItem MapToEntity(SOItemBase req, Guid soId)
        {
            var entity = new SalesOrderItem
            {
                Id = Guid.NewGuid(),
                SalesOrderId = soId,
                Item = req.Item,
                Description = req.Description,
                Quantity = req.Quantity,
                Unit = req.Unit,
                UnitPrice = req.UnitPrice,
                Discount = req.Discount,
                TotalPrice = req.TotalPrice,
            };

            return entity;
        }

        [HttpPut("Approve")]
        public async Task<IActionResult> Approve([FromBody] UpdateSalesOrderStatusRequest request)
        {
            if (request.Id == Guid.Empty)
                return BadRequest(new { Error = "Invalid request." });

            request.Status = "Confirmed";
            request.Remarks ??= "SO approved";

            return await UpdateStatusInternal(request);
        }

        [HttpPut("Reject")]
        public async Task<IActionResult> Reject([FromBody] UpdateSalesOrderStatusRequest request)
        {
            if (request.Id == Guid.Empty)
                return BadRequest(new { Error = "Invalid request." });

            if (string.IsNullOrWhiteSpace(request.Remarks))
                return BadRequest(new { Error = "Rejection reason is required." });

            request.Status = "Rejected";

            return await UpdateStatusInternal(request);
        }

        private async Task<IActionResult> UpdateStatusInternal(UpdateSalesOrderStatusRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var actionUserId = Guid.Parse(userIdClaim);

            var userName = await _context.Users
                .Where(x => x.Id == actionUserId)
                .Select(x => x.FullName ?? "System")
                .FirstOrDefaultAsync();

            var so = await _context.SalesOrders.FirstOrDefaultAsync(x => x.Id == request.Id);

            if (so == null)
                return NotFound(new { Error = "Sales Order not found." });

            if (so.Status == "Confirmed" || so.Status == "Rejected")
                return BadRequest(new { Error = "This SO is already finalized." });

            so.Status = request.Status;

            _context.SalesOrders.Update(so);

            var history = new SalesOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                SalesOrderId = request.Id,
                Status = request.Status,
                ActionUserId = actionUserId,
                ActionAt = DateTimeHelper.Now(),
                Remarks = request.Remarks ?? GenerateStatusRemark(request.Status, userName ?? "System")
            };

            _context.SalesOrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("SalesOrderStatusUpdated", new
            {
                so.Id,
                so.Status
            });

            return Ok(new
            {
                so.Id,
                so.Status,
                Message = "Status updated successfully"
            });
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateSalesOrderStatusRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            if (request.Id == Guid.Empty || string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { Error = "Invalid request." });

            if (request.Status == "Rejected" && string.IsNullOrWhiteSpace(request.Remarks))
            {
                return BadRequest(new { Error = "Rejection reason is required." });
            }

            var actionUserId = Guid.Parse(userIdClaim);

            var userName = await _context.Users
                .Where(x => x.Id == actionUserId)
                .Select(x => x.FullName ?? "System")
                .FirstOrDefaultAsync();

            var so = await _context.SalesOrders.FirstOrDefaultAsync(x => x.Id == request.Id);

            if (so == null)
                return NotFound();

            if (so.Status == "Confirmed" || so.Status == "Rejected")
            {
                return BadRequest(new { Error = "This SO is already finalized." });
            }

            so.Status = request.Status;

            _context.SalesOrders.Update(so);

            var history = new SalesOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                SalesOrderId = request.Id,
                Status = request.Status,
                ActionUserId = actionUserId,
                ActionAt = DateTimeHelper.Now(),
                Remarks = request.Remarks ?? GenerateStatusRemark(request.Status, userName ?? "System")
            };

            _context.SalesOrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("SalesOrderStatusUpdated", new
            {
                so.Id,
                so.Status
            });

            return Ok(new
            {
                so.Id,
                so.Status,
                Message = "Status updated successfully"
            });
        }

        private string GenerateStatusRemark(string status, string userName)
        {
            return status switch
            {
                "Reviewed" => $"SO reviewed by {userName}",
                "Approved" => $"SO approved by {userName}",
                "Rejected" => $"SO rejected by {userName}",
                "Sent" => $"SO sent by {userName} to supplier",
                _ => $"SO updated to {status} by {userName}"
            };
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetSODropdown()
        {
            try
            {
                var quotationsData = await _context.Quotations
                    .Include(x => x.FromCompany)
                    .Include(x => x.Client)
                    .Include(x => x.Project)
                    .Include(x => x.QuotationItems)
                        .ThenInclude(x => x.Children)
                    .Where(x => x.Status == "Accepted")
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();


                var quotation = quotationsData.Select(x => new QuotationDropdownDto
                {
                    Id = x.Id,
                    QuotationNo = x.QuotationNo,
                    ClientId = x.ClientId,
                    TotalAmount = x.TotalAmount,
                    FromCompanyId = x.FromCompanyId,
                    CompanyName = x.FromCompany?.Name,

                    Items = MapItems(
                        x.QuotationItems
                            .Where(i => i.ParentId == null) 
                            .OrderBy(i => i.SortOrder)
                            .ToList()
                    )
                }).ToList();


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
                    })
                    .ToListAsync();


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

        private static List<QuotationItemDto> MapItems(List<QuotationItems> items)
        {
            if (items == null || items.Count == 0)
                return new List<QuotationItemDto>();

            return items
                .OrderBy(x => x.SortOrder)
                .Select(i => new QuotationItemDto
                {
                    Id = i.Id,
                    SortOrder = i.SortOrder,
                    Type = i.Type,
                    IsGroup = i.IsGroup,
                    Description = i.Description,
                    Unit = i.Unit,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice,

                    Children = MapItems(
                        i.Children?.ToList() ?? new List<QuotationItems>()
                    )
                })
                .ToList();
        }

        private async Task UpdateSalesOrderFromPOAsync(Guid purchaseOrderId)
        {
            var po = await _context.PurchaseOrders
                .FirstOrDefaultAsync(x => x.Id == purchaseOrderId);

            if (po == null) return;

            var salesOrders = await _context.SalesOrders
                .Where(x => x.QuotationId == po.QuotationId)
                .ToListAsync();

            foreach (var so in salesOrders)
            {
                await UpdateSalesOrderStatusAsync(so.Id);
            }
        }

        private static readonly string[] ManualStatuses =
{
    "Draft",
    "Submitted",
    "Reviewed",
    "Approved",
    "Rejected",
    "Cancelled"
};

        private async Task UpdateSalesOrderStatusAsync(Guid salesOrderId)
        {
            var so = await _context.SalesOrders
                .Include(x => x.SalesOrderItems)
                .FirstOrDefaultAsync(x => x.Id == salesOrderId);

            if (so == null) return;

            if (ManualStatuses.Contains(so.Status))
                return;

            var items = so.SalesOrderItems;

            if (items == null || !items.Any())
            {
                so.Status = "Draft";
            }
            else
            {
                bool allDelivered = items.All(x => x.QuantityDelivered >= x.Quantity);
                bool partiallyDelivered = items.Any(x => x.QuantityDelivered > 0);

                so.Status =
                    allDelivered ? "Completed" :
                    partiallyDelivered ? "PartiallyDelivered" :
                    "In Progress";
            }

            _context.SalesOrders.Update(so);
            await _context.SaveChangesAsync();
        }

        [HttpPost("GenerateDO/{salesOrderId}")]
        public async Task<IActionResult> GenerateDO(Guid salesOrderId)
        {
            var so = await _context.SalesOrders
                .Include(x => x.SalesOrderItems)
                .Include(x => x.DeliveryOrders)
                .FirstOrDefaultAsync(x => x.Id == salesOrderId);

            if (so == null)
                return NotFound(new { message = "Sales Order not found" });

            if (so.Status != "Confirmed" && so.Status != "InProgress")
                return BadRequest(new { message = "SO must be confirmed first." });

            var doEntity = new DeliveryOrder
            {
                Id = Guid.NewGuid(),
                DeliveryOrderNo = await GenerateDONo(),
                SalesOrderId = so.Id,
                ReferenceNo = so.SalesOrderNo,
                SenderCompanyId = so.CompanyId,
                ReceiverCompanyId = so.ClientId,
                Type = "Dispatch",
                Status = "Draft"
            };

            doEntity.DeliveryOrderItems = so.SalesOrderItems.Select(x => new DeliveryOrderItem
            {
                Id = Guid.NewGuid(),
                DeliveryOrderId = doEntity.Id,
                Description = x.Description,
                QuantityOrdered = x.Quantity,
                QuantityDelivered = 0,
                Unit = x.Unit,
                Remarks = null
            }).ToList();

            _context.DeliveryOrders.Add(doEntity);

            await _context.SaveChangesAsync();

            await UpdateSalesOrderStatusFromDO(so.Id);

            return Ok(new
            {
                message = "Delivery Order created successfully",
                deliveryOrder = doEntity
            });
        }

        private async Task UpdateSalesOrderStatusFromDO(Guid salesOrderId)
        {
            var so = await _context.SalesOrders
                .Include(x => x.SalesOrderItems)
                .Include(x => x.DeliveryOrders)
                    .ThenInclude(d => d.DeliveryOrderItems)
                .FirstOrDefaultAsync(x => x.Id == salesOrderId);

            if (so == null) return;

            var totalOrdered = so.SalesOrderItems?
                .Where(x => x.Quantity != null)
                .Sum(x => x.Quantity ?? 0) ?? 0;

            var totalDelivered = so.DeliveryOrders?
                .SelectMany(d => d.DeliveryOrderItems ?? new List<DeliveryOrderItem>())
                .Where(x => x != null)
                .Sum(x => x.QuantityDelivered ?? 0) ?? 0;

            if (totalDelivered == 0)
            {
                so.Status = "InProgress";
            }
            else if (totalDelivered < totalOrdered)
            {
                so.Status = "PartiallyDelivered";
            }
            else
            {
                so.Status = "Delivered";
            }

            await _context.SaveChangesAsync();
        }

        private async Task<string> GenerateDONo()
        {
            var year = DateTime.UtcNow.Year % 100;

            var lastDO = await _context.DeliveryOrders
                .Where(x => x.DeliveryOrderNo.Contains($"YL/DO/") && x.DeliveryOrderNo.EndsWith($"/{year}"))
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.DeliveryOrderNo)
                .FirstOrDefaultAsync();

            int next = 1;

            if (!string.IsNullOrEmpty(lastDO))
            {
                var parts = lastDO.Split('/');
                if (parts.Length >= 3 && int.TryParse(parts[2], out int lastNo))
                {
                    next = lastNo + 1;
                }
            }

            return $"YL/DO/{next}/{year}";
        }
    }
}
