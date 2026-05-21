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
        public async Task<ActionResult<object>> GetMany(
      int page = 1,
      int pageSize = 10,
      string? filter = null,
      string? orderBy = null,
      string? includes = null)
        {
            try
            {
                var query = _context.MaterialRequests.AsQueryable();

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(MaterialRequest), "u");
                    Expression? finalExpression = null;

                    var orParts = filter.Split('|');
                    foreach (var orPart in orParts)
                    {
                        Expression? orExpression = null;

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
                                var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes)!;

                                var propertyToLower = Expression.Call(propertyAccess, toLowerMethod);
                                var valueToLower = Expression.Constant(valueStr.ToLower());

                                var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) })!;

                                var containsExpr = Expression.Call(propertyToLower, containsMethod, valueToLower);

                                condition = isNotEqual
                                    ? Expression.Not(containsExpr)
                                    : containsExpr;
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
                                var equalsExpr = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(enumValue)
                                );

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                condition = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(convertedValue)
                                );
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
                        var lambda = Expression.Lambda<Func<MaterialRequest, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }
                if (!string.IsNullOrEmpty(orderBy))
                {
                    if (orderBy.ToLower().Contains("desc"))
                        query = query.OrderByDescending(q =>
                            EF.Property<object>(q, orderBy.Replace(" desc", "").Trim()));
                    else
                        query = query.OrderBy(q =>
                            EF.Property<object>(q, orderBy.Trim()));
                }
                var totalElements = await query.CountAsync();

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        p.Id,
                        p.DocumentNo,
                        Project = p.Project == null ? null : new
                        {
                            ProjectTitle = p.Project.ProjectTitle
                        },
                        p.RequestDate,
                        p.RequestNo,
                        p.Remarks,
                        p.DeliveryPlace,
                        RequestedBy = p.RequestedBy == null ? null : new
                        {
                            FullName = p.RequestedBy.FullName,
                        },
                        Client = p.Client == null ? null : new
                        {
                            Name = p.Client.Name
                        },
                        p.Status
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Data = items,
                    TotalElements = totalElements
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }
        [HttpPost("Create")]
        public async Task<ActionResult<MaterialRequest>> AddMaterialRequest([FromBody] CreateMaterialRequest? request)
        {
            if (request == null)
                return BadRequest(new { Error = "Request body is required." });

            try
            {
                var requestNo = await GenerateRequestNo();

                var material = new MaterialRequest
                {
                    Id = Guid.NewGuid(),

                    DocumentNo = requestNo,

                    RequestNo = requestNo,

                    RevNo = request.RevNo ?? "00",
                    EffDate = request.EffDate,

                    ProjectId = request.ProjectId,

                    RequestDate = request.RequestDate ?? DateTime.Now,

                    DeliveryDate = request.DeliveryDate,
                    DeliveryPlace = request.DeliveryPlace,

                    WorkOrderId = request.WorkOrderId,
                    RequestedById = request.RequestedById,
                    Remarks = request.Remarks,
                    ClientId = request.ClientId,
                    Status = "Draft",
                    CreatedAt = DateTime.Now
                };

                _context.MaterialRequests.Add(material);
                await _context.SaveChangesAsync();

                if (request.MaterialItems?.Any() == true)
                {
                    var items = request.MaterialItems.Select(x => new MaterialItem
                    {
                        MaterialRequestId = material.Id,
                        Description = x.Description,
                        Brand = x.Brand,
                        Unit = x.Unit,
                        TypeNo = x.TypeNo,
                        Quantity = x.Quantity ?? 0m,
                        RequiredAt = x.RequiredAt,
                        Remarks = x.Remarks,

                        SupplierId = x.SupplierId == Guid.Empty ? (Guid?)null : x.SupplierId
                    });

                    _context.MaterialItems.AddRange(items);
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    material.Id,
                    material.DocumentNo,
                    material.RequestNo
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<MaterialRequest>> UpdateMaterialRequest([FromBody] UpdateMaterialRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var material = await _context.MaterialRequests.FindAsync(request.Id);
            if (material == null)
                return NotFound(new { Error = "Material request not found." });

            try
            {
                material.DocumentNo = request.DocumentNo;
                material.RevNo = request.RevNo;
                material.EffDate = request.EffDate;
                material.RequestNo = request.RequestNo;
                material.ProjectId = request.ProjectId;
                material.RequestDate = request.RequestDate;
                material.DeliveryDate = request.DeliveryDate;
                material.DeliveryPlace = request.DeliveryPlace;
                material.WorkOrderId = request.WorkOrderId;
                material.RequestedById = request.RequestedById;
                material.Remarks = request.Remarks;
                material.UpdatedAt = DateTime.Now;

                var existingItems = _context.MaterialItems
                    .Where(x => x.MaterialRequestId == material.Id);

                _context.MaterialItems.RemoveRange(existingItems);

                if (request.MaterialItems != null && request.MaterialItems.Any())
                {
                    var newItems = request.MaterialItems.Select(x => new MaterialItem
                    {
                        MaterialRequestId = material.Id,
                        Description = x.Description,
                        Brand = x.Brand,
                        Unit = x.Unit,
                        TypeNo = x.TypeNo,
                        Quantity = x.Quantity ?? 0m,
                        RequiredAt = x.RequiredAt,
                        Remarks = x.Remarks,
                        SupplierId = x.SupplierId,
                    });

                    _context.MaterialItems.AddRange(newItems);
                }

                await _context.SaveChangesAsync();

                var result = await _context.MaterialRequests
                    .Where(d => d.Id == material.Id)
                    .Select(d => new MaterialRequest
                    {
                        Id = d.Id,
                        DocumentNo = d.DocumentNo,
                    })
                    .FirstAsync();

                await _hub.Clients.All.SendAsync("MaterialRequestUpdated", material);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to update material request." });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteMaterialRequest([FromQuery] Guid id)
        {
            var material = await _context.MaterialRequests.FindAsync(id);
            if (material == null)
                return NotFound(new { Error = "Material request not found." });

            try
            {
                _context.MaterialRequests.Remove(material);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("MaterialRequestDeleted", id);

                return Ok(new { Message = "Material request deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete material request." });
            }
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {
                var projects = await _context.Projects
                    .Select(c => new DropdownDto
                    {
                        Id = c.Id,
                        ProjectTitle = c.ProjectTitle,
                        ClientId = c.ClientId
                    })
                    .ToListAsync();

                var suppliers = await _context.Companies.Select(c => new DropdownDto
                {
                    Id = c.Id,
                    Name = c.Name
                }).ToListAsync();

                var users = await _context.Users
                    .Select(u => new DropdownDto
                    {
                        Id = u.Id,
                        Name = u.FullName
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Projects = projects,
                    Suppliers = suppliers,
                    Users = users
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to load dropdown data." });
            }
        }

        private async Task<string> GenerateRequestNo()
        {
            var year = DateTime.Now.Year;

            var lastRequest = await _context.MaterialRequests
                .Where(x => x.RequestNo != null && x.RequestNo.Contains("YL/MR/F"))
                .OrderByDescending(x => x.RequestNo)
                .Select(x => x.RequestNo)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (!string.IsNullOrEmpty(lastRequest))
            {
                var lastNumberPart = lastRequest.Split('F').Last(); // get number after 'F'
                if (int.TryParse(lastNumberPart, out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"YL/PO/F{nextNumber:D2}";
        }

    }
}
