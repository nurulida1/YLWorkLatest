namespace YLWorks.Model
{
    public class Invoice: BaseEntity
    {
        public Guid Id { get; set; }
        public string InvoiceNo { get; set; } = string.Empty;
        public string? ReferenceNo { get; set; }
        public Guid? ProjectId { get; set; }
        public Project? Project { get; set; }
        public Guid? ClientId { get; set; }
        public Client? Client { get; set; }
        public Guid? SupplierId { get; set; }
        public Supplier? Supplier { get; set; }
        public DateTime InvoiceDate {  get; set; }
        public DateTime DueDate { get; set; }
        public Guid? POId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }
        public Guid? QuotationId { get; set; }
        public Quotation? Quotation { get; set; }
        public string? Remarks { get; set; }
        public string Status { get; set; } = "Draft";  // Paid, Overdue, Upcoming, Cancelled, Partially Paid, Unpaid, Refunded, Draft

        public decimal DiscountRate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal? PaidAmount { get; set; }

        public string? SignatureName { get; set; }
        public string? SignatureImageUrl { get; set; }

        public string? Description { get; set; }
        public string? TermsConditions { get; set; }
        public string? BankDetails { get; set; }

        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; }

        public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
        public ICollection<Payments> Payments { get; set; } = new List<Payments>();


    }

    public class InvoiceItem: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid InvoiceId { get; set; }
        public Invoice Invoice { get; set; }

        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal Rate { get; set; }
        public decimal TaxRate { get; set; } // Percentage
        public decimal Amount { get; set; }
    }

    public class InvoiceItemBase
    {
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal Rate { get; set; }
        public decimal TaxRate { get; set; }
        public decimal Amount { get; set; }
    }

    // Used for Create: No ID needed as all items are new
    public class InvoiceItemRequest : InvoiceItemBase { }

    // Used for Update: Optional ID to differentiate between 'Edit' and 'Add New'
    public class UpdateInvoiceItemRequest : InvoiceItemBase
    {
        public Guid? Id { get; set; }
    }

    public class CreateInvoiceRequest
    {
        public string InvoiceNo { get; set; } = string.Empty;
        public string ReferenceNo { get; set; }
        public Guid? ClientId { get; set; }
        public Guid? SupplierId { get; set; }
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }

        // UI Integration: Determine if we should save as 'Draft' or 'Open'
        public bool IsDraft { get; set; }

        public string? Description { get; set; }
        public string? TermsConditions { get; set; }
        public string? BankDetails { get; set; }

        // For your Signature UI
        public string? SignatureName { get; set; }
        public string? SignatureImageUrl { get; set; } // Base64 or Image URL

        public List<InvoiceItemRequest> InvoiceItems { get; set; } = new();
    }

    public class UpdateInvoiceRequest : CreateInvoiceRequest
    {
        public Guid Id { get; set; }

        // Replaces ICollection<QuotationItemRequest> with the Update version
        public new List<UpdateInvoiceItemRequest>? InvoiceItems { get; set; }
    }

    public class UpdateInvoiceStatusRequest
    {
        public Guid InvoiceId { get; set; }
        public string Status { get; set; } = string.Empty;
        // Example: Planned, InProgress, OnHold, Completed, Cancelled
    }

    public class MarkInvoicePaidRequest
    {
        public Guid InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
        public Guid ProcessedById { get; set; } // Who processed the payment
    }

    public class InvoiceSummaryDto
    {
        public decimal TotalAmount { get; set; }
        public decimal TotalPercentage { get; set; }

        public decimal? PaidAmount { get; set; }
        public decimal PaidPercentage { get; set; }

        public decimal? PendingAmount { get; set; }
        public decimal PendingPercentage { get; set; }

        public decimal? OverdueAmount { get; set; }
        public decimal OverduePercentage { get; set; }
    }

}
