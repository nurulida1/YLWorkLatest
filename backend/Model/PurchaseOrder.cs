using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace YLWorks.Model
{
    public class PurchaseOrder: BaseEntity
    {
        public Guid Id { get; set; }
        public string PurchaseOrderNo { get; set; } = string.Empty;
        public string? Type { get; set; } //Incoming / Outcoming
        public DateTime? PODate { get; set; }
        public DateTime? POReceivedDate { get; set; }

        public Guid? ClientId { get; set; }
        [ForeignKey("ClientId")] 
        public Company? Client { get; set; } = null!;

        public Guid? SupplierId { get; set; }
        [ForeignKey("SupplierId")] 
        public Company? Supplier { get; set; }

        public string? Terms { get; set; }
        public string? ProjectCode { get; set; }
        public Project? Project { get; set; }

        public Guid? QuotationId { get; set; }
        public Quotation? Quotation { get; set; }

        public int? TotalQuantity { get; set; }
        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalAmount { get; set; }

        public string? Remarks { get; set; }
        public string? Notes { get; set; }

        public string? POClientNo { get; set; }
        public string? SOClientNo { get; set; }

        public string Status { get; set; } = "Draft"; // Draft, Sent, Accepted, Received, Completed, Cancelled
        public string? TermsAndCondition { get; set; }
        public string? BankDetails { get; set; }
        public ICollection<PurchaseOrderStatusHistory> PurchaseOrderStatusHistories { get; set; } = new List<PurchaseOrderStatusHistory>();

        public ICollection<PurchaseOrderItem>? PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();

    }

    public class PurchaseOrderStatusHistory
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderId { get; set; }
        [JsonIgnore]
        public PurchaseOrder PurchaseOrder { get; set; } = null!;
        public string Status { get; set; } = string.Empty;
        public DateTime ActionAt { get; set; }
        public Guid? ActionUserId { get; set; }
        public User? ActionUser { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; } 
    }

    public class PurchaseOrderItem: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderId { get; set; }

        [JsonIgnore]
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
        public string PurchaseOrderNo { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public DateTime? PODate { get; set; }
        public DateTime? POReceivedDate {  get; set; }
        public Guid? ClientId { get; set; }
        public Guid? SupplierId { get; set; }
        public string Terms { get; set; }

        public Guid? QuotationId { get; set; }
        public string? ProjectCode { get; set; }

        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal TotalAmount { get; set; }

        public string? Notes { get; set; }
        public string? Remarks { get; set; }
        public string? TermsAndConditions { get; set; }
        public string? BankDetails { get; set; }
        public int? TotalQuantity { get; set; }

        public List<POItemRequest> PurchaseOrderItems { get; set; } = new();
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
        public string? Remarks { get; set; }  // Optional remarks for status change
        public string? SignatureImage { get; set; } // Optional signature image for approval
    }

}
