namespace YLWorks.Model
{
    public class Expense : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid? PaymentId { get; set; }

        public string ExpenseNo { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime ExpenseDate { get; set; }

        public string? PaymentMode { get; set; }

        public string? Description { get; set; }

        // Use centralized attachment system
        public ICollection<AttachmentDto>? Attachments { get; set; } = new List<AttachmentDto>();

        public Guid? ProcessedById { get; set; }
        public User? ProcessedBy { get; set; }
    }

    public class CreateExpenseRequest
    {
        public Guid? PaymentId { get; set; }
        public decimal Amount { get; set; }
        public DateTime ExpenseDate { get; set; }
        public string? PaymentMode { get; set; }
        public string? Description { get; set; }
        public ICollection<string>? AttachmentUrls { get; set; } = new List<string>();
        public Guid? ProcessedById { get; set; }
    }
}
