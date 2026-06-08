using System;

namespace YLWorks.Model
{
    public class Quotation: BaseEntity
    {
        public Guid Id {  get; set; }
        public string? QuotationNo { get; set; } = string.Empty;
        public DateTime QuotationDate { get; set; }
        public Guid FromCompanyId { get; set; }
        public Company FromCompany { get; set; }
        public Guid ClientId { get; set; }
        public Company Client { get; set; } = null!;
        public string? ProjectCode { get; set; }
        public Project? Project { get; set; }
        public string? Subject { get; set; }

        public decimal? SubTotal { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal? TotalAmount { get; set; }

        public string? PaymentTerms { get; set; }
        public int? ValidityDays {  get; set; }
        public string? Execution { get; set; }
        public string? WarrantyTerms { get; set; }

        public string Status { get; set; } = "Draft"; // Draft, Revised, Approved, Sent, Accepted, Rejected
        public string? Remarks { get; set; }
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;
        public ICollection<QuotationStatusHistory> QuotationStatusHistories { get; set; } = new List<QuotationStatusHistory>();
        public ICollection<QuotationItems> QuotationItems { get; set; } = new List<QuotationItems>();
    }

    public class QuotationStatusHistory
    {
        public Guid Id { get; set; }
        public Guid QuotationId { get; set; }
        public Quotation Quotation { get; set; } = null!;
        public string Status { get; set; } = string.Empty;
        public DateTime ActionAt { get; set; }
        public Guid? ActionUserId { get; set; }
        public User? ActionUser { get; set; }
        public string? Remarks { get; set; }
        public string? SignatureImage { get; set; }
    }

    public class QuotationItems : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid QuotationId { get; set; }
        public Quotation Quotation { get; set; } = null!;
        public Guid? ParentId { get; set; }
        public QuotationItems? Parent { get; set; }
        public int SortOrder { get; set; }
        public string Type { get; set; } // Category @ ITEM
        public string? ItemType { get; set; } //Product, Service, Notes
        public string? Item { get; set; }
        public string? Description { get; set; }
        public bool IsGroup { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount {  get; set; }
        public decimal? TaxRate {  get; set; }
        public decimal? TotalPrice { get; set; }
        public List<QuotationItems> Children { get; set; } = new List<QuotationItems>();
    }

    public class QuotationItemDto
    {
        public Guid Id { get; set; }
        public int SortOrder { get; set; }
        public string Type { get; set; }
        public string? ItemType { get; set; } //Product, Service, Notes
        public bool IsGroup { get; set; }
        public string? Item { get; set; }
        public string Description { get; set; }
        public string? Unit { get; set; }
        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TaxRate { get; set; }
        public decimal? TotalPrice { get; set; }
        public List<QuotationItemDto> Children { get; set;} = new List<QuotationItemDto>();
    }

    public class QuotationItemBase
    {
        public Guid? Id { get; set; }
        public int SortOrder { get; set; }
        public string Type { get; set; }
        public string? ItemType { get; set; } //Product, Service, Notes
        public bool IsGroup { get; set; }
        public Guid? ParentId { get; set; }
        public string? Item { get; set; }
        public string? Description { get; set; } = string.Empty;
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TaxRate { get; set; }
        public decimal? TotalPrice { get; set; }
        public List<QuotationItemRequest> Children { get; set; } = new();
    }

    public class QuotationItemRequest : QuotationItemBase 
    { 
        public List<QuotationItemRequest> Children { get; set; } = new(); 
    }

    public class UpdateQuotationItemRequest : QuotationItemBase
    {
        public List<QuotationItemRequest> Children { get; set; } = new();
    }

    public abstract class BaseQuotationRequest
    {
        public string? QuotationNo { get; set; } = string.Empty;
        public DateTime QuotationDate { get; set; }
        public Guid FromCompanyId { get; set; }
        public Guid ClientId { get; set; }
        public string? ProjectCode { get; set; }
        public string? Subject { get; set; }
        public decimal? SubTotal { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string? PaymentTerms { get; set; }
        public int? ValidityDays { get; set; }
        public string? Execution { get; set; }
        public string? WarrantyTerms { get; set; }
    }

    public class CreateQuotationRequest : BaseQuotationRequest
    {
        public List<QuotationItemRequest> QuotationItems { get; set; } = new();
    }

    public class UpdateQuotationRequest : BaseQuotationRequest
    {
        public Guid Id { get; set; }
        public List<UpdateQuotationItemRequest> QuotationItems { get; set; } = new();
    }

    public class UpdateQuotationStatusRequest
    {
        public Guid Id { get; set; }          
        public string? Status { get; set; }  
        public string? Remarks { get; set; }  
        public string? SignatureImage { get; set; }
    }

    public class QuotationDropdownDto
    {
        public Guid Id { get; set; }
        public string QuotationNo { get; set; } = string.Empty;
        public decimal? TotalAmount { get; set; }
        public Guid? ClientId { get; set; }
        public Guid? Project { get; set; }
        public string? ProjectCode { get; set; }
        public string? ProjectTitle { get; set; }
        public Guid? FromCompanyId {  get; set; }
        public string? CompanyName { get; set; }
        public List<QuotationItemDto>? Items { get; set; } = new();

    }

    public class ConvertQuotationToSoRequest
    {
        public string? ClientPONumber { get; set; }
        public DateTime? ClientPODate { get; set; }
        public IFormFile? ClientPOAttachment { get; set; }
        public string? Remarks { get; set; }
    }


}
