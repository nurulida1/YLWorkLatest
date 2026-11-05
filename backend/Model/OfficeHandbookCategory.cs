
using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class OfficeHandbookCategory
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public ICollection<OfficeHandbook> Handbooks { get; set; }
            = new List<OfficeHandbook>();
    }
}
