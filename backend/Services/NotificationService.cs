using YLWorks.Data;
using YLWorks.Model;

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
            int userId,
            string title,
            string message,
            string type)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };


            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
        }
    }
}