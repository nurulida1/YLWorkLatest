namespace YLWorks.Model
{
    public class Payments : BaseEntity
    {
        public Guid Id { get; set; }
        public string? PaymentNo { get; set; }
        public Guid? ClientId { get; set; }
        public Company? Client { get; set; }
        public Guid? SupplierId { get; set; }
        public Company? Supplier { get; set; }
        public Guid? InvoiceId { get; set; }
        public Invoice? Invoice { get; set; } = null!;
        public string? ReferenceNo { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMode { get; set; } = string.Empty; // Cash, Cheque, Bank Transfer, Paypal, Strip
        public decimal? Amount { get; set; }
        public string? Notes { get; set; }
        public string? Attachment { get; set; }
        public string Status { get; set; } = "Pending"; // Paid, Refunded, Cancelled, Partially Paid, Overdue, Paid, Unpaid, Draft
        public Guid ProcessedById { get; set; }
        public User ProcessedBy { get; set; } = null!;

    }

    public class CreatePaymentRequest
    {
        public string? PaymentNo { get; set; }
        public Guid? ClientId { get; set; }
        public Guid? SupplierId { get; set; }
        public Guid? InvoiceId { get; set; }
        public string? ReferenceNo { get; set; }
        public DateTime PaymentDate { get; set; }
        public string? PaymentMode { get; set; }
        public decimal Amount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string? Notes { get; set; }
        public string? Attachment { get; set; }
    }
}