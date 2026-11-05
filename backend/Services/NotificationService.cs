using YLWorks.Data;
using YLWorks.Model;
using WebApplication1.Helpers;

namespace YLWorks.Services
{
    public class NotificationService
    {
        private readonly AppDbContext _context;

        public NotificationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(
            Guid userId,
            string title,
            string message,
            string type,
            string? link = null)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                Link = link,
                IsRead = false,
                CreatedAt = DateTimeHelper.Now()
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
    }
}