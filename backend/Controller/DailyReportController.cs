
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using YLWorks.Model;
using YLWorks.DTO;
using YLWorks.Data;
using YLWorks.Hubs;

namespace YLWorks.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DailyReportController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public DailyReportController(
            AppDbContext context,
            IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // ==========================================
        // GET: api/DailyReport/GetMyReports
        // ==========================================
        [HttpGet("GetMyReports")]
        public async Task<IActionResult> GetMyReports()
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            var reports = await _context.DailyReports
                .AsNoTracking()
                .Where(x =>
                    // 1. Employees can always see their own reports
                    x.EmployeeId == currentUserId

                    // 2. Project leaders can only see non-draft reports
                    || (
                        x.Status != "Draft" &&
                        x.Project != null &&
                        x.Project.ProjectLeaderId == currentUserId
                    )

                    // 3. Task assigners can only see non-draft reports
                    || (
                        x.Status != "Draft" &&
                        x.DailyReportTasks.Any(t =>
                            t.StaffTask != null &&
                            t.StaffTask.AssignedById == currentUserId
                        )
                    )
                )
                .OrderByDescending(x => x.ReportDate)
                .Select(x => new
                {
                    x.Id,
                    x.EmployeeId,

                    EmployeeName = x.Employee != null
                        ? x.Employee.FullName
                        : null,

                    x.ProjectId,

                    ProjectName = x.Project != null
                        ? x.Project.ProjectTitle
                        : null,

                    x.ReportDate,
                    x.CompletedWork,
                    x.InProgressWork,
                    x.Issues,
                    x.NextDayPlan,
                    x.Status,
                    x.SubmittedAt,
                    x.ReviewedAt,
                    x.ReviewRemarks,

                    CanReview = x.Status == "Submitted" &&
                        x.DailyReportTasks.Any(t =>
                            t.StaffTask != null &&
                            t.StaffTask.AssignedById == currentUserId
                        ),

                    Tasks = x.DailyReportTasks.Select(t => new
                    {
                        t.Id,
                        t.StaffTaskId,

                        TaskTitle = t.StaffTask != null
                            ? t.StaffTask.Title
                            : null,

                        t.WorkDescription,
                        t.HoursSpent
                    })
                })
                .ToListAsync();

            return Ok(reports);
        }

        // ==========================================
        // GET: api/DailyReport/GetById?id={id}
        // ==========================================
        [HttpGet("GetById")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            var report = await _context.DailyReports
                .AsNoTracking()
                .Include(x => x.Employee)
                .Include(x => x.Project)
                .Include(x => x.DailyReportTasks)
                    .ThenInclude(x => x.StaffTask)
                .Include(x => x.Attachments)
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    (
                        // 1. Report owner can always view their own report
                        x.EmployeeId == currentUserId

                        // 2. Project leader can view submitted reports only
                        || (
                            x.Status != "Draft" &&
                            x.Project != null &&
                            x.Project.ProjectLeaderId == currentUserId
                        )

                        // 3. Task assigner can view submitted reports only
                        || (
                            x.Status != "Draft" &&
                            x.DailyReportTasks.Any(t =>
                                t.StaffTask != null &&
                                t.StaffTask.AssignedById == currentUserId
                            )
                        )
                    )
                );

            if (report == null)
                return NotFound(new { Error = "Daily report not found." });

            return Ok(report);
        }

        // ==========================================
        // POST: api/DailyReport/Create
        // ==========================================
        [HttpPost("Create")]
        public async Task<IActionResult> Create(
            [FromBody] CreateDailyReportRequest request)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var reportDate = request.ReportDate.Date;

            // Prevent duplicate report for the same employee and date.
            var existingReport = await _context.DailyReports
                .AnyAsync(x =>
                    x.EmployeeId == currentUserId &&
                    x.ReportDate.Date == reportDate);

            if (existingReport)
            {
                return BadRequest(new
                {
                    Error = "You have already created a report for this date."
                });
            }

            // Validate optional project.
            if (request.ProjectId.HasValue)
            {
                var projectExists = await _context.Projects
                    .AnyAsync(x => x.Id == request.ProjectId.Value);

                if (!projectExists)
                {
                    return BadRequest(new
                    {
                        Error = "Invalid project."
                    });
                }
            }

            var reportTasks = request.Tasks ??
                new List<DailyReportTaskRequest>();

            var taskIds = reportTasks
                .Select(x => x.StaffTaskId)
                .Distinct()
                .ToList();

            // Validate tasks against the selected project.
            var validTaskIds = await _context.StaffTasks
                .Where(x =>
                    taskIds.Contains(x.Id) &&
                    x.AssignedToId == currentUserId &&
                    x.ProjectId == request.ProjectId &&
                    x.Status != StaffTaskStatus.Cancelled)
                .Select(x => x.Id)
                .ToListAsync();

            if (validTaskIds.Count != taskIds.Count)
            {
                return BadRequest(new
                {
                    Error = "One or more selected tasks are invalid, not assigned to you, or do not belong to the selected project."
                });
            }

            // Prevent duplicate task entries in one report.
            if (taskIds.Count != reportTasks.Count)
            {
                return BadRequest(new
                {
                    Error = "Duplicate staff tasks are not allowed."
                });
            }

            var report = new DailyReport
            {
                Id = Guid.NewGuid(),
                EmployeeId = currentUserId,
                ProjectId = request.ProjectId,
                ReportDate = reportDate,
                CompletedWork = request.CompletedWork,
                InProgressWork = request.InProgressWork,
                Issues = request.Issues,
                NextDayPlan = request.NextDayPlan,
                Status = "Draft"
            };

            foreach (var task in reportTasks)
            {
                report.DailyReportTasks.Add(new DailyReportTask
                {
                    Id = Guid.NewGuid(),
                    StaffTaskId = task.StaffTaskId,
                    WorkDescription = task.WorkDescription,
                    HoursSpent = task.HoursSpent
                });
            }

            _context.DailyReports.Add(report);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Daily report created successfully.",
                Id = report.Id
            });
        }

        // ==========================================
        // PUT: api/DailyReport/Update
        // ==========================================
        [HttpPut("Update")]
        public async Task<IActionResult> Update(
            [FromBody] UpdateDailyReportRequest request)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var report = await _context.DailyReports
                .Include(x => x.DailyReportTasks)
                .FirstOrDefaultAsync(x =>
                    x.Id == request.Id &&
                    x.EmployeeId == currentUserId);

            if (report == null)
                return NotFound(new { Error = "Daily report not found." });

            if (report.Status != "Draft")
            {
                return BadRequest(new
                {
                    Error = "Only draft reports can be updated."
                });
            }

            // Validate optional project.
            if (request.ProjectId.HasValue)
            {
                var projectExists = await _context.Projects
                    .AnyAsync(x => x.Id == request.ProjectId.Value);

                if (!projectExists)
                {
                    return BadRequest(new
                    {
                        Error = "Invalid project."
                    });
                }
            }

            var reportDate = request.ReportDate.Date;

            // Prevent duplicate report for the same employee and date.
            var duplicateDate = await _context.DailyReports
                .AnyAsync(x =>
                    x.Id != report.Id &&
                    x.EmployeeId == currentUserId &&
                    x.ReportDate.Date == reportDate);

            if (duplicateDate)
            {
                return BadRequest(new
                {
                    Error = "You already have a report for this date."
                });
            }

            var reportTasks = request.Tasks ??
                new List<DailyReportTaskRequest>();

            var taskIds = reportTasks
                .Select(x => x.StaffTaskId)
                .Distinct()
                .ToList();

            // Validate tasks against the selected project.
            var validTaskIds = await _context.StaffTasks
                .Where(x =>
                    taskIds.Contains(x.Id) &&
                    x.AssignedToId == currentUserId &&
                    x.ProjectId == request.ProjectId &&
                    x.Status != StaffTaskStatus.Cancelled)
                .Select(x => x.Id)
                .ToListAsync();

            if (validTaskIds.Count != taskIds.Count)
            {
                return BadRequest(new
                {
                    Error = "One or more selected tasks are invalid, not assigned to you, or do not belong to the selected project."
                });
            }

            // Prevent duplicate task entries in one report.
            if (taskIds.Count != reportTasks.Count)
            {
                return BadRequest(new
                {
                    Error = "Duplicate staff tasks are not allowed."
                });
            }

            report.ProjectId = request.ProjectId;
            report.ReportDate = reportDate;
            report.CompletedWork = request.CompletedWork;
            report.InProgressWork = request.InProgressWork;
            report.Issues = request.Issues;
            report.NextDayPlan = request.NextDayPlan;

            // Replace linked tasks.
            _context.DailyReportTasks.RemoveRange(
                report.DailyReportTasks);

            report.DailyReportTasks.Clear();

            foreach (var task in reportTasks)
            {
                report.DailyReportTasks.Add(new DailyReportTask
                {
                    Id = Guid.NewGuid(),
                    DailyReportId = report.Id,
                    StaffTaskId = task.StaffTaskId,
                    WorkDescription = task.WorkDescription,
                    HoursSpent = task.HoursSpent
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Daily report updated successfully."
            });
        }

        // ==========================================
        // PUT: api/DailyReport/Submit?id={id}
        // ==========================================
        [HttpPut("Submit")]
        public async Task<IActionResult> Submit(Guid id)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            var report = await _context.DailyReports
                .Include(x => x.Employee)
                .Include(x => x.DailyReportTasks)
                    .ThenInclude(x => x.StaffTask)
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.EmployeeId == currentUserId);

            if (report == null)
                return NotFound(new { Error = "Daily report not found." });

            if (report.Status != "Draft")
            {
                return BadRequest(new
                {
                    Error = "Only draft reports can be submitted."
                });
            }

            report.Status = "Submitted";
            report.SubmittedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Get all unique task assigners.
            var assignerIds = report.DailyReportTasks
                .Where(x => x.StaffTask != null)
                .Select(x => x.StaffTask!.AssignedById)
                .Where(x => x != currentUserId)
                .Distinct()
                .ToList();

            // Notify every linked task assigner.
            foreach (var assignerId in assignerIds)
            {
                await SendNotification(
                    assignerId,
                    "Daily Report Submitted",
                    $"{report.Employee?.FullName ?? "An employee"} has submitted a daily report awaiting your review."
                );
            }

            return Ok(new
            {
                Message = "Daily report submitted successfully."
            });
        }

        // ==========================================
        // DELETE: api/DailyReport/Delete?id={id}
        // ==========================================
        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            var report = await _context.DailyReports
                .Include(x => x.DailyReportTasks)
                .Include(x => x.Attachments)
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.EmployeeId == currentUserId);

            if (report == null)
                return NotFound(new { Error = "Daily report not found." });

            if (report.Status != "Draft")
            {
                return BadRequest(new
                {
                    Error = "Only draft reports can be deleted."
                });
            }

            _context.DailyReports.Remove(report);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Daily report deleted successfully."
            });
        }

        // ==========================================
        // GET: api/DailyReport/GetMyStaffTasks?projectId={projectId}
        // ==========================================
        [HttpGet("GetMyStaffTasks")]
        public async Task<IActionResult> GetMyStaffTasks(
            [FromQuery] Guid? projectId)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            var query = _context.StaffTasks
                .AsNoTracking()
                .Where(x =>
                    x.AssignedToId == currentUserId &&
                    x.Status != StaffTaskStatus.Cancelled &&
                    x.ProjectId == projectId);

            var tasks = await query
                .OrderBy(x => x.Title)
                .Select(x => new
                {
                    Id = x.Id,
                    Title = x.Title,
                    ProjectId = x.ProjectId,
                    Status = x.Status,
                    Priority = x.Priority,
                    DueDate = x.DueDate
                })
                .ToListAsync();

            return Ok(tasks);
        }

        // ==========================================
        // SEND NOTIFICATION
        // ==========================================
        private async Task SendNotification(
            Guid userId,
            string title,
            string message)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = "DailyReport",
                Link = "/daily-report",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            await _hub.Clients
                .Group($"user-{userId}")
                .SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    userId = notification.UserId,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type,
                    link = notification.Link,
                    isRead = notification.IsRead,
                    createdAt = notification.CreatedAt
                });
        }

        // ==========================================
        // CURRENT USER
        // ==========================================
        private bool TryGetCurrentUserId(out Guid userId)
        {
            userId = Guid.Empty;

            var userIdValue =
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue("userId");

            return Guid.TryParse(userIdValue, out userId);
        }

        // ==========================================
        // PUT: api/DailyReport/Approve?id={id}
        // ==========================================
        [HttpPut("Approve")]
        public async Task<IActionResult> Approve(Guid id)
        {
            return await ReviewReport(id, "Approved", null);
        }

        // ==========================================
        // PUT: api/DailyReport/Reject?id={id}&remarks={remarks}
        // ==========================================
        [HttpPut("Reject")]
        public async Task<IActionResult> Reject(
            Guid id,
            [FromQuery] string? remarks)
        {
            if (string.IsNullOrWhiteSpace(remarks))
            {
                return BadRequest(new
                {
                    Error = "Please provide a reason for rejecting this report."
                });
            }

            return await ReviewReport(id, "Rejected", remarks.Trim());
        }

        // ==========================================
        // REVIEW REPORT
        // Only linked task assigners can approve/reject
        // ==========================================
        private async Task<IActionResult> ReviewReport(
            Guid id,
            string newStatus,
            string? remarks)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            // Get report owner and verify task assigner.
            var report = await _context.DailyReports
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.EmployeeId,

                    IsTaskAssigner = x.DailyReportTasks.Any(t =>
                        t.StaffTask != null &&
                        t.StaffTask.AssignedById == currentUserId
                    )
                })
                .FirstOrDefaultAsync();

            if (report == null || !report.IsTaskAssigner)
            {
                return NotFound(new
                {
                    Error = "Daily report not found or you are not authorized to review it."
                });
            }

            var reviewedAt = DateTime.UtcNow;

            // Only the first assigner can review.
            var updated = await _context.DailyReports
                .Where(x =>
                    x.Id == id &&
                    x.Status == "Submitted")
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.Status, newStatus)
                    .SetProperty(x => x.ReviewedAt, reviewedAt)
                    .SetProperty(x => x.ReviewRemarks, remarks)
                );

            if (updated == 0)
            {
                return BadRequest(new
                {
                    Error = "This report has already been reviewed or is not submitted."
                });
            }

            // Notify the employee who submitted the report.
            await SendNotification(
                report.EmployeeId,
                newStatus == "Approved"
                    ? "Daily Report Approved"
                    : "Daily Report Rejected",
                newStatus == "Approved"
                    ? "Your daily report has been approved."
                    : $"Your daily report has been rejected. Remarks: {remarks}"
            );

            return Ok(new
            {
                Message = newStatus == "Approved"
                    ? "Daily report approved successfully."
                    : "Daily report rejected successfully.",
                Status = newStatus
            });
        }
    }
}
