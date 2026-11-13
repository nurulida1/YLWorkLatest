
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace YLWorks.Model
{
    // =========================================================
    // QUOTATION
    // =========================================================

    public class Quotation : BaseEntity
    {
        public Guid Id { get; set; }

        public string? QuotationNo { get; set; } = string.Empty;
        public DateTime QuotationDate { get; set; }

        public Guid FromCompanyId { get; set; }
        public Company FromCompany { get; set; } = null!;

        public Guid ClientId { get; set; }
        public Company Client { get; set; } = null!;

        public string? ProjectCode { get; set; }
        public Project? Project { get; set; }

        public string? Subject { get; set; }

        // Financial information
        public decimal? SubTotal { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal? TotalAmount { get; set; }

        // Payment and validity
        public string? PaymentTerms { get; set; }

        public bool NoValidity { get; set; } = false;

        public int? Validity { get; set; }
        public string? ValidityType { get; set; }

        public DateTime? DueDate { get; set; }

        // Status
        public string Status { get; set; } = "Draft";

        public string? Remarks { get; set; }

        // Audit
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;

        // PDF generation tracking
        public DateTime? LastGeneratedAt { get; set; }

        public Guid? LastGeneratedById { get; set; }
        public User? LastGeneratedBy { get; set; }

        public int DocumentVersion { get; set; } = 0;

        // Relationships
        public ICollection<QuotationDocument> Documents { get; set; }
            = new List<QuotationDocument>();

        public ICollection<QuotationStatusHistory> QuotationStatusHistories { get; set; }
            = new List<QuotationStatusHistory>();

        public ICollection<QuotationItems> QuotationItems { get; set; }
            = new List<QuotationItems>();

        public ICollection<QuotationTermsAndCondition> TermsAndConditions { get; set; }
            = new List<QuotationTermsAndCondition>();

        public ICollection<QuotationOtherInformation> QuotationOtherInformations { get; set; }
            = new List<QuotationOtherInformation>();
    }

    // =========================================================
    // QUOTATION STATUS HISTORY
    // =========================================================

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

    // =========================================================
    // QUOTATION ITEMS
    // =========================================================

    public class QuotationItems : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid QuotationId { get; set; }
        public Quotation Quotation { get; set; } = null!;

        public Guid? ProductServiceId { get; set; }
        public ProductService? ProductService { get; set; }

        // LineItem, CategoryHeader, NoteRow
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

    // =========================================================
    // QUOTATION TERMS AND CONDITIONS
    // =========================================================

    public class QuotationTermsAndCondition
    {
        public Guid Id { get; set; }

        public Guid QuotationId { get; set; }
        public Quotation Quotation { get; set; } = null!;

        public Guid TermsAndConditionId { get; set; }
        public TermsAndCondition TermsAndCondition { get; set; } = null!;

        public int SortOrder { get; set; }
    }

    // =========================================================
    // QUOTATION ITEM DTO
    // =========================================================

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

    // =========================================================
    // QUOTATION ITEM BASE REQUEST
    // =========================================================

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

    // =========================================================
    // BASE QUOTATION REQUEST
    // =========================================================

    public abstract class BaseQuotationRequest
    {
        public string? QuotationNo { get; set; } = string.Empty;

        public DateTime QuotationDate { get; set; }

        public Guid FromCompanyId { get; set; }
        public Guid ClientId { get; set; }

        public string? ProjectCode { get; set; }
        public string? Subject { get; set; }

        // Financial information
        public decimal? SubTotal { get; set; }
        public decimal? Discount { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }

        // Payment and validity
        public string? PaymentTerms { get; set; }

        public bool NoValidity { get; set; } = false;

        public int? Validity { get; set; }
        public string? ValidityType { get; set; }

        // Terms and conditions
        public List<TermsAndConditionOrderDto> TermsAndConditions { get; set; }
            = new();

        // Additional information
        public List<QuotationOtherInfoRequest> QuotationOtherInformations { get; set; }
            = new();
    }

    public class CreateQuotationRequest : BaseQuotationRequest
    {
        public List<QuotationItemRequest> QuotationItems { get; set; }
            = new();

    }

    public class UpdateQuotationRequest : BaseQuotationRequest
    {
        public Guid Id { get; set; }

        public List<UpdateQuotationItemRequest> QuotationItems { get; set; }
            = new();
    }

    // =========================================================
    // QUOTATION STATUS REQUEST
    // =========================================================

    public class UpdateQuotationStatusRequest
    {
        public Guid Id { get; set; }

        public string? Status { get; set; }

        public string? Remarks { get; set; }

        public string? SignatureImage { get; set; }
    }

    // =========================================================
    // QUOTATION DROPDOWN DTO
    // =========================================================

    public class QuotationDropdownDto
    {
        public Guid Id { get; set; }

        public string QuotationNo { get; set; } = string.Empty;

        public decimal? TotalAmount { get; set; }

        public Guid? ClientId { get; set; }

        public Guid? Project { get; set; }

        public string? ProjectCode { get; set; }
        public string? ProjectTitle { get; set; }

        public Guid? FromCompanyId { get; set; }

        public string? CompanyName { get; set; }

        public List<QuotationItemDto>? Items { get; set; }
            = new();
    }

    // =========================================================
    // CONVERT QUOTATION TO SALES ORDER REQUEST
    // =========================================================

    public class ConvertQuotationToSoRequest
    {
        public string? ClientPONumber { get; set; }

        public DateTime? ClientPODate { get; set; }

        public IFormFile? ClientPOAttachment { get; set; }

        public string? Remarks { get; set; }
    }

    // =========================================================
    // QUOTATION OTHER INFORMATION
    // =========================================================

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

    // =========================================================
    // TERMS AND CONDITIONS DTO
    // =========================================================

    public class TermsAndConditionOrderDto
    {
        public Guid? Id { get; set; }

        public string? Title { get; set; }

        public string? Description { get; set; }

        public int SortOrder { get; set; }
    }

    // =========================================================
    // QUOTATION TEMPLATE
    // =========================================================

    public class QuotationTemplate : BaseEntity
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Guid FromCompanyId { get; set; }
        public Company FromCompany { get; set; } = null!;

        public string? Subject { get; set; }

        public string? ProjectCode { get; set; }

        public decimal? Discount { get; set; }

        public decimal? TaxAmount { get; set; }

        public string? PaymentTerms { get; set; }

        public bool NoValidity { get; set; } = false;

        public int? Validity { get; set; }

        public string? ValidityType { get; set; }

        public bool IsActive { get; set; } = true;

        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;

        public DateTime CreatedAt { get; set; }

        public Guid? UpdatedById { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ICollection<QuotationTemplateItem> Items { get; set; }
            = new List<QuotationTemplateItem>();

        public ICollection<QuotationTemplateTerm> Terms { get; set; }
            = new List<QuotationTemplateTerm>();
    }

    // =========================================================
    // QUOTATION TEMPLATE ITEM
    // =========================================================

    public class QuotationTemplateItem
    {
        public Guid Id { get; set; }

        public Guid TemplateId { get; set; }
        public QuotationTemplate Template { get; set; } = null!;

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

    // =========================================================
    // QUOTATION TEMPLATE TERMS
    // =========================================================

    public class QuotationTemplateTerm
    {
        public Guid Id { get; set; }

        public Guid TemplateId { get; set; }
        public QuotationTemplate Template { get; set; } = null!;

        public Guid? TermsAndConditionId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int SortOrder { get; set; }
    }

    // =========================================================
    // QUOTATION DOCUMENT / PDF HISTORY
    // =========================================================

    public class QuotationDocument
    {
        public Guid Id { get; set; }

        public Guid QuotationId { get; set; }

        public Quotation Quotation { get; set; } = null!;

        public string FileName { get; set; } = string.Empty;

        public string FilePath { get; set; } = string.Empty;

        public string ContentType { get; set; } = "application/pdf";

        public int Version { get; set; }

        public DateTime GeneratedAt { get; set; }

        public Guid GeneratedById { get; set; }
    }

    // =========================================================
    // CREATE QUOTATION TEMPLATE REQUEST
    // =========================================================

    public class CreateQuotationTemplateRequest
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Guid FromCompanyId { get; set; }

        public string? Subject { get; set; }

        public string? ProjectCode { get; set; }

        public decimal? Discount { get; set; }

        public decimal? TaxAmount { get; set; }

        public string? PaymentTerms { get; set; }

        public bool NoValidity { get; set; } = false;

        public int? Validity { get; set; }

        public string? ValidityType { get; set; }

        public List<QuotationItemRequest> Items { get; set; }
            = new();

        public List<TermsAndConditionOrderDto> TermsAndConditions { get; set; }
            = new();
    }

    // =========================================================
    // UPDATE QUOTATION TEMPLATE REQUEST
    // =========================================================

    public class UpdateQuotationTemplateRequest : CreateQuotationTemplateRequest
    {
        public Guid Id { get; set; }
    }

    public class QuotationTemplateDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Guid FromCompanyId { get; set; }

        public string? CompanyName { get; set; }

        public string? Subject { get; set; }

        public string? ProjectCode { get; set; }

        public decimal? Discount { get; set; }

        public decimal? TaxAmount { get; set; }

        public string? PaymentTerms { get; set; }

        public bool NoValidity { get; set; }

        public int? Validity { get; set; }

        public string? ValidityType { get; set; }

        public bool IsActive { get; set; }

        public string? CreatedByName { get; set; }

        public DateTime CreatedAt { get; set; }

        public List<QuotationItemDto> Items { get; set; } = new();

        public List<TermsAndConditionOrderDto> TermsAndConditions { get; set; } = new();
    }

    public class SaveQuotationAsTemplateRequest
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
    }

}
