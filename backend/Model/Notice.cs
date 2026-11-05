using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class Notice : BaseEntity
    {
        public Guid Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        public DateTime PublishDate { get; set; } = DateTime.UtcNow;

        public DateTime? ExpiryDate { get; set; }

        public bool IsPinned { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public Guid CreatedById { get; set; }

        public User? CreatedBy { get; set; }
    }

    public class NoticeDto
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        public DateTime PublishDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public bool IsPinned { get; set; }

        public bool IsActive { get; set; }

        public Guid CreatedById { get; set; }

        public string? CreatedByName { get; set; }
    }

    public class CreateNoticeRequest
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        public DateTime? PublishDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public bool IsPinned { get; set; } = false;
    }

    public class UpdateNoticeRequest
    {
        public Guid Id { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        public DateTime? PublishDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public bool IsPinned { get; set; }

        public bool IsActive { get; set; }
    }
}