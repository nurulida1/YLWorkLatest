
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model
{
    public class HardwareRequest : BaseEntity
    {
        public Guid Id { get; set; }

        // Request information
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

        // Employee
        [Required]
        public Guid RequestedById { get; set; }

        [ForeignKey(nameof(RequestedById))]
        public User? RequestedBy { get; set; }

        // Project / Site
        public Guid? ProjectId { get; set; }

        [MaxLength(200)]
        public string? ProjectName { get; set; }

        [MaxLength(200)]
        public string? SiteName { get; set; }

        [MaxLength(100)]
        public string? Location { get; set; }

        [MaxLength(200)]
        public string? LocationDetails { get; set; }

        // Request dates
        public DateTime? NeededBy { get; set; }

        public DateTime? ApprovedAt { get; set; }

        public Guid? ApprovedById { get; set; }

        [ForeignKey(nameof(ApprovedById))]
        public User? ApprovedBy { get; set; }

        // IT / Inventory assignment
        public Guid? AssignedToId { get; set; }

        [ForeignKey(nameof(AssignedToId))]
        public User? AssignedTo { get; set; }

        public DateTime? CompletedAt { get; set; }

        [MaxLength(2000)]
        public string? AdminRemarks { get; set; }

        [MaxLength(2000)]
        public string? RejectionReason { get; set; }

        // Responsible Department / HOD Approval
        public Guid? ResponsibleDepartmentId { get; set; }

        [ForeignKey(nameof(ResponsibleDepartmentId))]
        public Department? ResponsibleDepartment { get; set; }

        // Bug Report Information
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

        // Navigation
        public ICollection<HardwareRequestItem> Items { get; set; }
            = new List<HardwareRequestItem>();
    }

    public class HardwareRequestItem : BaseEntity
    {
        public Guid Id { get; set; }

        [Required]
        public Guid HardwareRequestId { get; set; }

        [ForeignKey(nameof(HardwareRequestId))]
        public HardwareRequest? HardwareRequest { get; set; }

        // Link to existing Inventory record.
        // Nullable so employees can request an item
        // that does not exist in the inventory catalogue.
        public Guid? InventoryId { get; set; }

        [ForeignKey(nameof(InventoryId))]
        public Inventory? Inventory { get; set; }

        // Snapshot of item details at request time.
        [Required]
        [MaxLength(100)]
        public string ItemName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ItemCode { get; set; }

        [MaxLength(100)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Unit { get; set; }

        // Quantities
        [Column(TypeName = "decimal(18,2)")]
        public decimal RequestedQuantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ApprovedQuantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal IssuedQuantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ReservedQuantity { get; set; }

        // Item-level status
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [MaxLength(1000)]
        public string? Remarks { get; set; }
    }

    // Create Request
    public class CreateHardwareRequestDto
    {
        public string RequestType { get; set; } = "Hardware";

        public string Subject { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Priority { get; set; } = "Normal";

        // Project / Site
        public Guid? ProjectId { get; set; }

        public string? ProjectName { get; set; }

        public string? SiteName { get; set; }

        public string? Location { get; set; }

        public string? LocationDetails { get; set; }

        public DateTime? NeededBy { get; set; }

        // Bug Report Information
        public string? AffectedModule { get; set; }

        public string? BugCategory { get; set; }

        public string? StepsToReproduce { get; set; }

        public string? ExpectedResult { get; set; }

        public string? ActualResult { get; set; }

        // Hardware / Site Material Items
        public List<CreateHardwareRequestItemDto> Items { get; set; }
            = new();
    }

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

    // Approve Request
    public class ApproveHardwareRequestDto
    {
        public string? Remarks { get; set; }

        // Optional: if null, assign to the approver.
        public Guid? AssignedToId { get; set; }

        public List<ApproveHardwareRequestItemDto>? Items { get; set; }
    }

    public class ApproveHardwareRequestItemDto
    {
        public Guid RequestItemId { get; set; }

        public decimal ApprovedQuantity { get; set; }

        public string? Remarks { get; set; }
    }

    // Reject Request
    public class RejectHardwareRequestDto
    {
        public string? Reason { get; set; }
    }

    // Assign Request
    public class AssignHardwareRequestDto
    {
        public Guid AssignedToId { get; set; }
    }

    // Issue Request
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

    // Update Request Status
    public class UpdateHardwareRequestStatusDto
    {
        public string Status { get; set; } = string.Empty;

        public string? Remarks { get; set; }
    }
}
