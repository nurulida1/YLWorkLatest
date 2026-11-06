
using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public static class WorkOrderStatus
    {
        public const string Open = "Open";
        public const string Assigned = "Assigned";
        public const string InProgress = "InProgress";
        public const string OnHold = "OnHold";
        public const string PendingVerification = "PendingVerification";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";

        public static readonly string[] All =
        {
            Open, Assigned, InProgress, OnHold,
            PendingVerification, Completed, Cancelled
        };
    }

    public static class WorkOrderPriority
    {
        public const string Low = "Low";
        public const string Normal = "Normal";
        public const string High = "High";
        public const string Urgent = "Urgent";

        public static readonly string[] All =
        {
            Low, Normal, High, Urgent
        };
    }

    public static class WorkOrderType
    {
        public const string Installation = "Installation";
        public const string Maintenance = "Maintenance";
        public const string Troubleshooting = "Troubleshooting";
        public const string Integration = "Integration";
        public const string Configuration = "Configuration";
        public const string Inspection = "Inspection";
        public const string Support = "Support";
        public const string Testing = "Testing";
        public const string Others = "Others";

        public static readonly string[] All =
        {
            Installation, Maintenance, Troubleshooting,
            Integration, Configuration, Inspection,
            Support, Testing, Others
        };
    }

    public class WorkOrder : BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // PROJECT
        [Required]
        public Guid ProjectId { get; set; }
        public Project Project { get; set; } = null!;

        // INFORMATION
        [Required, MaxLength(50)]
        public string WorkOrderNo { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required, MaxLength(50)]
        public string WorkType { get; set; } = WorkOrderType.Others;

        [MaxLength(200)]
        public string? Location { get; set; }

        public string? ScopeOfWork { get; set; }

        public string? Remarks { get; set; }

        // SCHEDULE
        public DateTime? ScheduledDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        // ASSIGNMENT
        public Guid? AssignedToId { get; set; }
        public User? AssignedTo { get; set; }

        public ICollection<WorkOrderMember> WorkOrderMembers { get; set; }
            = new List<WorkOrderMember>();

        // STATUS
        [Required, MaxLength(30)]
        public string Status { get; set; } = WorkOrderStatus.Open;

        [Required, MaxLength(20)]
        public string Priority { get; set; } = WorkOrderPriority.Normal;

        // CHECKLIST
        public ICollection<WorkOrderChecklist> Checklists { get; set; }
            = new List<WorkOrderChecklist>();

        public ICollection<JobSheet> JobSheets { get; set; }
    = new List<JobSheet>();

        // CREATION
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;
    }

    public class WorkOrderMember : BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid WorkOrderId { get; set; }
        public WorkOrder WorkOrder { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime AssignedAt { get; set; }

        public Guid AssignedById { get; set; }
        public User AssignedBy { get; set; } = null!;
    }

    public class WorkOrderChecklist : BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid WorkOrderId { get; set; }
        public WorkOrder WorkOrder { get; set; } = null!;

        [Required, MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        public DateTime? CompletedAt { get; set; }

        public int Sequence { get; set; } = 1;
    }

    // REQUESTS

    public class CreateWorkOrderRequest
    {
        [Required]
        public Guid ProjectId { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public string WorkType { get; set; } = WorkOrderType.Others;

        public string Priority { get; set; } = WorkOrderPriority.Normal;

        public string? Status { get; set; }

        public string? Location { get; set; }

        public string? ScopeOfWork { get; set; }

        public string? Remarks { get; set; }

        public DateTime? ScheduledDate { get; set; }

        public DateTime? DueDate { get; set; }

        public Guid? AssignedToId { get; set; }

        public List<string>? WorkOrderMembers { get; set; }

        public List<CreateWorkOrderChecklistRequest> Checklists { get; set; }
            = new();

        public List<IFormFile>? Files { get; set; }
    }

    public class UpdateWorkOrderRequest : CreateWorkOrderRequest
    {
        [Required]
        public Guid Id { get; set; }
    }

    public class CreateWorkOrderChecklistRequest
    {
        [Required, MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        public int Sequence { get; set; }
    }

    public class UpdateWorkOrderChecklistRequest
    {
        public Guid? Id { get; set; }

        [Required, MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        public int Sequence { get; set; }
    }

    public class UpdateWorkOrderStatusRequest
    {
        public Guid WorkOrderId { get; set; }

        public string Status { get; set; } = string.Empty;
    }

    public class UpdateWorkOrderChecklistStatusRequest
    {
        public Guid Id { get; set; }

        public bool IsCompleted { get; set; }
    }
}
