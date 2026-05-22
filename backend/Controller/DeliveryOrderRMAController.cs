using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using System.Security.Claims;

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
    public async Task<IActionResult> GetMany(int page = 1, int pageSize = 10)
    {
        var query = _context.DeliveryOrderRMAs
            .Include(x => x.SenderCompany)
            .Include(x => x.ReceiverCompany)
            .Include(h => h.ProofImages)
            .OrderByDescending(x => x.CreatedAt);

        var total = await query.CountAsync();

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            Data = data,
            TotalElements = total
        });
    }

    [HttpGet("GetOne/{id}")]
    public async Task<IActionResult> GetOne(Guid id)
    {
        var rma = await _context.DeliveryOrderRMAs
            .Include(x => x.SenderCompany)
            .Include(x => x.ReceiverCompany)
            .Include(h => h.ProofImages)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (rma == null)
            return NotFound();

        return Ok(rma);
    }

    [HttpPost("Create")]
    public async Task<IActionResult> Create([FromBody] CreateDeliveryOrderRMARequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var exists = await _context.DeliveryOrderRMAs
            .AnyAsync(x => x.RMANo == request.RMANo);

        if (exists)
            return BadRequest("RMA No already exists");

        var rma = new DeliveryOrderRMA
        {
            Id = Guid.NewGuid(),
            RMANo = request.RMANo,
            DeliveryOrderId = request.DeliveryOrderId,
            Date = request.Date ?? DateTime.UtcNow,
            ReferenceNo = request.ReferenceNo,
            ReturnMethod = request.ReturnMethod,
            ReturnType = request.ReturnType,
            ReturnAction = request.ReturnAction,
            SenderCompanyId = request.SenderCompanyId,
            ReceiverCompanyId = request.ReceiverCompanyId,
            Reason = request.Reason,
            Remarks = request.Remarks,
            Status = "Reported",
            CreatedAt = DateTime.UtcNow,
            CreatedById = Guid.Parse(userId)
        };

        if (request.RMAItems != null)
        {
            rma.RMAItems = request.RMAItems.Select(x => new RMAItem
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

        _context.DeliveryOrderRMAs.Add(rma);

        await _context.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("RMAAdded", rma);

        return Ok(rma);
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] UpdateDeliveryOrderRMARequest request)
    {
        var rma = await _context.DeliveryOrderRMAs
            .Include(x => x.RMAItems)
            .FirstOrDefaultAsync(x => x.Id == request.Id);

        if (rma == null)
            return NotFound();

        rma.ReferenceNo = request.ReferenceNo;
        rma.ReturnMethod = request.ReturnMethod;
        rma.ReturnType = request.ReturnType;
        rma.ReturnAction = request.ReturnAction;
        rma.SenderCompanyId = request.SenderCompanyId;
        rma.ReceiverCompanyId = request.ReceiverCompanyId;
        rma.Reason = request.Reason;
        rma.Remarks = request.Remarks;
        rma.UpdatedAt = DateTime.UtcNow;

        _context.RMAItems.RemoveRange(rma.RMAItems);

        if (request.RMAItems != null)
        {
            rma.RMAItems = request.RMAItems.Select(x => new RMAItem
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

        await _context.SaveChangesAsync();

        return Ok(rma);
    }

    [HttpPost("UpdateStatus")]
    public async Task<IActionResult> UpdateStatus(
    Guid id,
    [FromForm] UpdateRMAStatusRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var rma = await _context.DeliveryOrderRMAs
            .FirstOrDefaultAsync(x => x.Id == id);

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

    [HttpDelete("Delete/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var rma = await _context.DeliveryOrderRMAs
            .Include(x => x.RMAItems)
            .Include(x => x.ProofImages)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (rma == null)
            return NotFound();

        _context.RMAItems.RemoveRange(rma.RMAItems);
        _context.RMAProofImages.RemoveRange(rma.ProofImages);
        _context.DeliveryOrderRMAs.Remove(rma);

        await _context.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("RMADeleted", id);

        return Ok("Deleted");
    }

}