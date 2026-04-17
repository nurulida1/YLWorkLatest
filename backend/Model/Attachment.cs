namespace YLWorks.Model
{
    public class AttachmentDto : BaseEntity
    {
        public Guid Id { get; set; }

        public string FileName { get; set; } = null!;
        public string FileType { get; set; } = null!;
        public long FileSize { get; set; }

        // Store file as URL or path (NOT byte[])
        public string FileUrl { get; set; } = null!;

        // Generic reference system (IMPORTANT FIX)
        public string EntityType { get; set; } = null!; // Invoice, MR, Payment, etc.
        public Guid EntityId { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public Guid? UploadedById { get; set; }
        public User? UploadedBy { get; set; }
    }

    public class CreateAttachmentRequest
    {
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;

        public string Base64Data { get; set; } = string.Empty;

        // required to link dynamically
        public string EntityType { get; set; } = string.Empty;
        public Guid EntityId { get; set; }

        public Guid? UploadedById { get; set; }
    }

    public class AttachmentUpdateRequest
    {
        public Guid Id { get; set; }

        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;

        public string? Base64Data { get; set; }

        public string EntityType { get; set; } = string.Empty;
        public Guid EntityId { get; set; }
    }
}