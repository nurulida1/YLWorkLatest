namespace YLWorks.Model
{
    public class Income : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid? PaymentId { get; set; }

        public string IncomeNo { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime IncomeDate { get; set; }

        public string? PaymentMode { get; set; }

        public string? Description { get; set; }
        public string? Attachment { get; set; }

        public Guid? ProcessedById { get; set; }
        public User? ProcessedBy { get; set; }
    }

    public class CreateIncomeRequest
    {
        public Guid? PaymentId { get; set; }
        public decimal Amount { get; set; }
        public DateTime IncomeDate { get; set; }
        public string? PaymentMode { get; set; }
        public string? Description { get; set; }
        public IFormFile? Attachment { get; set; }
        public Guid? ProcessedById { get; set; }
    }
}
