namespace YLWorks.Model
{
    public class DeliveryOrderRMA : BaseEntity
    {
        public Guid Id { get; set; }
        public string DeliveryOrderRMANo { get; set; } = string.Empty;
        public Guid? DeliveryOrderId { get; set; }
        public DateTime? Date { get; set; }
        public string? ReturnType { get; set; }
        public decimal? ReturnQuantity { get; set; }
        public string? ReturnMethod { get; set; }
        public string? ReturnAction { get; set; }

        public Guid? SenderCompanyId { get; set; }
        public Company? SenderCompany { get; set; }

        public Guid? ReceiverCompanyId { get; set; }
        public Company? ReceiverCompany { get; set; }

        public string? Reason { get; set; }
        public string? Remarks { get; set; }
        public string Status { get; set; } = "Reported";

        public Guid? ActionUserId { get; set; }
        public string? ActionUserName { get; set; }
        public string? SignatureImage { get; set; }

        public ICollection<DORMAItem> DORMAItems { get; set; } = new List<DORMAItem>();
        public ICollection<DORMAProofImage> DORMAProofImages { get; set; } = new List<DORMAProofImage>();
        public ICollection<DORMAStatusHistory> DORMAStatusHistories { get; set; } = new List<DORMAStatusHistory>();
    }

    public class DORMAItem
    {
        public Guid Id { get; set; }
        public Guid DeliveryOrderRMAId { get; set; }
        public DeliveryOrderRMA DeliveryOrderRMA { get; set; } = null!;
        public Guid? SalesOrderItemId { get; set; }
        public Guid? DeliveryOrderItemId { get; set; }
        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Condition { get; set; }
        public string? Remarks { get; set; }
    }

    public class CreateDeliveryOrderRMARequest
    {
        public string DeliveryOrderRMANo { get; set; } = string.Empty;
        public Guid? DeliveryOrderId { get; set; }
        public DateTime? Date { get; set; }
        public string? ReturnMethod { get; set; }
        public string? ReturnType { get; set; }
        public decimal? ReturnQuantity { get; set; }
        public string? ReturnAction { get; set; }
        public Guid? SenderCompanyId { get; set; }
        public Guid? ReceiverCompanyId { get; set; }
        public string? Reason { get; set; }
        public string? Remarks { get; set; }
        public ICollection<RMAItemRequest>? DORMAItems { get; set; } = new List<RMAItemRequest>();
        public ICollection<DORMAProofImageRequest>? DORMAProofImages { get; set; } = new List<DORMAProofImageRequest>();
    }

    public class UpdateDeliveryOrderRMARequest : CreateDeliveryOrderRMARequest
    {
        public Guid Id { get; set; }
    }

    public class RMAItemRequest
    {
        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Condition { get; set; }
        public string? Remarks { get; set; }
    }

    public class DORMAProofImageRequest
    {
        public string Url { get; set; } = string.Empty;
    }

    public class UpdateRMAItemRequest : RMAItemRequest
    {
        public Guid? Id { get; set; }
    }

    public class DORMAProofImage
    {
        public Guid Id { get; set; }
        public Guid DeliveryOrderRMAId { get; set; }
        public DeliveryOrderRMA DeliveryOrderRMA { get; set; } = null!;
        public string Url { get; set; } = string.Empty;
    }

    public class UpdateRMAStatusRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? ActionUserName { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; }
    }

    public class DORMAStatusHistory
    {
        public Guid Id { get; set; }
        public Guid RMAId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime ActionAt { get; set; }
        public Guid? ActionUserId { get; set; }
        public string? Remarks { get; set; }
    }

    public class DORMADropdownDto
    {
        public List<DODropdownDto> DeliveryOrders { get; set; } = new();
        public List<ProjectDropdownDto> Projects { get; set; } = new();
        public List<CompanyDropdownItem> Companies { get; set; } = new();
        public List<UserDto> Users { get; set; } = new();
    }
}