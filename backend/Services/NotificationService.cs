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
            string type)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTimeHelper.Now()
            };


            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
        }
    }
}