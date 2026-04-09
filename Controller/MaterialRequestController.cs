using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaterialRequestController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public MaterialRequestController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.MaterialRequests.AsQueryable();

                // Includes (e.g., "Customer,Items")
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(MaterialRequest), "u");
                    Expression? finalExpression = null;

                    // Split OR conditions first
                    var orParts = filter.Split('|');
                    foreach (var orPart in orParts)
                    {
                        Expression? orExpression = null;

                        // Split AND conditions
                        var andParts = orPart.Split(',');
                        foreach (var andPart in andParts)
                        {
                            bool isNotEqual = andPart.Contains("!=");

                            var kv = isNotEqual
                                ? andPart.Split("!=")
                                : andPart.Split('=');

                            if (kv.Length != 2) continue;

                            var property = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            var propertyAccess = Expression.PropertyOrField(parameter, property);

                            Expression condition;

                            if (propertyAccess.Type == typeof(string))
                            {
                                var method = typeof(string).GetMethod("Equals", new[] { typeof(string) });
                                var equalsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
                            }
                            else if (propertyAccess.Type == typeof(Guid) || propertyAccess.Type == typeof(Guid?))
                            {
                                condition = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(Guid.Parse(valueStr), propertyAccess.Type)
                                );
                            }
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue = Enum.Parse(propertyAccess.Type, valueStr);
                                var equalsExpr = Expression.Equal(propertyAccess, Expression.Constant(enumValue));

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(convertedValue));
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(orExpression, condition); // AND inside one OR part
                        }

                        finalExpression = finalExpression == null
                            ? orExpression
                            : Expression.OrElse(finalExpression, orExpression); // OR between parts
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<MaterialRequest, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }


                // OrderBy (e.g., "CreatedDate desc")
                if (!string.IsNullOrEmpty(orderBy))
                {
                    if (orderBy.ToLower().Contains("desc"))
                        query = query.OrderByDescending(q => EF.Property<object>(q, orderBy.Replace(" desc", "").Trim()));
                    else
                        query = query.OrderBy(q => EF.Property<object>(q, orderBy.Trim()));
                }

                var TotalElements = query.Count();

                var items = query
      .Skip((page - 1) * pageSize)
      .Take(pageSize).ToList();


                // Select (e.g., "Id,Status")
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object>();
                        foreach (var field in selectedFields)
                        {
                            var value = item.GetType().GetProperty(field)?.GetValue(item);
                            dict[field] = value ?? "null";
                        }
                        return dict;
                    });

                    return Ok(new
                    {
                        Data = projected,
                        TotalElements
                    });
                }

                return Ok(new
                {
                    Data = items,
                    TotalElements
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An unexpected error occured." });
            }

        }

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(string? filter = null, string? includes = null)
        {
            IQueryable<MaterialRequest> query = _context.MaterialRequests.AsNoTracking(); // Better performance for reads

            if (!string.IsNullOrWhiteSpace(includes))
            {
                foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    query = query.Include(include.Trim());
                }
            }

            if (!string.IsNullOrEmpty(filter))
            {
                query = query.Where(d => d.Id.ToString() == filter);
            }

            var data = await query.FirstOrDefaultAsync();

            if (data == null)
                return NotFound();

            // 🔹 MAP TO DTO TO BREAK THE CYCLE
            var result = new MaterialRequestDto
            {
                Id = data.Id,
                RequestNo = data.RequestNo,
                ProjectId = data.ProjectId,
                ClientId = data.ClientId,
                TaskId = data.TaskId,
                POId = data.POId,
                RequestDate = data.RequestDate,
                RequestedById = data.RequestedById,
                Purpose = data.Purpose,
                Remarks = data.Remarks,
                Attachments = data.Attachments,
                // Map items but EXCLUDE the 'materialRequest' property inside the item
                MaterialItems = data.MaterialItems?.Select(m => new MaterialItemDto
                {
                    Id = m.Id,
                    Description = m.Description,
                    Quantity = m.Quantity,
                    Unit = m.Unit,
                    Brand = m.Brand,
                    RequiredDate = m.RequiredDate,
                    SupplierId = m.SupplierId
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost("Create")]
        public async Task<ActionResult<MaterialRequestDto>> Create([FromBody] CreateMaterialRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RequestNo))
                return BadRequest(new { Error = "Request No is required." });

            try
            {
                // Create EF entity
                var materialEntity = new MaterialRequest
                {
                    Id = Guid.NewGuid(),
                    RequestNo = request.RequestNo ?? GenerateRequestNo(),
                    POId = request.POId,
                    TaskId = request.TaskId,
                    ClientId = request.ClientId,
                    RequestedById = request.RequestedById,
                    RequestDate = request.RequestDate,
                    ProjectId = request.ProjectId,
                    Purpose = request.Purpose,
                    Remarks = request.Remarks,
                    CreatedAt = DateTime.UtcNow,
                    Attachments = request.Attachments,
                    MaterialItems = request.MaterialItems?
                        .Select(m => new MaterialItem
                        {
                            Id = Guid.NewGuid(),
                            Description = m.Description,
                            Quantity = m.Quantity ?? 0,
                            Brand = m.Brand,
                            SupplierId = m.SupplierId,
                            RequiredDate = m.RequiredDate,
                            Unit = m.Unit,
                            CreatedAt = DateTime.UtcNow
                        })
                        .ToList() ?? new List<MaterialItem>()
                };

                // Save to database
                _context.MaterialRequests.Add(materialEntity);
                await _context.SaveChangesAsync();

                // Map EF entity to DTO to return (prevents circular reference)
                var materialDto = new MaterialRequestDto
                {
                    Id = materialEntity.Id,
                    RequestNo = materialEntity.RequestNo,
                    POId = materialEntity.POId,
                    TaskId = materialEntity.TaskId,
                    ClientId = materialEntity.ClientId,
                    RequestedById = materialEntity.RequestedById,
                    RequestDate = materialEntity.RequestDate,
                    ProjectId = materialEntity.ProjectId,
                    Remarks = materialEntity.Remarks,
                    MaterialItems = materialEntity.MaterialItems
                        .Select(m => new MaterialItemDto
                        {
                            Id = m.Id,
                            Description = m.Description,
                            Quantity = m.Quantity,
                            Brand = m.Brand,
                            SupplierId = m.SupplierId,
                            RequiredDate = m.RequiredDate,
                            Unit = m.Unit
                        }).ToList()
                };

                // Notify via SignalR
                await _hub.Clients.All.SendAsync("MaterialRequestAdded", materialDto);

                return Ok(new
                {
                    Success = true,
                    Message = $"Material request created successfully. Request No: {materialEntity.RequestNo}",
                    Id = materialEntity.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to add material request.", Details = ex.Message });
            }
        }

        private string GenerateRequestNo()
        {
            var today = DateTime.UtcNow;
            string datePart = today.ToString("yyyyMMdd"); // e.g., 20260223
            string prefix = "MR";

            // Count existing requests for today
            int countToday = _context.MaterialRequests
                .Count(r => r.CreatedAt == today.Date);

            // Increment by 1 for this request
            int nextNumber = countToday + 1;

            // Format number as 3 digits, e.g., 001, 002
            string numberPart = nextNumber.ToString("D3");

            return $"{prefix}-{datePart}-{numberPart}";
        }

        [HttpPut("Update")]
        public async Task<ActionResult<MaterialRequestDto>> Update([FromBody] UpdateMaterialRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Load MaterialRequest including its items
            var material = await _context.MaterialRequests
                .Include(m => m.MaterialItems)
                .FirstOrDefaultAsync(m => m.Id == request.Id);

            if (material == null)
                return NotFound(new { Error = "Material request not found." });

            try
            {
                // Update main fields
                material.RequestNo = request.RequestNo ?? material.RequestNo;
                material.RequestDate = request.RequestDate ?? material.RequestDate;
                material.POId = request.POId ?? material.POId;
                material.ProjectId = request.ProjectId ?? material.ProjectId;
                material.ClientId = request.ClientId ?? material.ClientId;
                material.TaskId = request.TaskId ?? material.TaskId;
                material.Remarks = request.Remarks ?? material.Remarks;
                material.UpdatedAt = DateTime.UtcNow;

                // Sync MaterialItems
                if (request.MaterialItems != null)
                {
                    // 1. Remove items not in request
                    var requestItemIds = request.MaterialItems
                        .Where(i => i.Id.HasValue)
                        .Select(i => i.Id!.Value)
                        .ToList();

                    var itemsToRemove = material.MaterialItems
                        .Where(i => !requestItemIds.Contains(i.Id))
                        .ToList();

                    _context.MaterialItems.RemoveRange(itemsToRemove);

                    // 2. Add or update items
                    foreach (var itemReq in request.MaterialItems)
                    {
                        if (itemReq.Id.HasValue)
                        {
                            // Update existing
                            var existingItem = material.MaterialItems.FirstOrDefault(i => i.Id == itemReq.Id.Value);
                            if (existingItem != null)
                            {
                                existingItem.Description = itemReq.Description ?? existingItem.Description;
                                existingItem.Quantity = itemReq.Quantity ?? existingItem.Quantity;
                                existingItem.Unit = itemReq.Unit ?? existingItem.Unit;
                                existingItem.Brand = itemReq.Brand ?? existingItem.Brand;
                                existingItem.RequiredDate = itemReq.RequiredDate ?? existingItem.RequiredDate;
                                existingItem.SupplierId = itemReq.SupplierId;
                                existingItem.UpdatedAt = DateTime.UtcNow;
                            }
                        }
                        else
                        {
                            // Add new
                            material.MaterialItems.Add(new MaterialItem
                            {
                                Id = Guid.NewGuid(),
                                MaterialRequestId = material.Id,
                                Description = itemReq.Description,
                                Quantity = itemReq.Quantity ?? 0,
                                Unit = itemReq.Unit,
                                Brand = itemReq.Brand,
                                RequiredDate = itemReq.RequiredDate,
                                SupplierId = itemReq.SupplierId,
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }

                await _context.SaveChangesAsync();

                // Map to DTO to prevent circular reference
                var materialDto = new MaterialRequestDto
                {
                    Id = material.Id,
                    RequestNo = material.RequestNo,
                    POId = material.POId,
                    TaskId = material.TaskId,
                    ClientId = material.ClientId,
                    RequestedById = material.RequestedById,
                    RequestDate = material.RequestDate,
                    ProjectId = material.ProjectId,
                    Remarks = material.Remarks,
                    MaterialItems = material.MaterialItems.Select(m => new MaterialItemDto
                    {
                        Id = m.Id,
                        Description = m.Description,
                        Quantity = m.Quantity,
                        Unit = m.Unit,
                        Brand = m.Brand,
                        RequiredDate = m.RequiredDate,
                        SupplierId = m.SupplierId
                    }).ToList()
                };

                // Notify via SignalR
                await _hub.Clients.All.SendAsync("MaterialRequestUpdated", materialDto);

                return Ok(materialDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to update material request.", Details = ex.Message });
            }
        }


        [HttpGet("GetSelectOptions")]
        public async Task<IActionResult> GetSelectOptions()
        {
            var projects = await _context.Projects
                .Select(p => new { p.Id, p.ProjectTitle, p.ClientId, p.Tasks })
                .ToListAsync();
            var clients = await _context.Clients
                .Select(c => new { c.Id, c.Name })
                .ToListAsync(); 
            var tasks = await _context.ProjectTasks
                .Select(t => new { t.Id, t.TaskNo, t.JobTitle })
                .ToListAsync();
            var suppliers = await _context.Suppliers
                .Select(s => new { s.Id, s.Name })
                .ToListAsync();
            var po = await _context.PurchaseOrders
                .Select(po => new { po.Id, po.PONo })
                .ToListAsync();
            var user = await _context.Users.Where(u => u.IsActive)
                .Select(u => new { u.Id, u.FirstName, u.LastName })
                .ToListAsync();
            return Ok(new
            {
                Projects = projects,
                Clients = clients,
                Tasks = tasks,
                Suppliers = suppliers,
                PurchaseOrders = po,
                Users = user.Select(u => new { u.Id, Name = $"{u.FirstName} {u.LastName}" })
            });
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateMaterialRequestStatusDto request)
        {
            var material = await _context.MaterialRequests
                .FirstOrDefaultAsync(m => m.Id == request.Id);

            if (material == null)
                return NotFound(new { Error = "Material request not found." });

            try
            {
                switch (request.Status)
                {
                    case "PendingApproval":
                        if (material.Status != "Draft")
                            return BadRequest(new { Error = "Only Draft can request approval." });

                        material.Status = "PendingApproval";
                        material.ApprovedById = request.ApprovedById;
                        material.ApprovalRequestedAt = DateTime.UtcNow;
                        break;

                    case "Approved":
                        if (material.Status != "PendingApproval")
                            return BadRequest(new { Error = "Only PendingApproval can be approved." });

                        material.Status = "Approved";
                        material.ApprovedAt = DateTime.UtcNow;
                        break;

                    case "Rejected":
                        if (material.Status != "PendingApproval")
                            return BadRequest(new { Error = "Only PendingApproval can be rejected." });

                        material.Status = "Rejected";
                        material.RejectedAt = DateTime.UtcNow;
                        material.RejectionReason = request.RejectionReason;
                        break;

                    case "Issued":
                        if (material.Status != "Approved")
                            return BadRequest(new { Error = "Only Approved request can be issued." });

                        material.Status = "Issued";
                        material.IssuedAt = DateTime.UtcNow;
                        // ✅ Automatically get the current logged-in user
                        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                        if (!string.IsNullOrEmpty(userIdClaim))
                        {
                            material.IssuedById = Guid.Parse(userIdClaim);
                        }
                        else
                        {
                            material.IssuedById = null; 
                        }
                        break;

                    case "Completed":
                        if (material.Status != "Issued")
                            return BadRequest(new { Error = "Only Issued request can be completed." });

                        material.Status = "Completed";
                        material.CompletedAt = DateTime.UtcNow;
                        break;

                    default:
                        return BadRequest(new { Error = "Invalid status value." });
                }

                material.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("MaterialRequestStatusUpdated", new
                {
                    material.Id,
                    material.Status
                });

                return Ok(new
                {
                    Message = "Status updated successfully.",
                    material.Id,
                    material.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update status.",
                    Details = ex.Message
                });
            }
        }
    }
}
