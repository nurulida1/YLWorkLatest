namespace YLWorks.Model
{
    public class DeliveryOrderRMA : BaseEntity
    {
        public Guid Id { get; set; }

        public string RMANo { get; set; } = string.Empty;

        public Guid? DeliveryOrderId { get; set; }

        public DateTime? Date { get; set; }

        public string? ReferenceNo { get; set; }

        public string? ReturnType { get; set; }
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
        public DateTime? StatusUpdatedAt { get; set; }

        public string? SignatureImage { get; set; }

        public ICollection<RMAItem> RMAItems { get; set; } = new List<RMAItem>();

        public ICollection<RMAProofImage> ProofImages { get; set; } = new List<RMAProofImage>();
    }

    public class RMAItem
    {
        public Guid Id { get; set; }
        public Guid DeliveryOrderRMAId { get; set; }
        public DeliveryOrderRMA DeliveryOrderRMA { get; set; } = null!;
        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Condition { get; set; }
        public string? Remarks { get; set; }
    }

    public class CreateDeliveryOrderRMARequest
    {
        public string RMANo { get; set; } = string.Empty;
        public Guid? DeliveryOrderId { get; set; }
        public DateTime? Date { get; set; }
        public string? ReferenceNo { get; set; }
        public string? ReturnMethod { get; set; }
        public string? ReturnType { get; set; }
        public string? ReturnAction { get; set; }
        public Guid? SenderCompanyId { get; set; }
        public Guid? ReceiverCompanyId { get; set; }
        public string? Reason { get; set; }
        public string? Remarks { get; set; }
        public ICollection<RMAItemRequest>? RMAItems { get; set; } = new List<RMAItemRequest>();
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

    public class UpdateRMAItemRequest : RMAItemRequest
    {
        public Guid? Id { get; set; }
    }

    public class RMAProofImage
    {
        public Guid Id { get; set; }
        public Guid DeliveryOrderRMAId { get; set; }
        public DeliveryOrderRMA DeliveryOrderRMA { get; set; } = null!;
        public string Url { get; set; } = string.Empty;
    }

    public class UpdateRMAStatusRequest
    {
        public string Status { get; set; } = string.Empty;

        public Guid? ActionUserId { get; set; }
        public string? ActionUserName { get; set; }

        public string? Remarks { get; set; }

        public string? SignatureImage { get; set; }
    }
}