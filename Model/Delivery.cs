namespace YLWorks.Model
{
    public class Delivery: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid? ProjectId {  get; set; }
        public Project Project { get; set; }
        public Guid? POId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; }
        public Guid? TaskId { get; set; }
        public ProjectTask? Task { get; set; }
        public DateTime DeliveryDate { get; set; }
        public string DeliveryMethod { get; set; } // Courier / In-house / Pickup
        public string Status { get; set; } // Pending / Shipped / Delivered
        public string? TrackingNumber { get; set; }
        public string? DeliveredBy { get; set; }
    }

    public class CreateDeliveryRequest
    {
        public Guid? ProjectId { get; set; }
        public Guid? POId { get; set; }
        public Guid? TaskId { get; set; }
        public DateTime DeliveryDate { get; set; }
        public string DeliveryMethod { get; set; } // Courier / In-house / Pickup
        public string? TrackingNumber { get; set; }
        public string? DeliveredBy { get; set; }
    }

    public class UpdateDeliveryRequest
    {
        public Guid Id {  get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? POId { get; set; }
        public Guid? TaskId { get; set; }
        public DateTime DeliveryDate { get; set; }
        public string DeliveryMethod { get; set; } // Courier / In-house / Pickup
        public string? TrackingNumber { get; set; }
        public string? DeliveredBy { get; set; }
    }
}
