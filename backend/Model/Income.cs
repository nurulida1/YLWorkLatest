namespace YLWorks.Model
{
    public class Income : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid? PaymentId { get; set; }

        public string IncomeNo { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime IncomeDate { get; set; }

        public string? PaymentMethod { get; set; }

        public string? Description { get; set; }

        public ICollection<AttachmentDto>? Attachments { get; set; } = new List<AttachmentDto>();

        public Guid? ProcessedById { get; set; }
        public User? ProcessedBy { get; set; }
    }

    public class CreateIncomeRequest
    {
        public Guid? PaymentId { get; set; }
        public decimal Amount { get; set; }
        public DateTime IncomeDate { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Description { get; set; }
        public ICollection<string>? AttachmentUrls { get; set; } = new List<string>();
        public Guid? ProcessedById { get; set; }
    }
}
