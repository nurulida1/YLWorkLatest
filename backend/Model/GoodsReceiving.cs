namespace YLWorks.Model
{
    public class GoodsReceiving : BaseEntity
    {
        public Guid Id { get; set; }
        public string GRNNo { get; set; } = string.Empty;
        public Guid PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; } = null!;
        public Guid SupplierId { get; set; }
        public Company Supplier { get; set; }
        public DateTime ReceivedDate { get; set; }

        public string? SupplierDONo { get; set; }
        public DateTime? SupplierDODate { get; set; }
        public string? SupplierDOAttachment { get; set; }

        public string Status { get; set; } = "Draft"; //Draft, Partial, Completed
        public string? Remarks { get; set; }
        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalAmount { get; set; }
        public Guid? CreatedById { get; set; }
        public User? CreatedBy { get; set; }
        public ICollection<GoodsReceivingItem> GoodsReceivingItems { get; set; } = new List<GoodsReceivingItem>();
    }

    public class GoodsReceivingItem : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid GoodsReceivingId { get; set; }
        public GoodsReceiving GoodsReceiving { get; set; } = null!;
        public Guid? PurchaseOrderItemId { get; set; }
        public PurchaseOrderItem? PurchaseOrderItem { get; set; } = null!;

        public decimal ReceivedQuantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public string? Unit { get; set; }
        public decimal? TotalPrice { get; set; }
        public string? Remarks { get; set; }
    }

    public class GoodsReceivingItemRequest
    {
        public Guid? PurchaseOrderItemId { get; set; }
        public decimal ReceivedQuantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public string? Unit { get; set; }
        public decimal? TotalPrice { get; set; }
        public string? Remarks { get; set; }
    }

    public class CreateGoodsReceivingRequest
    {
        public string GRNNo { get; set; } = string.Empty;

        public Guid PurchaseOrderId { get; set; }
        public Guid SupplierId { get; set; }

        public DateTime ReceivedDate { get; set; }

        public string? SupplierDONo { get; set; }
        public DateTime? SupplierDODate { get; set; }
        public IFormFile? SupplierDOAttachment { get; set; }

        public string? Remarks { get; set; }
        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalAmount { get; set; }

        public List<GoodsReceivingItemRequest> GoodsReceivingItems { get; set; } = new();
    }

    public class UpdateGoodsReceivingItemRequest
    {
        public Guid? Id { get; set; }

        public Guid? PurchaseOrderItemId { get; set; }
        public decimal ReceivedQuantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public string? Unit { get; set; }
        public decimal? TotalPrice { get; set; }
        public string? Remarks { get; set; }
    }

    public class UpdateGoodsReceivingRequest
    {
        public Guid Id { get; set; }

        public string GRNNo { get; set; } = string.Empty;

        public Guid PurchaseOrderId { get; set; }
        public Guid SupplierId { get; set; }

        public DateTime ReceivedDate { get; set; }

        public string? SupplierDONo { get; set; }
        public DateTime? SupplierDODate { get; set; }
        public IFormFile? SupplierDOAttachment { get; set; }

        public string? Remarks { get; set; }

        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalAmount { get; set; }

        public List<UpdateGoodsReceivingItemRequest> GoodsReceivingItems { get; set; } = new();
    }

    public class GRNDropdownDto
    {
        public List<PurchaseOrder> PurchaseOrders { get; set; } = new();
        public List<Company> Suppliers { get; set; } = new();
        public List<Company> Companies { get; set; } = new();

    }
}