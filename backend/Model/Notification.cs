using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class Notification: BaseEntity
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;
        // Approval / Rejection / System / etc

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        // Navigation
        public User User { get; set; } = null!;
    }
}