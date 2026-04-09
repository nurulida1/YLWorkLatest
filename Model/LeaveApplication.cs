namespace YLWorks.Model
{
    public class LeaveApplication: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
        public Guid DepartmentId { get; set; }
        public Department Department { get; set; }
        public Guid LeaveTypeId { get; set; }
        public LeaveType LeaveType { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public double TotalDays { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Cancelled
        public Guid? ApprovedById { get; set; } // Nullable until approved
        public User? ApprovedBy { get; set; }
        public DateTime AppliedOn { get; set; } = DateTime.UtcNow;
        public string? Remarks { get; set; }
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    }

    public class CreateLeaveApplication
    {
        public Guid UserId { get; set; }
        public Guid DepartmentId { get; set; }
        public Guid LeaveTypeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public ICollection<LeaveAttachmentRequest>? Attachments { get; set; } = new List<LeaveAttachmentRequest>();
    }

    public class LeaveAttachmentRequest
    {
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty; // e.g., "pdf", "jpg"
        public byte[] FileData { get; set; } = Array.Empty<byte>();
    }
}
