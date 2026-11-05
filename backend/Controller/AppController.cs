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
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetSuperAdminDashboard()
        {
            // ============================
            // USER SUMMARY
            // ============================

            var totalUsers = await _context.Users
                .CountAsync();

            var activeUsers = await _context.Users
                .CountAsync(x => x.IsActive);

            var inactiveUsers = await _context.Users
                .CountAsync(x => !x.IsActive);

            var pendingApprovals = await _context.Users
                .CountAsync(x => x.Status == "Pending");

            // ============================
            // INVENTORY SUMMARY
            // ============================

            var totalInventoryItems = await _context.Inventories
                .CountAsync();

            var lowStockItems = await _context.Inventories
                .CountAsync(x =>
                    x.Status == "In Stock" &&
                    x.ParLevel.HasValue &&
                    x.Quantity < x.ParLevel.Value);

            var faultyItems = await _context.Inventories
                .CountAsync(x =>
                    x.Status == "Faulty" ||
                    x.Status == "Under Repair");

            // ============================
            // DEPARTMENT SUMMARY
            // ============================

            var totalDepartments = await _context.Departments
                .CountAsync();

            // ============================
            // LATEST PENDING USERS
            // ============================

            var pendingUsers = await _context.Users
                .Where(x => x.Status == "Pending")
                .Include(x => x.Departments)
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
                .ToListAsync();

            // ============================
            // DASHBOARD RESPONSE
            // ============================

            var dashboard = new SuperAdminDashboardDto
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                InactiveUsers = inactiveUsers,
                PendingApprovals = pendingApprovals,

                TotalDepartments = totalDepartments,

                TotalInventoryItems = totalInventoryItems,
                LowStockItems = lowStockItems,
                FaultyItems = faultyItems,

                PendingUsers = pendingUsers,

                Activities = await GetRecentActivities()
            };

            return Ok(new
            {
                success = true,
                data = dashboard
            });
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

        [HttpGet("GetStaffDashboard")]
        [Authorize]
        public async Task<IActionResult> GetStaffDashboard()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (!Guid.TryParse(userId, out var employeeId))
                return Unauthorized();

            var employee = await _context.Users
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u =>
                    u.Id == employeeId &&
                    u.IsActive &&
                    u.Status == "Approved");

            if (employee == null)
                return NotFound("Employee not found.");

            var today = DateTime.Today;

            // Pending leave applications
            var pendingLeave = await _context.LeaveRequests
                .CountAsync(r =>
                    r.EmployeeId == employeeId &&
                    r.Status == LeaveRequestStatus.Pending);

            // Approved leave today
            var onLeaveToday = await _context.LeaveRequests
                .AnyAsync(r =>
                    r.EmployeeId == employeeId &&
                    r.Status == LeaveRequestStatus.Approved &&
                    r.StartDate.Date <= today &&
                    r.EndDate.Date >= today);

            // Latest active notices
            var latestNotices = await _context.Notices
                .Where(n =>
                    n.IsActive &&
                    n.PublishDate <= DateTime.Now &&
                    (n.ExpiryDate == null || n.ExpiryDate >= DateTime.Now))
                .OrderByDescending(n => n.IsPinned)
                .ThenByDescending(n => n.PublishDate)
                .Take(5)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Content,
                    n.PublishDate,
                    n.ExpiryDate,
                    n.IsPinned
                })
                .ToListAsync();

            // Team members from the same department
            var departmentIds = employee.Departments
                .Select(d => d.Id)
                .ToList();

            var teamAbsences = new List<object>();

            if (departmentIds.Any())
            {
                var absenceRows = await _context.LeaveRequests
                    .AsNoTracking()
                    .Where(r =>
                        r.Status == LeaveRequestStatus.Approved &&
                        r.StartDate.Date <= today &&
                        r.EndDate.Date >= today &&
                        r.Employee.IsActive &&
                        r.Employee.Status == "Approved" &&
                        r.Employee.Departments.Any(d =>
                            departmentIds.Contains(d.Id)))
                    .Select(r => new
                    {
                        r.EmployeeId,
                        EmployeeName = r.Employee.FullName,
                        Department = r.Employee.Departments
                            .Where(d => departmentIds.Contains(d.Id))
                            .Select(d => d.Name)
                            .FirstOrDefault() ?? "-",
                        LeaveTypeName = r.LeaveType.Name,
                        r.StartDate,
                        r.EndDate
                    })
                    .ToListAsync();

                // One entry per employee, even if they have overlapping leave records.
                teamAbsences = absenceRows
                    .GroupBy(r => r.EmployeeId)
                    .Select(g =>
                    {
                        var absence = g.First();

                        return (object)new
                        {
                            employeeId = absence.EmployeeId,
                            employeeName = absence.EmployeeName,
                            department = absence.Department,
                            leaveTypeName = absence.LeaveTypeName,
                            startDate = absence.StartDate,
                            endDate = absence.EndDate
                        };
                    })
                    .ToList();
            }

            return Ok(new
            {
                success = true,
                data = new
                {
                    employeeName = employee.FullName,

                    department = employee.Departments
                        .Select(d => d.Name)
                        .FirstOrDefault() ?? "-",

                    pendingLeave,
                    onLeaveToday,
                    latestNotices,
                    teamAbsences
                }
            });
        }


        [HttpGet("GetPendingHardwareApprovals")]
        [Authorize]
        public async Task<IActionResult> GetPendingHardwareApprovals()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var departmentIds = await _context.Departments
                .AsNoTracking()
                .Where(d => d.IsActive && d.HodId == userId)
                .Select(d => d.Id)
                .ToListAsync();

            if (!departmentIds.Any())
                return Ok(new List<object>());

            var requests = await _context.HardwareRequests
                .AsNoTracking()
                .Include(r => r.Items)
                .Include(r => r.RequestedBy)
                .Include(r => r.ResponsibleDepartment)
                .Where(r =>
                    r.Status == "Pending" &&
                    r.ResponsibleDepartmentId.HasValue &&
                    departmentIds.Contains(r.ResponsibleDepartmentId.Value))
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.RequestType,
                    r.Subject,
                    r.Description,
                    r.Priority,
                    r.Status,

                    r.ResponsibleDepartmentId,
                    ResponsibleDepartment = r.ResponsibleDepartment != null
                        ? r.ResponsibleDepartment.Name
                        : null,

                    r.ProjectName,
                    r.SiteName,
                    r.Location,
                    r.LocationDetails,
                    r.NeededBy,

                    RequestedById = r.RequestedById,
                    RequestedBy = r.RequestedBy != null
                        ? r.RequestedBy.FullName
                        : null,

                    Items = r.Items.Select(i => new
                    {
                        i.Id,
                        i.InventoryId,
                        i.ItemName,
                        i.ItemCode,
                        i.Description,
                        i.Unit,
                        i.RequestedQuantity,
                        i.ApprovedQuantity,
                        i.IssuedQuantity,
                        i.ReservedQuantity,
                        i.Status,
                        i.Remarks
                    }).ToList()
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpGet("GetTodayMeetings")]
        [Authorize]
        public async Task<IActionResult> GetTodayMeetings([FromQuery] DateTime? date)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var today = (date ?? DateTime.Today).Date;
            var tomorrow = today.AddDays(1);

            var meetings = await _context.Meetings
                .AsNoTracking()
                .Where(m =>
                    m.MeetingDate >= today &&
                    m.MeetingDate < tomorrow &&
                    (
                        m.OrganizerId == userId ||
                        m.Participants.Any(p => p.UserId == userId)
                    ))
                .OrderBy(m => m.MeetingTime)
                .ThenBy(m => m.Title)
                .Select(m => new
                {
                    id = m.Id,
                    title = m.Title,
                    description = m.Description,
                    meetingDate = m.MeetingDate,

                    meetingTime = m.MeetingTime.HasValue
                        ? m.MeetingTime.Value.ToString(@"hh\:mm")
                        : null,

                    location = m.Location,
                    meetingLink = m.MeetingLink,

                    organizerId = m.OrganizerId,
                    organizerName = m.Organizer != null
                        ? m.Organizer.FullName
                        : "Unknown",

                    participants = m.Participants.Select(p => new
                    {
                        userId = p.UserId,
                        fullName = p.User != null
                            ? p.User.FullName
                            : "Unknown",
                        hasAccepted = p.HasAccepted,
                        hasJoined = p.HasJoined
                    }).ToList()
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    date = today,
                    totalMeetings = meetings.Count,
                    meetings
                }
            });
        }
    }
}
