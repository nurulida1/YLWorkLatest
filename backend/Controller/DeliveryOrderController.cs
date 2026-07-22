using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Linq.Expressions;
using System.Security.Claims;
using System.Text.Json;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveryOrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public DeliveryOrderController(
            AppDbContext context,
            IHubContext<NotificationHub> hub)
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
            string? includes = null)
        {
            try
            {
                IQueryable<DeliveryOrder> query =
                    _context.DeliveryOrders.AsQueryable();

                // Includes
                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // Filter
                if (!string.IsNullOrWhiteSpace(filter))
                {
                    var filters = filter.Split(',');

                    foreach (var f in filters)
                    {
                        var parts = f.Split('=');

                        if (parts.Length != 2)
                            continue;

                        var property = parts[0].Trim();
                        var value = parts[1].Trim();

                        query = query.Where(x =>
                            EF.Property<string>(x, property).Contains(value));
                    }
                }

                // Sorting
                if (!string.IsNullOrWhiteSpace(orderBy))
                {
                    bool desc = orderBy.EndsWith(" desc");

                    var property = orderBy
                        .Replace(" desc", "")
                        .Trim();

                    query = desc
                        ? query.OrderByDescending(x =>
                            EF.Property<object>(x, property))
                        : query.OrderBy(x =>
                            EF.Property<object>(x, property));
                }
                else
                {
                    query = query.OrderByDescending(x => x.CreatedAt);
                }

                var totalElements = await query.CountAsync();

                var data = await query
     .Include(x => x.Project)
     .Include(x => x.SalesOrder)
     .Include(x => x.SenderCompany)
     .Include(x => x.ReceiverCompany)
     .Include(x => x.DeliveryOrderItems)
     .Include(x => x.DeliveryOrderStatusHistories)
         .ThenInclude(h => h.ActionUser)
     .Include(x => x.DeliveryOrderStatusHistories)
     .Skip((page - 1) * pageSize)
     .Take(pageSize)
     .ToListAsync();

                return Ok(new
                {
                    Data = data.Select(MapToDto),
                    TotalElements = totalElements
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to get delivery orders.",
                    Details = ex.Message
                });
            }
        }

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(
            [FromQuery] string? filter = null,
            [FromQuery] string? includes = null)
        {
            try
            {
                IQueryable<DeliveryOrder> query = _context.DeliveryOrders.AsQueryable();

                if (!string.IsNullOrWhiteSpace(includes))
                {
                    var allowedIncludes = new HashSet<string>
            {
                "Project",
                "SalesOrder",
                "SenderCompany",
                "SenderCompany.DeliveryAddress",
                "ReceiverCompany",
                "ReceiverCompany.DeliveryAddress",
                "DeliveryOrderItems",
                "DeliveryOrderStatusHistories",
                "DeliveryOrderStatusHistories.ActionUser"
            };

                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        var trimmed = include.Trim();

                        if (allowedIncludes.Contains(trimmed))
                        {
                            query = query.Include(trimmed);
                        }
                    }
                }

                if (!string.IsNullOrWhiteSpace(filter))
                {
                    var filterValue = filter.Contains('=')
                        ? filter.Split('=')[1].Trim()
                        : filter.Trim();

                    if (Guid.TryParse(filterValue, out Guid id))
                    {
                        query = query.Where(x => x.Id == id);
                    }
                }

                var data = await query.FirstOrDefaultAsync();

                if (data == null)
                    return NotFound();

                var result = new DeliveryOrder
                {
                    Id = data.Id,
                    DeliveryOrderNo = data.DeliveryOrderNo,
                    Status = data.Status,
                    ProjectId = data.ProjectId,
                    SalesOrderId = data.SalesOrderId,
                    SenderCompanyId = data.SenderCompanyId,
                    SenderCompany = data.SenderCompany,
                    ReceiverCompanyId = data.ReceiverCompanyId,
                    ReceiverCompany = data.ReceiverCompany,
                    DeliveryMethod = data.DeliveryMethod,
                    Notes = data.Notes,
                    Remarks = data.Remarks,
                    PaymentTerms = data.PaymentTerms,
                    DeliveryOrderItems = data.DeliveryOrderItems?.Select(i => new DeliveryOrderItem
                    {
                        Id = i.Id,
                        DeliveryOrderId = i.DeliveryOrderId,
                        Description = i.Description,
                        QuantityOrdered = i.QuantityOrdered,
                        QuantityDelivered = i.QuantityDelivered,
                        Unit = i.Unit,
                        Remarks = i.Remarks,
                    }).ToList(),

                  
                };

                if (data == null)
                    return NotFound();

                return Ok(MapToDto(data));
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
        public async Task<IActionResult> Create([FromForm] CreateDeliveryOrderRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            if (!string.IsNullOrEmpty(Request.Form["deliveryOrderItems"]))
            {
                request.DeliveryOrderItems =
                    JsonSerializer.Deserialize<List<CreateDeliveryOrderItemRequest>>(
                        Request.Form["deliveryOrderItems"]
                    ) ?? new();
            }

            var exists = await _context.DeliveryOrders
                .AnyAsync(x => x.DeliveryOrderNo == request.DeliveryOrderNo);

            if (exists)
                return BadRequest("DO number already exists");

            string? filePath = null;

            if (request.Attachment != null)
            {
                var folder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads/DO");
                if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.Attachment.FileName)}";
                var path = Path.Combine(folder, fileName);

                using var stream = new FileStream(path, FileMode.Create);
                await request.Attachment.CopyToAsync(stream);

                filePath = $"Uploads/DO/{fileName}";
            }

            var doEntity = new DeliveryOrder
            {
                Id = Guid.NewGuid(),
                DeliveryOrderNo = request.DeliveryOrderNo ?? await GenerateDONo(),
                ProjectId = request.ProjectId,
                SalesOrderId = request.SalesOrderId,
                SenderCompanyId = request.SenderCompanyId,
                ReceiverCompanyId = request.ReceiverCompanyId,
                DeliveryMethod = request.DeliveryMethod,
                Notes = request.Notes,
                Remarks = request.Remarks,
                PaymentTerms = request.PaymentTerms,
                Attachment = filePath,
                Status = "Draft"
            };

            doEntity.DeliveryOrderItems = request.DeliveryOrderItems
                .Select(x => new DeliveryOrderItem
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderId = doEntity.Id,
                    Description = x.Description,
                    SalesOrderItemId = x.SalesOrderItemId,
                    QuantityOrdered = x.QuantityOrdered,
                    QuantityDelivered = x.QuantityDelivered,
                    Unit = x.Unit,
                    Remarks = x.Remarks
                }).ToList();

            var history = new DeliveryOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                DeliveryOrderId = doEntity.Id,
                Status = "Draft",
                ActionUserId = Guid.Parse(userId),
                ActionAt = DateTimeHelper.Now(),
                Remarks = "Created"
            };

            _context.DeliveryOrders.Add(doEntity);
            _context.DeliveryOrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("DeliveryOrderAdded", MapToDto(doEntity));

            return Ok(MapToDto(doEntity));
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromForm] UpdateDeliveryOrderRequest request)
        {
            var entity = await _context.DeliveryOrders
                .Include(x => x.DeliveryOrderItems)
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (entity == null)
                return NotFound();

            entity.DeliveryOrderNo = request.DeliveryOrderNo;
            entity.ProjectId = request.ProjectId;
            entity.SalesOrderId = request.SalesOrderId;
            entity.SenderCompanyId = request.SenderCompanyId;
            entity.ReceiverCompanyId = request.ReceiverCompanyId;
            entity.DeliveryMethod = request.DeliveryMethod;
            entity.Notes = request.Notes;
            entity.Remarks = request.Remarks;
            entity.PaymentTerms = request.PaymentTerms;

            _context.DeliveryOrderItems.RemoveRange(entity.DeliveryOrderItems);

            entity.DeliveryOrderItems = request.DeliveryOrderItems
                .Select(x => new DeliveryOrderItem
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderId = entity.Id,
                    Description = x.Description,
                    SalesOrderItemId = x.SalesOrderItemId,
                    QuantityOrdered = x.QuantityOrdered,
                    QuantityDelivered = x.QuantityDelivered,
                    Unit = x.Unit,
                    Remarks = x.Remarks
                }).ToList();

            await _context.SaveChangesAsync();

            return Ok(MapToDto(entity));
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var entity = await _context.DeliveryOrders
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
                return NotFound();

            _context.DeliveryOrders.Remove(entity);
            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("DeliveryOrderDeleted", id);

            return Ok();
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(UpdateStatusRequest request)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var entity = await _context.DeliveryOrders
                .Include(x => x.DeliveryOrderItems)
                .Include(x => x.DeliveryOrderStatusHistories)
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (entity == null)
                return NotFound();

            entity.Status = request.Status;

            if (request.Status == "Delivered")
            {
                entity.DeliveredAt = DateTime.UtcNow;
            }

            var history = new DeliveryOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                DeliveryOrderId = entity.Id,
                Status = request.Status,
                ActionUserId = userId,
                Remarks = request.Remarks,
                ActionAt = DateTimeHelper.Now()
            };

            _context.DeliveryOrderStatusHistories.Add(history);

            if (request.ProofImages?.Count > 0)
            {
                var folder = Path.Combine("Uploads/DO/Proof");
                if (!Directory.Exists(folder))
                    Directory.CreateDirectory(folder);

                foreach (var file in request.ProofImages)
                {
                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                    var fullPath = Path.Combine(folder, fileName);

                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    //_context.DeliveryOrderProofImages.Add(new DeliveryOrderProofImage
                    //{
                    //    Id = Guid.NewGuid(),
                    //    DeliveryOrderStatusHistoryId = history.Id,
                    //    ImageUrl = $"Uploads/DO/Proof/{fileName}",
                    //    Remarks = request.Remarks
                    //});
                }
            }

            await _context.SaveChangesAsync();

            return Ok();
        }

        private object MapToDto(DeliveryOrder d)
        {
            return new
            {
                d.Id,
                d.DeliveryOrderNo,
                d.Status,
                d.ProjectId,
                d.SalesOrderId,
                d.SenderCompanyId,
                d.ReceiverCompanyId,
                d.DeliveryMethod,
                d.Notes,
                d.Remarks,
                d.Attachment,
                d.TrackingNo,
                d.DeliveredAt,
                d.ReceivedBy,
                d.IsReceiverSigned,
                d.CreatedAt,
                d.PaymentTerms,
                ReceiverCompany  = d.ReceiverCompany != null ? new
                {
                    d.ReceiverCompany.Name,
                    d.ReceiverCompany.Email,
                    d.ReceiverCompany.ContactNo,
                    d.ReceiverCompany.FaxNo,
                    d.ReceiverCompany.ContactPerson1,
                    d.ReceiverCompany.ContactPerson2,
                    d.ReceiverCompany.BillingAddress,
                    d.ReceiverCompany.DeliveryAddress,
                } : null,
                 SenderCompany = d.SenderCompany != null ? new
                {
                    d.SenderCompany.Name,
                     d.SenderCompany.Email,
                     d.SenderCompany.ContactNo,
                     d.SenderCompany.FaxNo,
                     d.SenderCompany.ContactPerson1,
                     d.SenderCompany.ContactPerson2,
                     d.SenderCompany.BillingAddress,
                     d.SenderCompany.DeliveryAddress,
                 } : null,
                Project = d.Project != null ? new
                {
                    d.Project.ProjectCode,
                    d.Project.ProjectTitle
                } : null,

                SalesOrder = d.SalesOrder != null ? new
                {
                    d.SalesOrder.SalesOrderNo
                } : null,

                Items = d.DeliveryOrderItems,
                History = d.DeliveryOrderStatusHistories
            };
        }
 
        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {
                var salesOrder = await _context.SalesOrders
    .AsNoTracking()
    .Include(x => x.Client)
    .Include(x => x.Project)
    .Include(x => x.SalesOrderItems)
    .OrderByDescending(x => x.CreatedAt)
    .Select(x => new SalesOrderDropdownDto
    {
        Id = x.Id,
        SalesOrderNo = x.SalesOrderNo,
        ProjectId = x.ProjectId,
        ProjectCode = x.Project != null ? x.Project.ProjectCode : null,
        ClientId = x.ClientId,
        ClientName = x.Client != null ? x.Client.Name : null,
        PaymentTerms = x.PaymentTerms,

        SalesOrderItems = x.SalesOrderItems.Where(i => i.RowType == "LineItem")
            .Select(i => new SalesOrderItemDropdownDto
            {
                Id = i.Id,
                Description = i.Description,
                Quantity = i.Quantity,
                Unit = i.Unit
            })
            .ToList()
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

                var companies = await _context.Companies
                    .OrderBy(x => x.Name).Include(x =>  x.DeliveryAddress).Include(x => x.BillingAddress)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name,
                        DeliveryAddress = x.DeliveryAddress,
                        BillingAddress = x.BillingAddress,
                        ContactPerson1 = x.ContactPerson1,
                        ContactNo = x.ContactNo,
                    })
                    .ToListAsync();

                return Ok(new DeliveryOrderDropdownDto
                {
                    SalesOrders = salesOrder,
                    Projects = projects,
                    Companies = companies
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

        private async Task<string> GenerateDONo()
        {
            var yearShort = DateTime.UtcNow.Year % 100; // 2026 -> 26

            var lastDO = await _context.DeliveryOrders
                .Where(q => q.DeliveryOrderNo.StartsWith($"YL/DO/") && q.DeliveryOrderNo.EndsWith($"/{yearShort}"))
                .OrderByDescending(q => q.CreatedAt)
                .Select(q => q.DeliveryOrderNo)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (!string.IsNullOrEmpty(lastDO))
            {
                var parts = lastDO.Split('/');
                if (parts.Length == 4 && int.TryParse(parts[2], out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"YL/DO/{nextNumber}/{yearShort}";
        }

        [HttpGet("generate-no")]
        public async Task<IActionResult> GenerateDeliveryOrderNoEndpoint()
        {
            var deliveryOrderNo = await GenerateDONo();
            return Ok(new { deliveryOrderNo });

        }

        [HttpGet("generate-multiple-no")]
        public async Task<IActionResult> GenerateMultiple(int count)
        {
            var result = new List<string>();

            for (int i = 0; i < count; i++)
            {
                result.Add(await GenerateDONo());
            }

            return Ok(result);
        }

        [HttpPost("CreateBulk")]
        public async Task<IActionResult> CreateBulk([FromBody] List<CreateDeliveryOrderRequest> requests)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            if (requests == null || !requests.Any())
                return BadRequest("No delivery orders provided.");

            var createdList = new List<DeliveryOrder>();

            foreach (var request in requests)
            {
                var exists = await _context.DeliveryOrders
                    .AnyAsync(x => x.DeliveryOrderNo == request.DeliveryOrderNo);

                if (exists)
                    return BadRequest($"DO number already exists: {request.DeliveryOrderNo}");

                var doEntity = new DeliveryOrder
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderNo = string.IsNullOrEmpty(request.DeliveryOrderNo)
                        ? await GenerateDONo()
                        : request.DeliveryOrderNo,

                    ProjectId = request.ProjectId,
                    SalesOrderId = request.SalesOrderId,
                    SenderCompanyId = request.SenderCompanyId,
                    ReceiverCompanyId = request.ReceiverCompanyId,
                    ContactPerson1  = request.ContactPerson1,
                    ContactPerson2 = request.ContactPerson2,
                    ContactNo1 = request.ContactNo1,
                    ContactNo2 = request.ContactNo2,
                    DeliveryMethod = request.DeliveryMethod,
                    Notes = request.Notes,
                    Remarks = request.Remarks,
                    PaymentTerms = request.PaymentTerms,
                    Status = "Draft"
                };

                doEntity.DeliveryOrderItems = request.DeliveryOrderItems?
                    .Select(x => new DeliveryOrderItem
                    {
                        Id = Guid.NewGuid(),
                        DeliveryOrderId = doEntity.Id,
                        Description = x.Description,
                        SalesOrderItemId = x.SalesOrderItemId,
                        QuantityOrdered = x.QuantityOrdered,
                        QuantityDelivered = x.QuantityDelivered,
                        Unit = x.Unit,
                        Remarks = x.Remarks
                    })
                    .ToList() ?? new List<DeliveryOrderItem>();

                var history = new DeliveryOrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderId = doEntity.Id,
                    Status = "Draft",
                    ActionUserId = Guid.Parse(userId),
                    ActionAt = DateTimeHelper.Now(),
                    Remarks = "Bulk Created"
                };

                _context.DeliveryOrders.Add(doEntity);
                _context.DeliveryOrderStatusHistories.Add(history);

                createdList.Add(doEntity);
            }

            await _context.SaveChangesAsync();

            foreach (var item in createdList)
            {
                await _hub.Clients.All.SendAsync("DeliveryOrderAdded", MapToDto(item));
            }

            return Ok(createdList.Select(MapToDto));
        }
    }
}