namespace YLWorks.Model
{
    public class Quotation: BaseEntity
    {
        public Guid Id {  get; set; }
        public string QuotationNo { get; set; } = string.Empty;
        public string? ReferenceNo { get; set; }
        public DateTime QuotationDate { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Open, Sent, Accepted, Declined, Expired
        public Guid? ProjectId { get; set; }
        public Project? Project { get; set; }
        public Guid ClientId { get; set; }
        public Client Client { get; set; } = null!;
        public Guid? AssignedToId { get; set; }
        public virtual User? AssignedTo { get; set; }
        public DateTime? SignedAt { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal DiscountRate { get; set; }
        public string? SignatureName { get; set; }
        public string? Description { get; set; }
        public string? TermsConditions { get; set; }
        public string? BankDetails { get; set; }     
        public string? SignatureImageUrl { get; set; }
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; }
        public ICollection<QuotationItems> Items { get; set; } = new List<QuotationItems>();
    }

    public class QuotationItems: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid QuotationId { get; set; }
        public Quotation Quotation { get; set; } = null!;

        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal Rate { get; set; }
        public decimal TaxRate { get; set; } // Percentage
        public decimal Amount { get; set; }
    }

    public class QuotationItemBase
    {
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal Rate { get; set; }
        public decimal TaxRate { get; set; }
        public decimal Amount { get; set; }
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
        public string? ReferenceNo { get; set; }
        public Guid ClientId { get; set; }
        public DateTime QuotationDate { get; set; }
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
        public Guid? AssignedUserId { get; set; } // The Director's User ID (Required for signatures)
    }

    public class SubmitSignatureRequest
    {
        public Guid QuotationId { get; set; }
        public string SignatureImageUrl { get; set; } // The base64 or URL of the signature
        public Guid SignedByUserId { get; set; }      // The Director's ID for verification
    }
}
