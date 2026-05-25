using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;
using System.Text.Json;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
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
     .Include(x => x.PurchaseOrder)
     .Include(x => x.SenderCompany)
     .Include(x => x.ReceiverCompany)
     .Include(x => x.DeliveryOrderItems)
     .Include(x => x.DeliveryOrderStatusHistories)
         .ThenInclude(h => h.ActionUser)
     .Include(x => x.DeliveryOrderStatusHistories)
         .ThenInclude(h => h.ReviewByUser)
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
                "PurchaseOrder",
                "SenderCompany",
                "ReceiverCompany",
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
                    Type = data.Type,
                    Status = data.Status,
                    ProjectId = data.ProjectId,
                    PurchaseOrderId = data.PurchaseOrderId,
                    SenderCompanyId = data.SenderCompanyId,
                    ReceiverCompanyId = data.ReceiverCompanyId,
                    DeliveryMethod = data.DeliveryMethod,
                    Notes = data.Notes,
                    Remarks = data.Remarks,
                    ReferenceNo = data.ReferenceNo,

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

                return Ok(result);
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
        public async Task<ActionResult<object>> Create(
            [FromForm] CreateDeliveryOrderRequest request)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new
                {
                    Error = "Invalid token."
                });
            }

            try
            {
                if (!string.IsNullOrEmpty(
                    Request.Form["deliveryOrderItems"]))
                {
                    request.DeliveryOrderItems =
                        JsonSerializer.Deserialize<
                            List<CreateDeliveryOrderItemRequest>>(
                            Request.Form["deliveryOrderItems"],
                            new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            }) ?? new();
                }

                var exists = await _context.DeliveryOrders
                    .AnyAsync(x =>
                        x.DeliveryOrderNo ==
                        request.DeliveryOrderNo);

                if (exists)
                {
                    return Ok(new
                    {
                        success = false,
                        message =
                            "Delivery Order No already exists."
                    });
                }

                string? filePath = null;

                if (request.Attachment != null)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "DO");

                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.Attachment.FileName)}";
                    var fullPath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await request.Attachment.CopyToAsync(stream);
                    }

                    filePath = $"Uploads/DO/{fileName}";
                }


                var deliveryOrder = new DeliveryOrder
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderNo = request.DeliveryOrderNo,
                    Type = request.Type,
                    ProjectId = request.ProjectId,
                    PurchaseOrderId = request.PurchaseOrderId,
                    ReferenceNo = request.ReferenceNo,
                    SenderCompanyId = request.SenderCompanyId,
                    ReceiverCompanyId = request.ReceiverCompanyId,
                    DeliveryMethod = request.DeliveryMethod,
                    Notes = request.Notes,
                    Remarks = request.Remarks,
                    Status = "Draft",
                    Attachment = filePath,
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTime.UtcNow
                };

                deliveryOrder.DeliveryOrderItems =
                    request.DeliveryOrderItems
                    .Select(x => new DeliveryOrderItem
                    {
                        Id = Guid.NewGuid(),
                        DeliveryOrderId = deliveryOrder.Id,
                        Description = x.Description,
                        QuantityOrdered = x.QuantityOrdered,
                        QuantityDelivered = x.QuantityDelivered,
                        Unit = x.Unit,
                        Remarks = x.Remarks
                    })
                    .ToList();

                var history = new DeliveryOrderStatusHistory
                {
                    Id = Guid.NewGuid(),
                    DeliveryOrderId = deliveryOrder.Id,
                    Status = "Draft",
                    ActionAt = DateTime.UtcNow,
                    ActionUserId = Guid.Parse(userIdClaim),
                    Remarks = "Delivery order created"
                };

                _context.DeliveryOrders.Add(deliveryOrder);

                _context.DeliveryOrderStatusHistories.Add(history);

                await _context.SaveChangesAsync();

                var result = await _context.DeliveryOrders
                    .Include(x => x.Project)
                    .Include(x => x.PurchaseOrder)
                    .Include(x => x.SenderCompany)
                    .Include(x => x.ReceiverCompany)
                    .Include(x => x.DeliveryOrderItems)
                    .Include(x => x.DeliveryOrderStatusHistories)
                    .FirstOrDefaultAsync(x =>
                        x.Id == deliveryOrder.Id);

                var dto = MapToDto(result!);

                await _hub.Clients.All.SendAsync(
                    "DeliveryOrderAdded",
                    dto);

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to create delivery order.",
                    Details = ex.Message
                });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<object>> Update([FromForm] UpdateDeliveryOrderRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { Error = "Invalid token." });
            }

            var deliveryOrder = await _context.DeliveryOrders
                .Include(x => x.DeliveryOrderItems)
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (deliveryOrder == null)
            {
                return NotFound(new { Error = "Delivery order not found." });
            }

            try
            {
                if (!string.IsNullOrEmpty(Request.Form["deliveryOrderItems"]))
                {
                    request.DeliveryOrderItems =
                        JsonSerializer.Deserialize<List<CreateDeliveryOrderItemRequest>>(
                            Request.Form["deliveryOrderItems"],
                            new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            }) ?? new();
                }

                string? filePath = deliveryOrder.Attachment;

                if (request.Attachment != null)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "DO");

                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.Attachment.FileName)}";
                    var fullPath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await request.Attachment.CopyToAsync(stream);
                    }

                    filePath = $"Uploads/DO/{fileName}";
                }

                deliveryOrder.DeliveryOrderNo = request.DeliveryOrderNo;
                deliveryOrder.Type = request.Type;
                deliveryOrder.ProjectId = request.ProjectId;
                deliveryOrder.PurchaseOrderId = request.PurchaseOrderId;
                deliveryOrder.ReferenceNo = request.ReferenceNo;
                deliveryOrder.SenderCompanyId = request.SenderCompanyId;
                deliveryOrder.ReceiverCompanyId = request.ReceiverCompanyId;
                deliveryOrder.DeliveryMethod = request.DeliveryMethod;
                deliveryOrder.Notes = request.Notes;
                deliveryOrder.Remarks = request.Remarks;

                deliveryOrder.Attachment = filePath; 
                deliveryOrder.UpdatedAt = DateTime.UtcNow;
                deliveryOrder.UpdatedById = Guid.Parse(userIdClaim);

                _context.DeliveryOrderItems.RemoveRange(deliveryOrder.DeliveryOrderItems);
                await _context.SaveChangesAsync();

                var newItems = request.DeliveryOrderItems
                    .Select(x => new DeliveryOrderItem
                    {
                        Id = Guid.NewGuid(),
                        DeliveryOrderId = deliveryOrder.Id,
                        Description = x.Description,
                        QuantityOrdered = x.QuantityOrdered,
                        QuantityDelivered = x.QuantityDelivered,
                        Unit = x.Unit,
                        Remarks = x.Remarks
                    });

                await _context.DeliveryOrderItems.AddRangeAsync(newItems);
                await _context.SaveChangesAsync();

                var result = await _context.DeliveryOrders
                    .Include(x => x.Project)
                    .Include(x => x.PurchaseOrder)
                    .Include(x => x.SenderCompany)
                    .Include(x => x.ReceiverCompany)
                    .Include(x => x.DeliveryOrderItems)
                    .Include(x => x.DeliveryOrderStatusHistories)
                    .FirstOrDefaultAsync(x => x.Id == deliveryOrder.Id);

                var dto = MapToDto(result!);

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update delivery order.",
                    Details = ex.Message
                });
            }
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deliveryOrder =
                await _context.DeliveryOrders
                .FirstOrDefaultAsync(x => x.Id == id);

            if (deliveryOrder == null)
                return NotFound();

            _context.DeliveryOrders.Remove(deliveryOrder);

            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync(
                "DeliveryOrderDeleted",
                id);

            return Ok(new
            {
                Message = "Delivery order deleted."
            });
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromForm] UpdateStatusRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var actionUserId = Guid.Parse(userIdClaim);

            var userName = await _context.Users
                .Where(x => x.Id == actionUserId)
                .Select(x => x.FullName)
                .FirstOrDefaultAsync();

            string? reviewerName = null;

            if (request.ReviewerUserId.HasValue)
            {
                reviewerName = await _context.Users
                    .Where(x => x.Id == request.ReviewerUserId.Value)
                    .Select(x => x.FullName)
                    .FirstOrDefaultAsync();
            }

            var deliveryOrder = await _context.DeliveryOrders
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (deliveryOrder == null)
                return NotFound();

            deliveryOrder.Status = request.Status;

            var po = await _context.PurchaseOrders
                .FirstOrDefaultAsync(x => x.Id == deliveryOrder.PurchaseOrderId);

            if (po != null)
            {
                switch (request.Status)
                {
                    case "Approved":
                        po.Status = "In Progress";
                        break;

                    case "Prepared":
                    case "OutDelivery":
                    case "PartiallyDelivered":
                        po.Status = "In Progress";
                        break;

                    case "Delivered":
                        po.Status = "Completed";
                        break;

                    case "Cancelled":
                        po.Status = "Cancelled";
                        break;
                }
            }

            var history = new DeliveryOrderStatusHistory
            {
                Id = Guid.NewGuid(),
                DeliveryOrderId = request.Id,
                Status = request.Status,
                ActionAt = DateTime.UtcNow,
                ActionUserId = actionUserId,

                Remarks = request.Remarks ?? $"DO updated to {request.Status} by {userName}",

                ReviewByUserId = request.ReviewerUserId,
                ApprovedByUserId = request.Status == "Approved" ? actionUserId : null,
            };

            _context.DeliveryOrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            if (request.ProofImages != null && request.ProofImages.Count > 0)
            {
                var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "DO-Proof");

                if (!Directory.Exists(uploadFolder))
                    Directory.CreateDirectory(uploadFolder);

                foreach (var file in request.ProofImages)
                {
                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                    var fullPath = Path.Combine(uploadFolder, fileName);

                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    _context.DeliveryOrderProofImages.Add(new DeliveryOrderProofImage
                    {
                        Id = Guid.NewGuid(),
                        DeliveryOrderStatusHistoryId = history.Id,
                        ImageUrl = $"Uploads/DO-Proof/{fileName}",
                        UploadedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                history.Id,
                history.Status,
                history.ActionAt,
                history.Remarks
            });
        }

        private object MapToDto(DeliveryOrder d)
        {
            return new
            {
                d.Id,
                d.DeliveryOrderNo,
                d.Type,
                d.Status,
                d.ProjectId,
                d.PurchaseOrderId,
                d.ReferenceNo,
                d.SenderCompanyId,
                d.ReceiverCompanyId,
                d.DeliveryMethod,
                d.Notes,
                d.Remarks,
                d.Attachment,

                Project = d.Project == null
                    ? null
                    : new
                    {
                        d.Project.ProjectCode,
                        d.Project.ProjectTitle
                    },

                PurchaseOrder = d.PurchaseOrder == null
                    ? null
                    : new
                    {
                        d.PurchaseOrder.PurchaseOrderNo
                    },

                SenderCompany = d.SenderCompany == null
                    ? null
                    : new
                    {
                        d.SenderCompany.Id,
                        d.SenderCompany.Name
                    },

                ReceiverCompany = d.ReceiverCompany == null
                    ? null
                    : new
                    {
                        d.ReceiverCompany.Id,
                        d.ReceiverCompany.Name
                    },

                DeliveryOrderItems =
                    d.DeliveryOrderItems,

                DeliveryOrderStatusHistories =
                    d.DeliveryOrderStatusHistories
            };
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {
                var purchaseOrders = await _context.PurchaseOrders
    .Include(x => x.Supplier)
    .Include(x => x.Client)
    .Include(x => x.Project)
    .OrderByDescending(x => x.CreatedAt)
    .Select(x => new PurchaseOrderDropdownItem
    {
        Id = x.Id,
        PurchaseOrderNo = x.PurchaseOrderNo,
        Type = x.Type,

        ProjectId = x.ProjectId,
        ProjectCode = x.Project != null ? x.Project.ProjectCode : null,

        SupplierId = x.SupplierId,
        SupplierName = x.Supplier != null ? x.Supplier.Name : null,

        ClientId = x.ClientId,
        ClientName = x.Client != null ? x.Client.Name : null
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
                    .OrderBy(x => x.Name)
                    .Select(x => new CompanyDropdownItem
                    {
                        Id = x.Id,
                        Name = x.Name
                    })
                    .ToListAsync();

                return Ok(new DeliveryOrderDropdownDto
                {
                    PurchaseOrders = purchaseOrders,
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
    }
}