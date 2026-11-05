
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model
{
    public class OfficeHandbook
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Slug { get; set; } = string.Empty;

        // Rich-text content stored as HTML
        [Required]
        [Column(TypeName = "text")]
        public string Content { get; set; } = string.Empty;

        // Category relationship
        [Required]
        public Guid CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public OfficeHandbookCategory? Category { get; set; }

        // Optional PDF attachment
        [MaxLength(500)]
        public string? AttachmentPath { get; set; }

        [MaxLength(255)]
        public string? AttachmentName { get; set; }

        // Publication status
        public bool IsPublished { get; set; } = false;

        public DateTime? PublishedAt { get; set; }

        // Archive instead of permanent deletion
        public bool IsArchived { get; set; } = false;

        public DateTime? ArchivedAt { get; set; }

        [MaxLength(450)]
        public string? ArchivedBy { get; set; }

        // Audit information
        [Required]
        [MaxLength(450)]
        public string CreatedBy { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(450)]
        public string? UpdatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
