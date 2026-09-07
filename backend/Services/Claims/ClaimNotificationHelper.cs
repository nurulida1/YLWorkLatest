using Microsoft.AspNetCore.SignalR;
using WebApplication1.Helpers;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Services.Claims
{
    public class ClaimNotificationHelper
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly ILogger<ClaimNotificationHelper> _logger;

        public ClaimNotificationHelper(
            AppDbContext context,
            IHubContext<NotificationHub> hub,
            ILogger<ClaimNotificationHelper> logger)
        {
            _context = context;
            _hub = hub;
            _logger = logger;
        }

        public async Task SendClaimNotificationAsync(
            Guid recipientId,
            Guid claimRequestId,
            string subType,
            string message)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = recipientId,
                Title = $"Claim {subType}",
                Message = message,
                Type = $"Claim.{subType}",
                Link = $"/claims/{claimRequestId}",
                ClaimRequestId = claimRequestId,
                IsRead = false,
                CreatedAt = DateTimeHelper.Now()
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            await _hub.Clients.All.SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.Title,
                notification.Message,
                notification.Type,
                notification.Link,
                notification.UserId,
                notification.ClaimRequestId,
                notification.IsRead,
                notification.CreatedAt
            });

            _logger.LogInformation(
                "Claim notification {Type} sent to user {UserId} for request {RequestId}",
                subType, recipientId, claimRequestId);
        }
    }
}
