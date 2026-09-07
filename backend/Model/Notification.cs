using System.ComponentModel.DataAnnotations;
using WebApplication1.Helpers;

namespace YLWorks.Model
{
    public class Notification: BaseEntity
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;
        // Approval / Rejection / System / Leave.* / etc

        public string? Link { get; set; }

        public Guid? LeaveRequestId { get; set; }

        public Guid? ClaimRequestId { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTimeHelper.Now();


        // Navigation
        public User User { get; set; } = null!;
    }
}