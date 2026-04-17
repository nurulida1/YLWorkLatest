namespace YLWorks.Model
{
    public class DeliveryOrder : BaseEntity
    {
        public Guid Id { get; set; }
        public string DeliveryOrderNo { get; set; } = string.Empty;
        public string? ProjectCode { get; set; }
        public Project? Project { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }
        public string? ReferenceNo { get; set; }
        public Guid? SenderCompanyId { get; set; }
        public Company? SenderCompany { get; set; }
        public Guid? ReceiverCompanyId { get; set; }
        public Company? ReceiverCompany { get; set; }
        public string? DeliveryMethod { get; set; }
        public string? Notes { get; set; }
        public string? Remarks { get; set; } = null;

        public ICollection<DeliveryOrderStatusHistory> DeliveryOrderStatusHistories { get; set; } = new List<DeliveryOrderStatusHistory>();
        public ICollection<DeliveryOrderItem>? DeliveryOrderItems { get; set; } = new List<DeliveryOrderItem>();
        public string? Status { get; set; } = "Draft"; // Draft, Approved, Rejected, OnDelivery, PartialDelivered, Delivered, Issued, Resolved
    }

    public class DeliveryOrderStatusHistory : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid DeliveryOrderId { get; set; }
        public DeliveryOrder DeliveryOrder { get; set; } = null!;
        public string Status { get; set; } = string.Empty;
        public DateTime ActionAt { get; set; } = DateTime.UtcNow;
        public Guid? ActionUserId { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; }
        public List<string>? ProofImageUrls { get; set; }
        public string? TrackingNo { get; set; }
    }

    public class CreateDeliveryOrderRequest
    {
        public string DeliveryOrderNo { get; set; } = string.Empty;
        public string? ProjectCode { get; set; }
        public string? ReferenceNo { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public Guid? SenderCompanyId { get; set; }
        public Guid? ReceiverCompanyId { get; set; }
        public string? DeliveryMethod { get; set; }
        public string? Remarks { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateDeliveryOrderItemRequest
    {
        public Guid? DeliveryOrderId { get; set; }
        public string? Description { get; set; }
        public decimal? QuantityOrdered { get; set; }
        public decimal? QuantityDelivered { get; set; }
        public string? Unit { get; set; }
        public string? Remarks { get; set; }
    }

    public class DeliveryOrderItem : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid DeliveryOrderId { get; set; }
        public DeliveryOrder DeliveryOrder { get; set; } = null!;
        public string? Description { get; set; }
        public decimal? QuantityOrdered { get; set; }
        public decimal? QuantityDelivered { get; set; }
        public string? Unit { get; set; }
        public string? Remarks { get; set; }
    }

    public class UpdateDeliveryOrderRequest : CreateDeliveryOrderRequest
    {
        public Guid Id { get; set; }
    }
     public class UpdateDeliveryOrderItemRequest : CreateDeliveryOrderItemRequest
    {
        public Guid Id { get; set; }
    }

}