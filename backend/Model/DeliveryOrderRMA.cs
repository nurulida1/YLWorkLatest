namespace YLWorks.Model
{
    public class DeliveryOrderRMA : BaseEntity
    {
        public Guid Id { get; set; }
        public string RMANo { get; set; } = string.Empty;
        public Guid? DeliveryOrderId { get; set; }
        public DateTime? Date { get; set; }
        public string? ReferenceNo { get; set; }
        public string? ReturnType { get; set; } // Defective, WrongItem, ExcessItem, MissingPart, NotAsSpecified, DamagedDuringTransit, ClientRejected, WarrantyReturn, Others
        public string? ReturnMethod { get; set; } // Pickup, DropOff, Courier
        public string? ReturnAction { get; set; } // Return, Exchange, Repair, CreditNote, Reject
        public Guid? SenderCompanyId { get; set; }
        public Company? SenderCompany { get; set; }
        public Guid? ReceiverCompanyId { get; set; }
        public Company? ReceiverCompany { get; set; }
        public string? Reason { get; set; }
        public string? Remarks { get; set; }
        public string Status { get; set; } = "Reported"; // Reported, UnderReview, Approved, Rejected, CollectionScheduled, Collected, Processing, Completed, Cancelled
        public RMAStatusHistory? RMAStatusHistory { get; set; }
        public ICollection<RMAItem>? RMAItems { get; set; } = new List<RMAItem>();
    }

    public class RMAStatusHistory: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid DeliveryOrderRMAId { get; set; }
        public DeliveryOrderRMA DeliveryOrderRMA { get; set; } = null!;
        public string Status { get; set; } = string.Empty;
        public DateTime? ActionAt { get; set; } = null;
        public Guid? ActionUserId { get; set; }
        public string? ActionUserName { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; }
        public List<string>? ProofImageUrls { get; set; }
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
        public double? Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Condition { get; set; }
        public string? Remarks { get; set; }
    }

    public class UpdateRMAItemRequest : RMAItemRequest
    {
        public Guid? Id { get; set; }
    }

    public class RMAStatusHistoryRequest
    {
        public string Status { get; set; } = string.Empty;
        public DateTime ActionAt { get; set; }
        public Guid? ActionUserId { get; set; }
        public string? ActionUserName { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; }
        public List<string>? ProofImageUrls { get; set; }
    }

    public class UpdateRMAStatusHistoryRequest : RMAStatusHistoryRequest
    {
        public Guid? Id { get; set; }
    }

}