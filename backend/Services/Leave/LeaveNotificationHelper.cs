using Microsoft.AspNetCore.SignalR;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;

namespace YLWorks.Services.Leave
{
    public class LeaveNotificationHelper
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly ILogger<LeaveNotificationHelper> _logger;

        public LeaveNotificationHelper(
            AppDbContext context,
            IHubContext<NotificationHub> hub,
            ILogger<LeaveNotificationHelper> logger)
        {
            _context = context;
            _hub = hub;
            _logger = logger;
        }

        public async Task SendLeaveNotificationAsync(
            Guid recipientId,
            Guid leaveRequestId,
            string subType,
            string message)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = recipientId,
                Message = message,
                Type = $"Leave.{subType}",
                Link = $"/leave/{leaveRequestId}",
                LeaveRequestId = leaveRequestId,
                IsRead = false,
                CreatedAt = DateTimeHelper.Now()
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.Message,
                notification.Type,
                notification.Link,
                notification.UserId,
                notification.LeaveRequestId,
                notification.IsRead,
                notification.CreatedAt
            });

            _logger.LogInformation(
                "Leave notification {Type} sent to user {UserId} for request {RequestId}",
                subType, recipientId, leaveRequestId);
        }
    }
}
