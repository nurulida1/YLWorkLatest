using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MigraDoc.DocumentObjectModel;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        public AppController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;
        }
        
        [HttpGet("GetLogisticDashboard")]
        public async Task<IActionResult> GetLogisticDashboard()
        {
            var inventories = await _context.Inventories
                .Include(i => i.Category).Include(i => i.Section)
                .ToListAsync();

            // helper (avoid repeating logic)
            var inStock = inventories
                .Where(i => i.Status == "In Stock")
                .ToList();

            var lowStock = inStock
                .Where(i => i.Status == "In Stock" && (i.ParLevel.HasValue && i.Quantity < i.ParLevel.Value))
                .ToList();

            var faulty = inventories
                .Where(i => i.Status == "Faulty" || i.Status == "Under Repair")
                .ToList();

            var result = new InventoryDashboardResponseDto
            {
                // =====================
                // DASHBOARD CARDS
                // =====================
                TotalItems = inventories.Count,

                LowStockItems = lowStock.Count,

                FaultyItems = faulty.Count,

                PendingRequests = await _context.MaterialRequests
                    .CountAsync(r => r.Status == "Pending"),

                // =====================
                // RESTOCK ALERT
                // =====================
                RestockAlerts = lowStock
                    .Select(i => new InventoryRestockDto
                    {
                        Id = i.Id,
                        Name = i.ItemName,
                        Quantity = i.Quantity,
                        ParLevel = i.ParLevel ?? 0,
                        Section = i.Section == null
            ? null
            : new SectionDto
            {
                Name = i.Section.Name
            },
                        Brand = i.Brand
                    })
                    .OrderBy(i => i.Quantity)
                    .Take(5)
                    .ToList(),

                // =====================
                // CATEGORY CHART
                // =====================
                CategoryChart = inStock
                    .GroupBy(i => i.Category?.Name ?? "Unassigned")
                    .Select(g => new InventoryCategoryChartDto
                    {
                        CategoryName = g.Key,
                        Total = g.Count()
                    })
                    .OrderByDescending(x => x.Total)
                    .ToList()
            };

            return Ok(result);
        }

    }
}
