using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Hubs;

namespace WebApplication1.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public NotificationController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;
        }


        [HttpGet("GetAll")]
        public async Task<IActionResult> GetNotifications([FromQuery] Guid userId, [FromQuery] bool unreadOnly = false)
        {

            var query = _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .AsQueryable();

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            var notifications = await query.Take(20).ToListAsync();

            return Ok(notifications);
        }


        // GET: api/notification/unreadcount
        [HttpGet("UnreadCount")]
        public async Task<IActionResult> GetUnreadCount(Guid? userId = null)
        {
            try
            {
                var query = _context.Notifications.AsQueryable();

                if (userId.HasValue)
                {
                    query = query.Where(n => n.UserId == userId);
                }

                var count = await query.CountAsync(n => !n.IsRead);
                return Ok(new { success = true, unreadCount = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("MarkRead")]
        public async Task<IActionResult> MarkAsRead([FromQuery] int id)
        {
            if (id <= 0)
                return BadRequest(new { Success = false, Message = "Invalid notification ID." });

            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
                return NotFound(new { Success = false, Message = "Notification not found." });

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                notification.UpdatedAt = DateTime.UtcNow; // optional if you track update time
                await _context.SaveChangesAsync();
            }

            return Ok(new { Success = true, Message = "Notification marked as read." });
        }


        [HttpPut("MarkAllRead")]
        public async Task<IActionResult> MarkAllAsRead([FromQuery] Guid userId)
        {
            Console.WriteLine($"MarkAllRead triggered for userId={userId}");

            // Find all unread notifications for the user
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            Console.WriteLine($"Unread found: {notifications.Count}");

            if (!notifications.Any())
                return Ok(new { success = true, message = "No unread notifications.", unreadCount = 0 });

            // Mark them all as read
            foreach (var n in notifications)
            {
                n.IsRead = true;
                n.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            // Get updated unread count
            var unreadCount = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            // Notify front-end via SignalR
            await _hub.Clients.All.SendAsync("UpdateUnreadCount", new
            {
                UserId = userId,
                UnreadCount = unreadCount
            });

            return Ok(new
            {
                success = true,
                message = "All notifications marked as read.",
                unreadCount
            });
        }


    }
}