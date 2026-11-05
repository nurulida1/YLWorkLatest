
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ActivityLogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ActivityLogController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetMany")]
        public async Task<ActionResult<object>> GetMany(
            int page = 1,
            int pageSize = 10,
            string? filter = null)
        {
            try
            {
                page = Math.Max(1, page);
                pageSize = Math.Clamp(pageSize, 1, 100);

                var query = _context.ActivityLogs
                    .AsNoTracking()
                    .Include(x => x.User)
                    .AsQueryable();

                // Search by action, module, description or user
                if (!string.IsNullOrWhiteSpace(filter))
                {
                    var keyword = filter.Trim().ToLower();

                    query = query.Where(x =>
                        x.Action.ToLower().Contains(keyword) ||
                        x.Module.ToLower().Contains(keyword) ||
                        x.Description.ToLower().Contains(keyword) ||
                        (x.User != null &&
                         x.User.FullName.ToLower().Contains(keyword))
                    );
                }

                var totalElements = await query.CountAsync();

                var items = await query
                    .OrderByDescending(x => x.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => new ActivityLogDto
                    {
                        Title = string.IsNullOrEmpty(x.Module)
                            ? x.Action
                            : $"{x.Module} - {x.Action}",

                        Description = x.Description,

                        User = x.User != null
                            ? x.User.FullName
                            : "System",

                        Date = x.CreatedAt,

                        Icon = x.Icon,

                        Color = x.Color
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
                return StatusCode(500, new
                {
                    Error = "Failed to retrieve activity logs."
                });
            }
        }
    }
}
