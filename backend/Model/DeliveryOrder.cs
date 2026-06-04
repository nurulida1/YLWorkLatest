namespace YLWorks.Model
{
    public class DeliveryOrder : BaseEntity
    {
        public Guid Id { get; set; }

        public string DeliveryOrderNo { get; set; } = string.Empty;

        public Guid? ProjectId { get; set; }
        public Project? Project { get; set; }

        public Guid? SalesOrderId { get; set; }
        public SalesOrder? SalesOrder { get; set; }

        public Guid? SenderCompanyId { get; set; }
        public Company? SenderCompany { get; set; }

        public Guid? ReceiverCompanyId { get; set; }
        public Company? ReceiverCompany { get; set; }

        public string? DeliveryMethod { get; set; }

        public DateTime? EstimatedDeliveryDate {  get; set; }

        public string? Notes { get; set; }

        public string? Remarks { get; set; }
        public string? Attachment { get; set; }
        public string Status { get; set; } = "Draft";
        public string? TrackingNo { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public string? ReceivedBy { get; set; }
        public bool IsReceiverSigned { get; set; } = false;
        public string? ReceiverSignatureImage { get; set; }

        public string? PaymentTerms { get; set; }
        /*
         
        DELIVERY (OUTBOUND) FLOW
        Draft
        Approved
        Prepared
        OutForDelivery
        PartiallyDelivered
        Delivered
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

        public string? Remarks { get; set; }

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
        
        public Guid? SalesOrderItemId { get; set; }
        public SalesOrderItem? SalesOrderItem { get; set; }

        // Quantity from SO
        public decimal? QuantityOrdered { get; set; }

        // Actual delivered quantity
        public decimal? QuantityDelivered { get; set; }

        public string? Unit { get; set; }

        public string? Remarks { get; set; }
    }

    public class CreateDeliveryOrderRequest
    {
        public string DeliveryOrderNo { get; set; } = string.Empty;

        public Guid? ProjectId { get; set; }

        public Guid? SalesOrderId { get; set; }

        public Guid? SenderCompanyId { get; set; }

        public Guid? ReceiverCompanyId { get; set; }

        public string? DeliveryMethod { get; set; }

        public string? Remarks { get; set; }

        public string? PaymentTerms { get; set; }

        public string? Notes { get; set; }
        public IFormFile? Attachment { get; set; }
        public List<CreateDeliveryOrderItemRequest> DeliveryOrderItems { get; set; }
            = new();
    }

    public class CreateDeliveryOrderItemRequest
    {

        public string? Description { get; set; }

        public Guid? SalesOrderItemId { get; set; }

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
        public List<SalesOrderDropdownDto> SalesOrders { get; set; } = new();

        public List<ProjectDropdownItem> Projects { get; set; } = new();

        public List<CompanyDropdownItem> Companies { get; set; } = new();
    }

    public class PurchaseOrderDropdownItem
    {
        public Guid Id { get; set; }
        public string PurchaseOrderNo { get; set; } = string.Empty;

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

    public class UpdateStatusRequest
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<IFormFile>? ProofImages { get; set; }
        public string? Remarks { get; set; }
    }

    public class DODropdownDto
    {
        public Guid? Id { get; set; }
        public string? DeliveryOrderNo { get; set; }
        public Guid? SalesOrderId { get; set; }
        public Guid? QuotationId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? SenderCompanyId { get; set; }
        public CompanyDropdownItem? SenderCompany { get; set; }
    }

    public class GenerateDORequest
    {
        public Guid SalesOrderId { get; set; }
        public List<Guid> SalesOrderItemIds { get; set; } = new();
    }

    public class BulkDORequest
    {
        public List<DOPayload> DeliveryOrders { get; set; } = new();
    }

    public class DOPayload
    {
        public Guid SalesOrderId { get; set; }
        public string DeliveryMethod { get; set; } = string.Empty;
        public DateTime EstimatedDeliveryDate { get; set; }
        public List<BulkDOItemInput> Items { get; set; } = new();
    }

    public class BulkDOItemInput
    {
        public Guid SalesOrderItemId { get; set; }
        public int QuantityToDeliver { get; set; }
    }
}