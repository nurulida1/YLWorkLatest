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
        public string? Terms { get; set; }
        public string? Page { get; set; }

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

        public int? TotalQuantity { get; set; }
        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalAmount { get; set; }

        public string? DeliveryInstruction { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public string? Remarks { get; set; }

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

        public string Item { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class POItemBase
    {
        public string Item { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }
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
        public Guid? ProjectId { get; set; }
        public Guid? SupplierId { get; set; }
        public Guid? ClientId { get; set; }
        public string Terms { get; set; }
        public DateTime? POReceivedDate {  get; set; }
        public string? Page { get; set; }

        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal TotalAmount { get; set; }

        public string? DeliveryInstruction { get; set; }
        public DateTime? DeliveryDate { get; set; }

        public string? TermsConditions { get; set; }
        public string? BankDetails { get; set; }
        public string? Remarks { get; set; }
        public int? TotalQuantity { get; set; }

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
