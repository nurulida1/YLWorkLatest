using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class Notification: BaseEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Message { get; set; } = string.Empty;
        public string? Type { get; set; } // e.g., "Quotation", "Job", "WorkOrder"
        public string? Link { get; set; }
        public bool IsRead { get; set; } = false;
        public Guid? UserId { get; set; }
        public Guid? CreatedBy { get; set; }
        public Guid? RoleId { get; set; }

    }
}