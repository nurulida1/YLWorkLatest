namespace YLWorks.Model
{
    public class MaterialRequest: BaseEntity
    {
        public Guid Id { get; set; }
        public string? DocumentNo { get; set; } = string.Empty;
        public string? RevNo { get; set; }
        public DateTime? EffDate { get; set; }
        public string? RequestNo { get; set; } = string.Empty;
        public string? ProjectCode { get; set; }
        public Project? Project { get; set; }
        public DateTime? RequestDate { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public string? DeliveryPlace { get; set; }
        public Guid? WorkOrderId { get; set; }
        public WorkOrder? WorkOrder { get; set; }
        public Guid? ClientId { get; set; }
        public Company? Client { get; set; }
        public Guid? SupplierId { get; set; }
        public Company? Supplier { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, PendingApproval, Approved, Rejected, Issued, Partial, Completed
        public string? Remarks { get; set; }
        public ICollection<MaterialRequestStatusHistory> MaterialRequestStatusHistories { get; set; } = new List<MaterialRequestStatusHistory>();
        public ICollection<MaterialItem>? MaterialItems { get; set; } = new List<MaterialItem>();
    }

    public class MaterialItem: BaseEntity
    {
        public Guid Id { get; set;}
        public Guid MaterialRequestId { get; set; }
        public MaterialRequest MaterialRequest { get; set; }
        public string? Description { get; set; } = string.Empty;
        public string? Brand { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public string? TypeNo { get; set; }
        public decimal Quantity { get; set; }
        public DateTime? RequiredAt { get; set; }
        public Guid SupplierId {  get; set; }
        public Company Supplier { get; set; }
        public string? Remarks { get; set; }
    }

    public class CreateMaterialRequest
    {
        public string? DocumentNo { get; set; } = string.Empty;
        public string? RevNo { get; set; }
        public DateTime? EffDate { get; set; }
        public string? RequestNo { get; set; } = string.Empty;
        public string? ProjectCode { get; set; }
        public DateTime? RequestDate { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public string? DeliveryPlace { get; set; }
        public Guid? WorkOrderId { get; set; }
        public Guid? SupplierId { get; set; }
        public Guid? RequestedById { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public string? Remarks { get; set; }
        public ICollection<MaterialItemRequest>? MaterialItems { get; set; } = new List<MaterialItemRequest>(); 

    }

    public class UpdateMaterialRequest: CreateMaterialRequest
    {
        public Guid Id { get; set; }
    }

    public class MaterialItemRequest
    {
        public string Description { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public string? TypeNo { get; set; }
        public decimal? Quantity { get; set; }
        public DateTime? RequiredAt { get; set; }
        public string? Remarks { get; set; }
        public Guid SupplierId { get; set; }
    }

    public class MaterialItemUpdateRequest : MaterialItemRequest
    {
        public Guid? Id { get; set; } // null = new item, otherwise update existing
    }

    public class MaterialRequestDto
    {
        public Guid Id { get; set; }
        public string? DocumentNo { get; set; }
        public string? RevNo { get; set; }
        public DateTime? EffDate { get; set; }
        public string RequestNo { get; set; }
        public string? ProjectCode { get; set; }
        public DateTime? RequestDate { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public string? DeliveryPlace { get; set; }
        public Guid? WorkOrderId { get; set; }
        public Guid? SupplierId { get; set; }
        public Guid RequestedById { get; set; }
        public Guid? PurchaseOrderId { get; set; } = Guid.Empty;
        public string? Remarks { get; set; }
        public List<MaterialItemDto> MaterialItems { get; set; } = new();
    }

    public class MaterialItemDto
    {
        public Guid Id { get; set; }
        public string Description { get; set; }
        public int Quantity { get; set; }
        public string Brand { get; set; }
        public string? TypeNo { get; set; }
        public Guid SupplierId { get; set; }
        public string Unit { get; set; }
        public DateTime? RequiredAt { get; set; }
        public string? Remarks { get; set; }
    }

    public class MaterialRequestStatusHistory: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid MaterialRequestId { get; set; }
        public MaterialRequest MaterialRequest { get; set; } = null!;
        public string Status { get; set; } = string.Empty;
        public DateTime ActionAt { get; set; }
        public Guid? ActionUserId { get; set; }
        public string? ActionUserName { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; }
        public List<string>? ProofImageUrls { get; set; }
    }

    public class MaterialRequestStatusUpdate
    {
        public string Status { get; set; } = string.Empty;
        public Guid? ActionUserId { get; set; }
        public string? ActionUserName { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; }
        public List<string>? ProofImageUrls { get; set; }
    }

    public class MaterialRequestStatusUpdateRequest
    {
        public Guid MaterialRequestId { get; set; }
        public MaterialRequestStatusUpdate StatusUpdate { get; set; } = null!;
    }

    public class MaterialRequestStatusUpdateDto
    {
        public Guid Id { get; set; }
        public Guid MaterialRequestId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime ActionAt { get; set; }
        public Guid? ActionUserId { get; set; }
        public string? ActionUserName { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; }
        public List<string>? ProofImageUrls { get; set; }
    }

}
