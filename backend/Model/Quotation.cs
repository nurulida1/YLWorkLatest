using System;

namespace YLWorks.Model
{
    public class Quotation: BaseEntity
    {
        public Guid Id {  get; set; }
        public string QuotationNo { get; set; } = string.Empty;
        public string? ReferenceNo { get; set; }
        public DateTime QuotationDate { get; set; }
        public Guid FromCompanyId { get; set; }
        public Company FromCompany { get; set; }
        public Guid ClientId { get; set; }
        public Company Client { get; set; } = null!;
        public string? ProjectCode { get; set; }
        public Project? Project { get; set; }
        public string? Subject { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? TermsAndConditions { get; set; }
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
        public Guid? ReviewedByUserId { get; set; }
        public User? ReviewedByUser { get; set; }
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
        public string? Description { get; set; }
        public bool IsGroup { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Nos";
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public List<QuotationItems> Children { get; set; } = new List<QuotationItems>();
    }

    public class QuotationItemDto
    {
        public Guid Id { get; set; }
        public int SortOrder { get; set; }
        public string Type { get; set; }
        public bool IsGroup { get; set; }
        public string Description { get; set; }
        public string? Unit { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public List<QuotationItemDto> Children { get; set;} = new List<QuotationItemDto>();
    }

    public class QuotationItemBase
    {
        public Guid? Id { get; set; }
        public int SortOrder { get; set; }
        public string Type { get; set; }
        public bool IsGroup { get; set; }
        public Guid? ParentId { get; set; }
        public string? Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = "Unit";
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public List<QuotationItemRequest> Children { get; set; } = new();
    }

    // Used for Create: No ID needed as all items are new
    public class QuotationItemRequest : QuotationItemBase { }

    // Used for Update: Optional ID to differentiate between 'Edit' and 'Add New'
    public class UpdateQuotationItemRequest : QuotationItemBase
    {
        public Guid? Id { get; set; }
    }

    // --- Main Request Models ---

    public class CreateQuotationRequest
    {
        public string QuotationNo { get; set; } = string.Empty;
        public string? ReferenceNo { get; set; }
        public DateTime QuotationDate { get; set; }
        public Guid FromCompanyId { get; set; }
        public Guid ClientId { get; set; }
        public string? ProjectCode { get; set; }
        public string? Subject { get; set; }
        public decimal TotalAmount { get; set; }
        public string? TermsAndConditions { get; set; }

        public List<QuotationItemRequest> QuotationItems { get; set; } = new();
    }

    public class UpdateQuotationRequest : CreateQuotationRequest
    {
        public Guid Id { get; set; }

        // Replaces ICollection<QuotationItemRequest> with the Update version
        public new List<UpdateQuotationItemRequest>? QuotationItems { get; set; }
    }
    
    public class UpdateQuotationStatusRequest
    {
        public Guid Id { get; set; }          
        public string? Status { get; set; }  
        public string? Remarks { get; set; }  
        public string? SignatureImage { get; set; }
    }
}
