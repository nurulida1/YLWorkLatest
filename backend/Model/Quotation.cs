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
        public int? Validity { get; set; }
        public string? ValidityType { get; set; }

        public DateTime? DueDate { get; set; }

        public string Status { get; set; } = "Draft"; // Draft, Revised, Approved, Sent, Accepted, Rejected
        public string? Remarks { get; set; }
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;
        public ICollection<QuotationStatusHistory> QuotationStatusHistories { get; set; } = new List<QuotationStatusHistory>();
        public ICollection<QuotationItems> QuotationItems { get; set; } = new List<QuotationItems>();
        public ICollection<QuotationTermsAndCondition> TermsAndConditions { get; set; }
    = new List<QuotationTermsAndCondition>();
        public ICollection<QuotationOtherInformation> QuotationOtherInformations { get; set; }
    = new List<QuotationOtherInformation>();
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
        
        public Guid? ProductServiceId { get; set; }
        public ProductService? ProductService { get; set; }

        public string? RowType { get; set; } // CategoryHeader, LineItem, NoteRow
        public string? Item { get; set; }
        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount {  get; set; }
        public decimal? TotalPrice { get; set; }
        public int SortOrder { get; set; }
    }

    public class QuotationTermsAndCondition
    {
        public Guid Id { get; set; }
        public Guid QuotationId { get; set; }
        public Quotation Quotation { get; set; }
        public Guid TermsAndConditionId { get; set; }
        public TermsAndCondition TermsAndCondition { get; set; }
        public int SortOrder { get; set; }
    }

    public class QuotationItemDto
    {
        public Guid Id { get; set; }
        public Guid QuotationId { get; set; }
        public Guid? ProductServiceId { get; set; }
        public string? RowType { get; set; } = "LineItem";
        public string? Item { get; set; }
        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalPrice { get; set; }
        public int SortOrder { get; set; }
    }

    public class QuotationItemBase
    {
        public Guid? Id { get; set; }
        public Guid QuotationId { get; set; }

        public Guid? ProductServiceId { get; set; } 

        public string? RowType { get; set; } = "LineItem";
        public string? Item { get; set; }
        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TotalPrice { get; set; }
        public int SortOrder { get; set; }
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
        public int? Validity { get; set; }
        public string? ValidityType { get; set; }
        public List<TermsAndConditionOrderDto> TermsAndConditions { get; set; } = new();
        public List<QuotationOtherInfoRequest> QuotationOtherInformations { get; set; }
        = new();
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

    public class QuotationOtherInformation
    {
        public Guid Id { get; set; }

        public Guid QuotationId { get; set; }
        public Quotation Quotation { get; set; } = null!;

        public string Key { get; set; } = string.Empty;     
        public string Value { get; set; } = string.Empty;   

        public int SortOrder { get; set; }
    }

    public class QuotationOtherInfoRequest
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    public class TermsAndConditionOrderDto
    {
        public Guid? Id { get; set; } 
        public string? Title { get; set; }             
        public string? Description { get; set; }      
        public int SortOrder { get; set; }
    }

}
