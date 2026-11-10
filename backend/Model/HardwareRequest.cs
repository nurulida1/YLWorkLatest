
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model
{
    public class HardwareRequest : BaseEntity
    {
        public Guid Id { get; set; }

        // ==========================================
        // REQUEST INFORMATION
        // ==========================================

        [Required]
        [MaxLength(50)]
        public string RequestType { get; set; } = "Hardware";
        // Hardware, SiteMaterial, ITSupport, BugReport

        [Required]
        [MaxLength(150)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Priority { get; set; } = "Normal";
        // Low, Normal, High, Urgent

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";
        // Pending, Approved, Rejected, PartiallyIssued,
        // Issued, InProgress, Resolved, Cancelled

        // ==========================================
        // EMPLOYEE
        // ==========================================

        [Required]
        public Guid RequestedById { get; set; }

        [ForeignKey(nameof(RequestedById))]
        public User? RequestedBy { get; set; }

        // ==========================================
        // PROJECT / SITE
        // ==========================================

        public Guid? ProjectId { get; set; }

        [ForeignKey(nameof(ProjectId))]
        public Project? Project { get; set; }

        [MaxLength(200)]
        public string? ProjectName { get; set; }

        [MaxLength(200)]
        public string? SiteName { get; set; }

        [MaxLength(100)]
        public string? Location { get; set; }

        [MaxLength(200)]
        public string? LocationDetails { get; set; }

        // ==========================================
        // REQUEST DATES
        // ==========================================

        public DateTime? NeededBy { get; set; }

        public DateTime? ApprovedAt { get; set; }

        public Guid? ApprovedById { get; set; }

        [ForeignKey(nameof(ApprovedById))]
        public User? ApprovedBy { get; set; }

        // ==========================================
        // IT / INVENTORY ASSIGNMENT
        // ==========================================

        public Guid? AssignedToId { get; set; }

        [ForeignKey(nameof(AssignedToId))]
        public User? AssignedTo { get; set; }

        public DateTime? CompletedAt { get; set; }

        [MaxLength(2000)]
        public string? AdminRemarks { get; set; }

        [MaxLength(2000)]
        public string? RejectionReason { get; set; }

        // ==========================================
        // RESPONSIBLE DEPARTMENT / HOD APPROVAL
        // ==========================================

        public Guid? ResponsibleDepartmentId { get; set; }

        [ForeignKey(nameof(ResponsibleDepartmentId))]
        public Department? ResponsibleDepartment { get; set; }

        // ==========================================
        // BUG REPORT INFORMATION
        // ==========================================

        [MaxLength(100)]
        public string? AffectedModule { get; set; }

        [MaxLength(50)]
        public string? BugCategory { get; set; }

        [MaxLength(4000)]
        public string? StepsToReproduce { get; set; }

        [MaxLength(2000)]
        public string? ExpectedResult { get; set; }

        [MaxLength(2000)]
        public string? ActualResult { get; set; }

        // ==========================================
        // REQUEST ITEMS
        // ==========================================

        public ICollection<HardwareRequestItem> Items { get; set; }
            = new List<HardwareRequestItem>();
    }

    // ==========================================
    // HARDWARE REQUEST ITEM
    // ==========================================

    public class HardwareRequestItem : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid HardwareRequestId { get; set; }

        [ForeignKey(nameof(HardwareRequestId))]
        public HardwareRequest? HardwareRequest { get; set; }

        // ==========================================
        // INVENTORY LINK
        // ==========================================

        // Nullable because employees can request
        // items that do not exist in inventory.

        public Guid? InventoryId { get; set; }

        [ForeignKey(nameof(InventoryId))]
        public Inventory? Inventory { get; set; }

        // ==========================================
        // ITEM INFORMATION
        // ==========================================

        [Required]
        [MaxLength(100)]
        public string ItemName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ItemCode { get; set; }

        [MaxLength(100)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Unit { get; set; }

        // ==========================================
        // QUANTITIES
        // ==========================================

        [Column(TypeName = "decimal(18,2)")]
        public decimal RequestedQuantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ApprovedQuantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal IssuedQuantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ReservedQuantity { get; set; }

        // ==========================================
        // ITEM STATUS
        // ==========================================

        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [MaxLength(1000)]
        public string? Remarks { get; set; }
    }

    // ==========================================
    // CREATE HARDWARE REQUEST DTO
    // ==========================================

    public class CreateHardwareRequestDto
    {
        public string RequestType { get; set; } = "Hardware";

        public string Subject { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Priority { get; set; } = "Normal";

        // ==========================================
        // PROJECT / SITE
        // ==========================================

        public Guid? ProjectId { get; set; }

        public string? ProjectName { get; set; }

        public string? SiteName { get; set; }

        public string? Location { get; set; }

        public string? LocationDetails { get; set; }

        public DateTime? NeededBy { get; set; }

        // ==========================================
        // BUG REPORT INFORMATION
        // ==========================================

        public string? AffectedModule { get; set; }

        public string? BugCategory { get; set; }

        public string? StepsToReproduce { get; set; }

        public string? ExpectedResult { get; set; }

        public string? ActualResult { get; set; }

        // ==========================================
        // HARDWARE / SITE MATERIAL ITEMS
        // ==========================================

        public List<CreateHardwareRequestItemDto> Items { get; set; }
            = new();
    }

    // ==========================================
    // CREATE HARDWARE REQUEST ITEM DTO
    // ==========================================

    public class CreateHardwareRequestItemDto
    {
        public Guid? InventoryId { get; set; }

        public string? ItemName { get; set; }

        public string? ItemCode { get; set; }

        public string? Description { get; set; }

        public string? Unit { get; set; }

        public decimal RequestedQuantity { get; set; }

        public string? Remarks { get; set; }
    }

    // ==========================================
    // APPROVE REQUEST DTO
    // ==========================================

    public class ApproveHardwareRequestDto
    {
        public string? Remarks { get; set; }

        // If null, assign to the approver.
        public Guid? AssignedToId { get; set; }

        public List<ApproveHardwareRequestItemDto>? Items { get; set; }
    }

    public class ApproveHardwareRequestItemDto
    {
        public Guid RequestItemId { get; set; }

        public decimal ApprovedQuantity { get; set; }

        public string? Remarks { get; set; }
    }

    // ==========================================
    // REJECT REQUEST DTO
    // ==========================================

    public class RejectHardwareRequestDto
    {
        public string? Reason { get; set; }
    }

    // ==========================================
    // ASSIGN REQUEST DTO
    // ==========================================

    public class AssignHardwareRequestDto
    {
        public Guid AssignedToId { get; set; }
    }

    // ==========================================
    // ISSUE REQUEST DTO
    // ==========================================

    public class IssueHardwareRequestDto
    {
        public List<IssueHardwareRequestItemDto> Items { get; set; }
            = new();
    }

    public class IssueHardwareRequestItemDto
    {
        public Guid RequestItemId { get; set; }

        public decimal IssuedQuantity { get; set; }

        public string? Remarks { get; set; }
    }

    // ==========================================
    // UPDATE REQUEST STATUS DTO
    // ==========================================

    public class UpdateHardwareRequestStatusDto
    {
        public string Status { get; set; } = string.Empty;

        public string? Remarks { get; set; }
    }
}
