using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace YLWorks.Model
{
    public class PurchaseOrder: BaseEntity
    {
        public Guid Id { get; set; }
        public string PurchaseOrderNo { get; set; } = string.Empty;
        public Guid? FromCompanyId { get; set; }
        public Company? FromCompany { get; set; }

        public DateTime? PODate { get; set; }
        public DateTime? POReceivedDate { get; set; }

        public Guid? SupplierId { get; set; }
        public Company? Supplier { get; set; }

        public Guid? ClientId { get; set; }
        public Company? Client { get; set; }

        public string? Terms { get; set; }
        public Guid? ProjectId { get; set; }
        public Project? Project { get; set; }

        public Guid? QuotationId { get; set; }
        public Quotation? Quotation { get; set; }

        public int? TotalQuantity { get; set; }
        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? TotalInWords { get; set; }

        public string? Remarks { get; set; }
        public string? Notes { get; set; }

        public Guid? PurchaseOrderId { get; set; }
        public Guid? SalesOrderId { get; set; }

        public string Status { get; set; } = "Draft"; // Draft, Sent, Accepted, PartiallyReceived, Completed, Cancelled

        public decimal? InvoicedAmount { get; set; }
        public string? InvoiceStatus { get; set; } = "NotInvoiced";
        // NotInvoiced | PartiallyInvoiced | FullyInvoiced

        public string? TermsAndCondition { get; set; }
        public string? BankDetails { get; set; }

        public string? Attachment { get; set; }
        public Guid? CreatedById { get; set; }
        public ICollection<PurchaseOrderStatusHistory> PurchaseOrderStatusHistories { get; set; } = new List<PurchaseOrderStatusHistory>();
        public ICollection<PurchaseOrderItem>? PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    }

    public class PurchaseOrderStatusHistory
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderId { get; set; }
        [JsonIgnore]
        public PurchaseOrder PurchaseOrder { get; set; } = null!;
        public string Status { get; set; } = string.Empty;
        public DateTime ActionAt { get; set; }
        public Guid? ActionUserId { get; set; }
        public User? ActionUser { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; } 
    }

    public class PurchaseOrderItem : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; } = null!;
        public string? Item { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Nos";
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? ReceivedQuantity { get; set; } = 0;
    }

    public class POItemDto
    {
        public Guid Id { get; set; }
        public string? Item { get; set; }
        public string Description { get; set; }
        public string? Unit { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? ReceivedQuantity { get; set; } = 0;
    }

    public class POItemBase
    {
        public Guid? Id { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public string? Item { get; set; }
        public string? Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class POItemRequest : POItemBase { }

    public class UpdatePOItemRequest : POItemBase
    {
        public Guid? Id { get; set; }
    }


    public class CreatePORequest
    {
        public string PurchaseOrderNo { get; set; } = string.Empty;
        public Guid? FromCompanyId { get; set; }
        public DateTime? PODate { get; set; }
        public DateTime? POReceivedDate {  get; set; }
        public Guid? SupplierId { get; set; }
        public Guid? ClientId {  get; set; }
        public string? Terms { get; set; }

        public Guid? QuotationId { get; set; }
        public Guid? ProjectId { get; set; }

        public Guid? PurchaseOrderId { get; set; }
        public Guid? SalesOrderId {  get; set; }

        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalAmount { get; set; }

        public string? Notes { get; set; }
        public string? Remarks { get; set; }
        public string? TermsAndConditions { get; set; }
        public string? BankDetails { get; set; }
        public int? TotalQuantity { get; set; }
        public IFormFile? Attachment { get; set; }

        public List<POItemRequest> PurchaseOrderItems { get; set; } = new();
    }

    public class UpdatePORequest
    {
        public Guid Id { get; set; } 
        public string PurchaseOrderNo { get; set; } = string.Empty;
        public Guid? FromCompanyId { get; set; }
        public DateTime? PODate { get; set; }
        public DateTime? POReceivedDate { get; set; }
        public Guid? SupplierId { get; set; }
        public Guid? ClientId { get; set; }
        public string? Terms { get; set; }
        public Guid? QuotationId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? PurchaseOrderId {  get; set; }
        public Guid? SalesOrderId {  get; set; }
        public decimal? Gross { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Notes { get; set; }
        public string? Remarks { get; set; }
        public string? TermsAndConditions { get; set; }
        public string? BankDetails { get; set; }
        public int? TotalQuantity { get; set; }
        public IFormFile? Attachment { get; set; }

        public List<UpdatePOItemRequest> PurchaseOrderItems { get; set; } = new();
    }

    public class UpdatePOStatusRequest
    {
        public Guid Id { get; set; }         
        public string? Status { get; set; } 
        public string? Remarks { get; set; }  
        public string? SignatureImage { get; set; } 
    }

    public class DropdownResponseDto
    {
        public List<Company> Companies { get; set; } = new();
        public List<Company> Clients { get; set; } = new();
        public List<Company> Suppliers { get; set; } = new();
        public List<QuotationDropdownDto> Quotations { get; set; } = new();
        public List<PurchaseOrder> PurchaseOrders { get; set; } = new();
        public List<DODropdownDto> DeliveryOrders { get; set; } = new();
        public List<Project> Projects { get; set; } = new();
        public List<SalesOrderDropdownDto> SalesOrders { get; set; }
    }

    public class ConvertPOToInvoiceRequest
    {
        public Guid PoId { get; set; }
        public decimal Amount { get; set; }
    }

    public class PurchaseOrderDropdownDto
    {
        public List<QuotationDropdownDto> Quotations { get; set; } = new();

        public List<ProjectDropdownItem> Projects { get; set; } = new();
        public List<CompanyDropdownItem> Companies { get; set; } = new();
        public List<CompanyDropdownItem> Suppliers { get; set; } = new();
        public List<CompanyDropdownItem> Clients { get; set; } = new();
        public List<UserDto> Users { get; set; } = new();

    }

}
