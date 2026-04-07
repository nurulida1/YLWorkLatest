using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model
{
    public enum POType
    {
        Incoming,
        Outgoing
    }
    public class PurchaseOrder: BaseEntity
    {
        public Guid Id { get; set; }
        public string PONo { get; set; } = string.Empty;
        public POType Type { get; set; }
        public string? ReferenceNo { get; set; }
        public DateTime PODate { get; set; }
        public DateTime? DueDate { get; set; }
        public Guid? ProjectId { get; set; }
        [ForeignKey("ProjectId")] // Explicitly link to the navigation property
        public virtual Project? Project { get; set; }
        public Guid? QuotationId { get; set; }
        public Quotation? Quotation { get; set; }
        public Guid? SupplierId { get; set; }
        [ForeignKey("SupplierId")] // This ensures EF uses 'SupplierId' and not 'Supplier_Id'
        public Supplier? Supplier { get; set; }
        public Guid? ClientId { get; set; }
        [ForeignKey("ClientId")] // This ensures EF uses 'SupplierId' and not 'Supplier_Id'
        public Client? Client { get; set; } = null!;
        public DateTime? POReceivedDate { get; set; }
        public DateTime? OrderDate { get; set; }
        public decimal? DiscountRate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? SignatureName { get; set; }
        public string? SignatureImageUrl { get; set; }
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; }

        public string Status { get; set; } = "Draft"; // Draft, Open, Sent, Accepted, Received, Completed, Cancelled
        public string? Description { get; set; } = string.Empty;
        public string? TermsConditions { get; set; }
        public string? BankDetails { get; set; }
        public string? PaymentTerms { get; set; }
        public ICollection<POItem>? POItems { get; set; } = new List<POItem>();

    }

    public class POItem: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; } = null!;

        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal Rate { get; set; }
        public decimal TaxRate { get; set; } // Percentage
        public decimal Amount { get; set; }
    }

    public class POItemBase
    {
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal Rate { get; set; }
        public decimal TaxRate { get; set; }
        public decimal Amount { get; set; }
    }

    // Used for Create: No ID needed as all items are new
    public class POItemRequest : POItemBase { }

    // Used for Update: Optional ID to differentiate between 'Edit' and 'Add New'
    public class UpdatePOItemRequest : POItemBase
    {
        public Guid? Id { get; set; }
    }

    // --- Main Request Models ---

    public class CreatePORequest
    {
        public string PONo { get; set; } = string.Empty;
        public Guid? QuotationId { get; set; }
        public string? ReferenceNo { get; set; }
        public Guid? SupplierId { get; set; }
        public Guid? ClientId { get; set; }
        public DateTime PODate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? POReceivedDate {  get; set; }
        public string? PaymentTerms { get; set; }
        public decimal? SubTotal { get; set; }
        public decimal? Tax { get; set; }
        public decimal? Discount { get; set; }
        public decimal TotalAmount { get; set; }

        // UI Integration: Determine if we should save as 'Draft' or 'Open'
        public bool IsDraft { get; set; }

        public string? Description { get; set; }
        public string? TermsConditions { get; set; }
        public string? BankDetails { get; set; }

        // For your Signature UI
        public string? SignatureName { get; set; }
        public string? SignatureImageUrl { get; set; } // Base64 or Image URL

        public List<POItemRequest> POItems { get; set; } = new();
    }

    public class UpdatePORequest : CreatePORequest
    {
        public Guid Id { get; set; }

        // Replaces ICollection<QuotationItemRequest> with the Update version
        public new List<UpdatePOItemRequest>? POItems { get; set; }
    }
    public class UpdatePOStatusRequest
    {
        public Guid Id { get; set; }          // Quotation ID
        public string? Status { get; set; }   // New status value
    }

}
