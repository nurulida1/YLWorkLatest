namespace YLWorks.Model
{
    public class Attachment: BaseEntity
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = null!;
        public string FileType { get; set; } = null!;
        public byte[] FileData { get; set; } = null!;

        // Generic reference to what this attachment belongs to
        public Guid? InvoiceId { get; set; }
        public Guid? LeaveApplicationId { get; set; }
        public Guid? MaterialRequestId { get; set; }
        public Guid? PaymentId { get; set; }
        public Guid? ProjectTaskId { get; set; }

        // Navigation properties
        public Invoice? Invoice { get; set; }
        public LeaveApplication? LeaveApplication { get; set; }
        public MaterialRequest? MaterialRequest { get; set; }
        public Payments? Payment { get; set; }
        public ProjectTask? ProjectTask { get; set; }
    }

    public class CreateAttachmentRequest
    {
        // For now: either a base64 string or URL
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty; // e.g., "pdf", "jpg"
        public string Base64Data { get; set; } = string.Empty;  // convert to byte[] in service
    }
    public class AttachmentUpdateRequest
    {
        public Guid? Id { get; set; } // null = new attachment, otherwise update existing
        public string FileName { get; set; } = string.Empty; // required
        public string FileType { get; set; } = string.Empty; // e.g., "jpg", "pdf"
        public string Base64Data { get; set; } = string.Empty; // convert to byte[] in service
    }


}
