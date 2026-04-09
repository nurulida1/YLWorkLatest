namespace YLWorks.Model
{
    public class Transaction : BaseEntity
    {
        public Guid Id { get; set; }
        public string TransactionId { get; set; }
        public DateTime Date { get; set; }
        public string? Description { get; set; }
        public double Amount { get; set; }
        public string Method { get; set; }
        public string? Attachment { get; set; }
    }

    public class CreateTransactionRequest
    {
        public string? Description { get; set; }
        public string Method { get; set; }
        public double Amount { get; set; }
        public IFormFile? Attachment { get; set; }
    }
}