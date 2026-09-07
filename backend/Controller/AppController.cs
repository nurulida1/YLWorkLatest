using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MigraDoc.DocumentObjectModel;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using YLWorks.Model.Leave;

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

        Quantity = i.Quantity ?? 0m,   
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

        [HttpGet("GetHrDashboard")]
        [Authorize(Roles = "HR,SuperAdmin,Admin")]
        public async Task<IActionResult> GetHrDashboard()
        {
            var today = DateTime.UtcNow.Date;
            var oneYearAgo = today.AddYears(-1);

            var activeApproved = await _context.Users
                .Where(u => u.IsActive && u.Status == "Approved")
                .Include(u => u.Departments)
                .ToListAsync();

            var totalEmployees = activeApproved.Count;

            var resignedStaff = await _context.Users
                .CountAsync(u => !u.IsActive && u.JoinedDate != null);

            var newStaffUnderOneYear = activeApproved
                .Count(u => u.JoinedDate.HasValue && u.JoinedDate.Value.Date >= oneYearAgo);

            var pendingLeave = await _context.LeaveRequests
                .CountAsync(r => r.Status == LeaveRequestStatus.Pending);

            var todayLeaveRows = await _context.LeaveRequests
                .AsNoTracking()
                .Include(r => r.Employee)
                .Include(r => r.LeaveType)
                .Where(r => r.Status == LeaveRequestStatus.Approved)
                .Where(r => r.StartDate.Date <= today && r.EndDate.Date >= today)
                .OrderBy(r => r.Employee.FullName)
                .ToListAsync();

            var onLeaveToday = todayLeaveRows
                .Select(r => r.EmployeeId)
                .Distinct()
                .Count();

            var assumedPresentToday = Math.Max(0, totalEmployees - onLeaveToday);

            var departmentCounts = new Dictionary<Guid, (string Name, int Count)>();

            foreach (var user in activeApproved)
            {
                if (user.Departments == null || user.Departments.Count == 0)
                {
                    var unassignedKey = Guid.Empty;
                    if (departmentCounts.TryGetValue(unassignedKey, out var existing))
                        departmentCounts[unassignedKey] = (existing.Name, existing.Count + 1);
                    else
                        departmentCounts[unassignedKey] = ("Unassigned", 1);
                }
                else
                {
                    foreach (var dept in user.Departments)
                    {
                        if (departmentCounts.TryGetValue(dept.Id, out var existing))
                            departmentCounts[dept.Id] = (existing.Name, existing.Count + 1);
                        else
                            departmentCounts[dept.Id] = (dept.Name, 1);
                    }
                }
            }

            var departmentDistribution = departmentCounts
                .Select(kvp => new DepartmentDistributionDto
                {
                    DepartmentId = kvp.Key,
                    Department = kvp.Value.Name,
                    Count = kvp.Value.Count
                })
                .OrderByDescending(d => d.Count)
                .ThenBy(d => d.Department)
                .ToList();

            var todayLeaveEvents = todayLeaveRows.Select(r => new LeaveCalendarEventDto
            {
                RequestId = r.Id,
                EmployeeId = r.EmployeeId,
                EmployeeName = r.Employee.FullName,
                StartDate = r.StartDate.Date,
                EndDate = r.EndDate.Date,
                LeaveTypeId = r.LeaveTypeId,
                LeaveTypeName = r.LeaveType.Name,
                Reason = r.Reason,
                TotalDays = r.TotalDays,
                StartSession = r.StartSession.ToString(),
                EndSession = r.EndSession.ToString(),
                CanViewDetails = true
            }).ToList();

            var dashboard = new HrDashboardDto
            {
                TotalEmployees = totalEmployees,
                PendingLeave = pendingLeave,
                OnLeaveToday = onLeaveToday,
                AssumedPresentToday = assumedPresentToday,
                ResignedStaff = resignedStaff,
                NewStaffUnderOneYear = newStaffUnderOneYear,
                DepartmentDistribution = departmentDistribution,
                TodayLeaveEvents = todayLeaveEvents
            };

            return Ok(dashboard);
        }

        [HttpGet("GetSuperAdminDashboard")]
        public async Task<IActionResult> GetSuperAdminDashboard()
        {
            var users = await _context.Users
                .Include(x => x.Departments)
                .ToListAsync();

            var inventories = await _context.Inventories.ToListAsync();

            var dashboard = new SuperAdminDashboardDto
            {
                TotalUsers = users.Count,

                ActiveUsers = users.Count(x => x.IsActive),

                InactiveUsers = users.Count(x => !x.IsActive),

                PendingApprovals = users.Count(x => x.Status == "Pending"),

                TotalDepartments = await _context.Departments.CountAsync(),

                TotalInventoryItems = inventories.Count,

                LowStockItems = inventories.Count(x =>
                    x.Status == "In Stock"
                    && x.ParLevel.HasValue
                    && x.Quantity < x.ParLevel),

                FaultyItems = inventories.Count(x =>
                    x.Status == "Faulty"
                    || x.Status == "Under Repair"),

                PendingUsers = users
                    .Where(x => x.Status == "Pending")
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(5)
                    .Select(x => new PendingUserDto
                    {
                        Id = x.Id,
                        FullName = x.FullName,
                        JobTitle = x.JobTitle ?? "-",
                        Department = x.Departments
                            .Select(d => d.Name)
                            .FirstOrDefault() ?? "-",
                        CreatedAt = x.CreatedAt
                    })
                    .ToList()
            };

            dashboard.Activities = await GetRecentActivities();

            return Ok(dashboard);
        }

        private async Task<List<ActivityLogDto>> GetRecentActivities()
        {
            return await _context.ActivityLogs
                .Include(x => x.User)
                .OrderByDescending(x => x.CreatedAt)
                .Take(10)
                .Select(x => new ActivityLogDto
                {
                    Title = x.Action,
                    Description = x.Description,
                    User = x.User == null ? "System" : x.User.FullName,
                    Date = x.CreatedAt,
                    Icon = x.Icon,
                    Color = x.Color
                })
                .ToListAsync();
        }

    }
}
