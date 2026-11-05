
using System;
using System.ComponentModel.DataAnnotations;

namespace YLWorks.DTO
{
    // =========================================================
    // HANDBOOK DTO
    // =========================================================

    public class OfficeHandbookDto
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Slug { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public Guid CategoryId { get; set; }

        public string CategoryName { get; set; } = string.Empty;

        public string? AttachmentPath { get; set; }

        public string? AttachmentName { get; set; }

        public bool IsPublished { get; set; }

        public DateTime? PublishedAt { get; set; }

        public bool IsArchived { get; set; }

        public string CreatedBy { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public string? UpdatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }

    // =========================================================
    // CREATE HANDBOOK DTO
    // =========================================================

    public class CreateOfficeHandbookDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Slug { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        [Required]
        public Guid CategoryId { get; set; }

        public bool IsPublished { get; set; } = false;
    }

    // =========================================================
    // UPDATE HANDBOOK DTO
    // =========================================================

    public class UpdateOfficeHandbookDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Slug { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        [Required]
        public Guid CategoryId { get; set; }

        public bool IsPublished { get; set; }
    }

    // =========================================================
    // CATEGORY DTO
    // =========================================================

    public class OfficeHandbookCategoryDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; }

        public int ArticleCount { get; set; }
    }

    // =========================================================
    // CREATE CATEGORY DTO
    // =========================================================

    public class CreateOfficeHandbookCategoryDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public int DisplayOrder { get; set; } = 0;
    }

    // =========================================================
    // UPDATE CATEGORY DTO
    // =========================================================

    public class UpdateOfficeHandbookCategoryDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; }
    }
}
