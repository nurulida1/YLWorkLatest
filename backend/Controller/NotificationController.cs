using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Hubs;
using WebApplication1.Helpers;

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

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = Guid.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier)!.Value
            );

            var notifications = await _context.Notifications
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpGet("UnreadCount")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
                return Unauthorized();

            var count = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            return Ok(new
            {
                success = true,
                unreadCount = count
            });
        }

        [HttpPut("MarkRead")]
        public async Task<IActionResult> MarkAsRead([FromQuery] Guid id)
        {
            if (id == Guid.Empty)
                return BadRequest(new { success = false, message = "Invalid notification ID." });

            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
                return Unauthorized();

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return NotFound(new { success = false, message = "Notification not found." });

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                notification.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, message = "Notification marked as read." });
        }

        [HttpPut("MarkAllRead")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
                return Unauthorized();

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.UpdatedAt = DateTimeHelper.Now();
            }

            await _context.SaveChangesAsync();

            var unreadCount = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            await _hub.Clients.Group($"user-{userId}")
                .SendAsync("UpdateUnreadCount", new
                {
                    userId = userId,
                    unreadCount = unreadCount
                });

            return Ok(new
            {
                success = true,
                message = "Notifications marked as read.",
                unreadCount
            });
        }

    }
}