using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace YLWorks.Model
{
    public class SalesOrder : BaseEntity
    {
        public Guid Id { get; set; }
        public string SalesOrderNo { get; set; } = string.Empty;

        public Guid ClientId { get; set; }
        public Company Client { get; set; } = null!;

        public Guid? CompanyId {  get; set; }
        public Company? Company { get; set; }

        public Guid? QuotationId { get; set; }
        public Quotation? Quotation { get; set; }

        public Guid? ProjectId { get; set; }
        public Project? Project { get; set; }

        public string? Terms {  get; set; }

        public DateTime SODate { get; set; }
        public string Status { get; set; } = "Draft"; //Draft, Confirmed, InProgress, PartiallyDelivered, Delivered, Completed, Cancelled

        public string? ClientPONumber { get; set; }
        public DateTime? ClientPODate { get; set; }
        public string? ClientPOAttachment { get; set; }

        public decimal TotalAmount {  get; set; }
        public string? Notes { get; set; }
        public string? Remarks { get; set; }
        public ICollection<SalesOrderItem>? SalesOrderItems { get; set; } = new List<SalesOrderItem>();
        public ICollection<SalesOrderStatusHistory> SalesOrderStatusHistories { get; set; }
    = new List<SalesOrderStatusHistory>();
        public ICollection<DeliveryOrder> DeliveryOrders { get; set; }
    = new List<DeliveryOrder>();
    }

    public class SalesOrderItem
    {
        public Guid Id { get; set; }
        public Guid SalesOrderId { get; set; }

        public Guid? ParentId { get; set; }  
        public int SortOrder { get; set; }

        public string Type { get; set; }
        public bool IsGroup { get; set; }

        public string? Item {  get; set; }
        public string? Description { get; set; }

        public decimal? Quantity { get; set; }
        public decimal QuantityDelivered { get; set; }
        public decimal QuantityRemaining { get; set; }

        public string Unit { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalPrice { get; set; }
        public decimal? Discount { get; set; }

        public List<SalesOrderItem> Children { get; set; } = new();
    }

    public class SOItemBase
    {
        public Guid? Id { get; set; }
        public int SortOrder { get; set; }
        public string Type { get; set; }
        public bool IsGroup { get; set; }
        public Guid? ParentId { get; set; }
        public string? Item { get; set; }
        public string? Description { get; set; } = string.Empty;
        public decimal? Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal? UnitPrice { get; set; }
        public decimal DeliveredQuantity {  get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalPrice { get; set; }
        public List<SOItemRequest> Children { get; set; } = new();
    }

    public class SOItemRequest : SOItemBase { }

    public class CreateSalesOrderRequest
    {
        public string SalesOrderNo { get; set; } = string.Empty;

        public Guid? CompanyId { get; set; }
        public Guid ClientId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? QuotationId { get; set; }

        public DateTime SODate { get; set; }
        public string? Terms { get; set; }

        public decimal TotalAmount { get; set; }

        public string? Notes { get; set; }
        public string? Remarks { get; set; }

        public string? ClientPONumber { get; set; }
        public DateTime? ClientPODate { get; set; }
        public IFormFile? ClientPOAttachment { get; set; }

        public List<SOItemBase>? SalesOrderItems { get; set; } = new();
    }

    public class UpdateSalesOrderRequest
    {
        public Guid Id { get; set; }

        public string SalesOrderNo { get; set; } = string.Empty;

        public Guid? CompanyId { get; set; }
        public Guid ClientId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? QuotationId { get; set; }

        public DateTime SODate { get; set; }
        public string? Terms { get; set; }

        public decimal TotalAmount { get; set; }

        public string? Notes { get; set; }
        public string? Remarks { get; set; }

        public string? ClientPONumber { get; set; }
        public DateTime? ClientPODate { get; set; }
        public IFormFile? ClientPOAttachment { get; set; }

        public List<SOItemBase>? SalesOrderItems { get; set; } = new();
    }

    public class SalesOrderStatusHistory
    {
        public Guid Id { get; set; }

        public Guid SalesOrderId { get; set; }
        [JsonIgnore]
        public SalesOrder SalesOrder { get; set; } = null!;

        public string Status { get; set; } = string.Empty;

        public DateTime ActionAt { get; set; } = DateTime.UtcNow;

        public Guid? ActionUserId { get; set; }
        public User? ActionUser { get; set; }

        public string? Remarks { get; set; }
    }

    public class UpdateSalesOrderStatusRequest
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Remarks { get; set; }
    }

    public class SalesOrderDropdownDto
    {
        public Guid Id { get; set; }
        public string SalesOrderNo { get; set; }
    }

}