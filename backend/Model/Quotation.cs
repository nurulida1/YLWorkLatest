namespace YLWorks.Model
{
    public class Quotation: BaseEntity
    {
        public Guid Id {  get; set; }
        public string QuotationNo { get; set; } = string.Empty;
        public DateTime QuotationDate { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Revised, Approved, Sent, Accepted, Rejected
        public Guid? ProjectId { get; set; }
        public Project? Project { get; set; }
        public Guid ClientId { get; set; }
        public Client Client { get; set; } = null!;

        public decimal Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalAmount { get; set; }

        public string? Description { get; set; }
        public string? TermsConditions { get; set; }
        public string? BankDetails { get; set; } 
        
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; }

        public ICollection<QuotationItems> Items { get; set; } = new List<QuotationItems>();
    }

    public class QuotationItems: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid QuotationId { get; set; }
        public Quotation Quotation { get; set; } = null!;

        public string Item { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal UnitPrice { get; set; }
        public decimal? Discount { get; set; } 
        public decimal TotalAmount { get; set; }
    }

    public class QuotationItemBase
    {
        public string Item { get; set; }
        public string? Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public decimal TotalAmount { get; set; }
    }

    // Used for Create: No ID needed as all items are new
    public class QuotationItemRequest : QuotationItemBase { }

    // Used for Update: Optional ID to differentiate between 'Edit' and 'Add New'
    public class UpdateQuotationItemRequest : QuotationItemBase
    {
        public Guid? Id { get; set; }
    }

    // --- Main Request Models ---

    public class CreateQuotationRequest
    {
        public string QuotationNo { get; set; } = string.Empty;
        public Guid ClientId { get; set; }
        public DateTime QuotationDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal Gross { get; set; }
        public decimal? Discount { get; set; }
        public int? TotalQuantity { get; set; }
        public decimal TotalAmount { get; set; }

        // UI Integration: Determine if we should save as 'Draft' or 'Open'
        public bool IsDraft { get; set; }

        public string? Description { get; set; }
        public string? TermsConditions { get; set; }
        public string? BankDetails { get; set; }

        public List<QuotationItemRequest> Items { get; set; } = new();
    }

    public class UpdateQuotationRequest : CreateQuotationRequest
    {
        public Guid Id { get; set; }

        // Replaces ICollection<QuotationItemRequest> with the Update version
        public new List<UpdateQuotationItemRequest>? Items { get; set; }
    }
    public class UpdateQuotationStatusRequest
    {
        public Guid Id { get; set; }          // Quotation ID
        public string? Status { get; set; }   // New status value
    }
}
