namespace YLWorks.Model
{
    public class DeliveryOrder : BaseEntity
    {
        public Guid Id { get; set; }

        public string DeliveryOrderNo { get; set; } = string.Empty;

        //Receiving (Inbound) or Dispatch (Outbound)
        public string Type { get; set; } = "Dispatch";

        public Guid? ProjectId { get; set; }
        public Project? Project { get; set; }

        public Guid? PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }

        public Guid? SalesOrderId { get; set; }
        public SalesOrder? SalesOrder { get; set; }

        public string? ReferenceNo { get; set; }

        public Guid? SenderCompanyId { get; set; }
        public Company? SenderCompany { get; set; }

        public Guid? ReceiverCompanyId { get; set; }
        public Company? ReceiverCompany { get; set; }

        public string? DeliveryMethod { get; set; }

        public string? Notes { get; set; }

        public string? Remarks { get; set; }
        public string? Attachment { get; set; }
        public string Status { get; set; } = "Draft";

        /*
         
        RECEIPT (Inbound) FLOW
        Draft
        PartiallyReceived
        FullyReceived
        Completed
        Cancelled

        DELIVERY (OUTBOUND) FLOW
        Draft
        Approved
        Prepared
        OutForDelivery
        PartiallyDelivered
        Delivered
        Completed
        Cancelled

        */

        public ICollection<DeliveryOrderStatusHistory>
            DeliveryOrderStatusHistories
        { get; set; } = new List<DeliveryOrderStatusHistory>();

        public ICollection<DeliveryOrderItem>
            DeliveryOrderItems
        { get; set; } = new List<DeliveryOrderItem>();
    }

    public class DeliveryOrderStatusHistory : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid DeliveryOrderId { get; set; }

        public DeliveryOrder DeliveryOrder { get; set; } = null!;

        public string Status { get; set; } = string.Empty;

        public DateTime ActionAt { get; set; } = DateTime.UtcNow;

        public Guid? ActionUserId { get; set; }

        public User? ActionUser { get; set; }

        public Guid? ReviewByUserId { get; set; }
        public User? ReviewByUser { get; set; }

        public Guid? ApprovedByUserId { get; set; }
        public User? ApprovedByUser { get; set; }

        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; }
        public string? TrackingNo { get; set; }

        public ICollection<DeliveryOrderProofImage>
            ProofImages
        { get; set; } = new List<DeliveryOrderProofImage>();
    }

    public class DeliveryOrderProofImage : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid DeliveryOrderStatusHistoryId { get; set; }

        public DeliveryOrderStatusHistory DeliveryOrderStatusHistory { get; set; } = null!;

        public string ImageUrl { get; set; } = string.Empty;

        public string? Remarks { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }

    public class DeliveryOrderItem : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid DeliveryOrderId { get; set; }

        public DeliveryOrder DeliveryOrder { get; set; } = null!;

        public string? Description { get; set; }

        // Quantity from PO
        public decimal? QuantityOrdered { get; set; }

        // Actual delivered quantity
        public decimal? QuantityDelivered { get; set; }

        public string? Unit { get; set; }

        public string? Remarks { get; set; }
    }

    public class CreateDeliveryOrderRequest
    {
        public string DeliveryOrderNo { get; set; } = string.Empty;

        public string Type { get; set; } = "Receipt";

        public Guid? ProjectId { get; set; }

        public string? ReferenceNo { get; set; }

        public Guid? PurchaseOrderId { get; set; }

        public Guid? SenderCompanyId { get; set; }

        public Guid? ReceiverCompanyId { get; set; }

        public string? DeliveryMethod { get; set; }

        public string? Remarks { get; set; }

        public string? Notes { get; set; }
        public IFormFile? Attachment { get; set; }
        public List<CreateDeliveryOrderItemRequest> DeliveryOrderItems { get; set; }
            = new();
    }

    public class CreateDeliveryOrderItemRequest
    {
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

    public class UpdateDeliveryOrderItemRequest
        : CreateDeliveryOrderItemRequest
    {
        public Guid Id { get; set; }
    }

    public class DeliveryOrderDropdownDto
    {
        public List<PurchaseOrderDropdownItem> PurchaseOrders { get; set; } = new();

        public List<ProjectDropdownItem> Projects { get; set; } = new();

        public List<CompanyDropdownItem> Companies { get; set; } = new();

        public string? DefaultSenderCompanyId { get; set; }
    }

    public class PurchaseOrderDropdownItem
    {
        public Guid Id { get; set; }
        public string PurchaseOrderNo { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public Guid? ProjectId { get; set; }
        public string? ProjectCode { get; set; }

        public Guid? SupplierId { get; set; }
        public string? SupplierName { get; set; }

        public Guid? ClientId { get; set; }
        public string? ClientName { get; set; }
    }

    public class ProjectDropdownItem
    {
        public Guid Id { get; set; }
        public string ProjectCode { get; set; } = string.Empty;
        public string? ProjectTitle { get; set; }
    }

    public class CompanyDropdownItem
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateStatusRequest
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid? ReviewerUserId { get; set; }
        public List<IFormFile>? ProofImages { get; set; }
        public string? Remarks { get; set; }
    }

    public class DODropdownDto
    {
        public Guid? Id { get; set; }
        public string? DeliveryOrderNo { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public Guid? QuotationId { get; set; }
        public Guid? ProjectId { get; set; }
    }
}