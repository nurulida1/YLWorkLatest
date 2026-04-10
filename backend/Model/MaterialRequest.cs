namespace YLWorks.Model
{
    public class MaterialRequest: BaseEntity
    {
        public Guid Id { get; set; }
        public string? RequestNo { get; set; } = string.Empty;
        public Guid? ProjectId { get; set; }
        public Project? Project { get; set; }
        public Guid? TaskId { get; set; }
        public ProjectTask? Task { get; set; }
        public Guid? ClientId { get; set; }
        public Client? Client { get; set; }
        public Guid? POId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }
        public string? Purpose { get; set; }
        public DateTime? RequestDate { get; set; }
        public Guid RequestedById { get; set; }
        public User RequestedBy { get; set; } = null!;
        public string Status { get; set; } = "Draft"; // Draft, PendingApproval, Approved, Rejected, Issued, Partial, Completed
        public string? Remarks { get; set; }
        public Guid? ApprovedById { get; set; }
        public User? ApprovedBy { get; set; }
        public DateTime? ApprovalRequestedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? RejectedAt { get; set; }
        public DateTime? IssuedAt { get; set; }
        public Guid? IssuedById { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? RejectionReason { get; set; }
        public ICollection<MaterialItem>? MaterialItems { get; set; } = new List<MaterialItem>();
        public ICollection<string>? Attachments { get; set; } = new List<string>();

    }

    public class MaterialItem: BaseEntity
    {
        public Guid Id { get; set;}
        public Guid MaterialRequestId { get; set; }
        public MaterialRequest MaterialRequest { get; set; }
        public string? Description { get; set; } = string.Empty;
        public string? Brand { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public DateTime? RequiredDate { get; set; }
        public Guid SupplierId {  get; set; }
        public Supplier Supplier { get; set; }
    }

    public class CreateMaterialRequest
    {
        public string? RequestNo { get; set; } = string.Empty;
        public Guid ProjectId { get; set; }
        public Guid? TaskId { get; set; }
        public Guid? POId { get; set; }
        public Guid? ClientId { get; set; }
        public string? Purpose { get; set; }
        public DateTime? RequestDate { get; set; }
        public Guid RequestedById { get; set; }
        public string? Remarks { get; set; }
        public ICollection<MaterialItemRequest>? MaterialItems { get; set; } = new List<MaterialItemRequest>(); 
        public ICollection<string>? Attachments { get; set; } = new List<string>();

    }

    public class UpdateMaterialRequest
    {
        public Guid Id { get; set; }
        public string? RequestNo { get; set; } = string.Empty;
        public Guid? ProjectId { get; set; }
        public Guid? TaskId { get; set; }
        public Guid? ClientId { get; set; }
        public Guid? POId { get; set; }
        public string? Purpose { get; set; }
        public DateTime? RequestDate { get; set; }
        public Guid RequestedById { get; set; }
        public string? Remarks { get; set; }

        public ICollection<MaterialItemUpdateRequest>? MaterialItems { get; set; } = new List<MaterialItemUpdateRequest>();
        public ICollection<string>? Attachments { get; set; } = new List<string>();

    }

    public class MaterialItemRequest
    {
        public string Description { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public int? Quantity { get; set; }
        public DateTime? RequiredDate { get; set; }
        public Guid SupplierId { get; set; }
    }

    public class MaterialItemUpdateRequest : MaterialItemRequest
    {
        public Guid? Id { get; set; } // null = new item, otherwise update existing
    }

    public class MaterialRequestDto
    {
        public Guid Id { get; set; }
        public string RequestNo { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? ClientId { get; set; }
        public Guid? TaskId { get; set; }
        public Guid? POId { get; set; }
        public Guid RequestedById { get; set; }
        public DateTime? RequestDate { get; set; }
        public string? Purpose { get; set; }
        public string? Remarks { get; set; }
        public List<MaterialItemDto> MaterialItems { get; set; } = new();
        public ICollection<string> Attachments { get; set; }
    }

    public class MaterialItemDto
    {
        public Guid Id { get; set; }
        public string Description { get; set; }
        public int Quantity { get; set; }
        public string Brand { get; set; }
        public Guid SupplierId { get; set; }
        public string Unit { get; set; }
        public DateTime? RequiredDate { get; set; }
    }

    public class UpdateMaterialRequestStatusDto
    {
        public Guid Id { get; set; }
        public string Status { get; set; } // PendingApproval, Approved, Rejected
        public Guid? ApprovedById { get; set; }
        public string? RejectionReason { get; set; }
    }

}
