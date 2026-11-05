
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    // =========================================================
    // TASK CONSTANTS
    // =========================================================

    public static class StaffTaskStatus
    {
        public const string Todo = "Todo";
        public const string InProgress = "InProgress";
        public const string Pending = "Pending";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";

        public static readonly string[] All =
        {
            Todo,
            InProgress,
            Pending,
            Completed,
            Cancelled
        };
    }

    public static class StaffTaskPriority
    {
        public const string Low = "Low";
        public const string Medium = "Medium";
        public const string High = "High";
        public const string Urgent = "Urgent";

        public static readonly string[] All =
        {
            Low,
            Medium,
            High,
            Urgent
        };
    }

    public static class StaffTaskCategory
    {
        public const string Admin = "Admin";
        public const string HR = "HR";
        public const string Development = "Development";
        public const string Documentation = "Documentation";
        public const string Maintenance = "Maintenance";
        public const string Meeting = "Meeting";
        public const string Training = "Training";
        public const string Others = "Others";

        public static readonly string[] All =
        {
            Admin,
            HR,
            Development,
            Documentation,
            Maintenance,
            Meeting,
            Training,
            Others
        };
    }

    public static class StaffTaskRecurringType
    {
        public const string Daily = "Daily";
        public const string Weekly = "Weekly";
        public const string Monthly = "Monthly";
        public const string Yearly = "Yearly";

        public static readonly string[] All =
        {
            Daily,
            Weekly,
            Monthly,
            Yearly
        };
    }

    // =========================================================
    // STAFF TASK ENTITY
    // =========================================================

    public class StaffTask : BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // BASIC INFORMATION

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        // ASSIGNMENT

        public Guid? AssignedToId { get; set; }

        public User? AssignedTo { get; set; }

        [Required]
        public Guid AssignedById { get; set; }

        public User AssignedBy { get; set; } = null!;

        // TASK DETAILS

        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } =
            StaffTaskPriority.Medium;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } =
            StaffTaskCategory.Others;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } =
            StaffTaskStatus.Todo;

        // SCHEDULE

        public DateTime? StartDate { get; set; }

        public DateTime DueDate { get; set; }

        public DateTime? ReminderAt { get; set; }

        // RECURRING

        public bool IsRecurring { get; set; } = false;

        [MaxLength(20)]
        public string? RecurringType { get; set; }

        // TIME TRACKING

        [Range(0, 100000)]
        public decimal? EstimatedHours { get; set; }

        [Range(0, 100000)]
        public decimal? ActualHours { get; set; }

        // COMPLETION

        public DateTime? CompletedAt { get; set; }

        public Guid? CompletedById { get; set; }

        public User? CompletedBy { get; set; }

        // CHECKLIST

        public ICollection<StaffTaskChecklist> Checklists { get; set; }
            = new List<StaffTaskChecklist>();

        // PROJECT

        // Optional project association.
        // Null means this task is not associated with a project.

        public Guid? ProjectId { get; set; }

        public Project? Project { get; set; }
    }

    // =========================================================
    // STAFF TASK CHECKLIST ENTITY
    // =========================================================

    public class StaffTaskChecklist
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StaffTaskId { get; set; }

        public StaffTask StaffTask { get; set; } = null!;

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; } = false;

        public DateTime? CompletedAt { get; set; }

        public int Sequence { get; set; } = 1;
    }

    // =========================================================
    // CREATE STAFF TASK REQUEST
    // =========================================================

    public class CreateStaffTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        // ASSIGNMENT

        public Guid? AssignedToId { get; set; }

        // TASK DETAILS

        [MaxLength(20)]
        public string Priority { get; set; } =
            StaffTaskPriority.Medium;

        [MaxLength(50)]
        public string Category { get; set; } =
            StaffTaskCategory.Others;

        // SCHEDULE

        public DateTime? StartDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        public DateTime? ReminderAt { get; set; }

        // RECURRING

        public bool IsRecurring { get; set; } = false;

        [MaxLength(20)]
        public string? RecurringType { get; set; }

        // TIME

        [Range(0, 100000)]
        public decimal? EstimatedHours { get; set; }

        // CHECKLIST

        public List<CreateStaffTaskChecklistRequest> Checklists { get; set; }
            = new();

        // OPTIONAL PROJECT

        public Guid? ProjectId { get; set; }
    }

    // =========================================================
    // CREATE CHECKLIST REQUEST
    // =========================================================

    public class CreateStaffTaskChecklistRequest
    {
        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        public int Sequence { get; set; }
    }

    // =========================================================
    // UPDATE STAFF TASK REQUEST
    // =========================================================

    public class UpdateStaffTaskRequest
    {
        [Required]
        public Guid Id { get; set; }

        // BASIC INFORMATION

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        // ASSIGNMENT

        public Guid? AssignedToId { get; set; }

        // TASK DETAILS

        [MaxLength(20)]
        public string Priority { get; set; } =
            StaffTaskPriority.Medium;

        [MaxLength(50)]
        public string Category { get; set; } =
            StaffTaskCategory.Others;

        [MaxLength(20)]
        public string Status { get; set; } =
            StaffTaskStatus.Todo;

        // SCHEDULE

        public DateTime? StartDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        public DateTime? ReminderAt { get; set; }

        // RECURRING

        public bool IsRecurring { get; set; } = false;

        [MaxLength(20)]
        public string? RecurringType { get; set; }

        // TIME

        [Range(0, 100000)]
        public decimal? EstimatedHours { get; set; }

        // CHECKLIST

        public List<UpdateStaffTaskChecklistItemRequest> Checklists { get; set; }
            = new();

        // OPTIONAL PROJECT

        public Guid? ProjectId { get; set; }
    }

    // =========================================================
    // UPDATE CHECKLIST ITEM REQUEST
    // =========================================================

    public class UpdateStaffTaskChecklistItemRequest
    {
        public Guid? Id { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        public int Sequence { get; set; }
    }

    // =========================================================
    // UPDATE CHECKLIST STATUS REQUEST
    // =========================================================

    public class UpdateStaffTaskChecklistRequest
    {
        [Required]
        public Guid Id { get; set; }

        public List<UpdateStaffTaskChecklistItemOnlyRequest> Checklists { get; set; }
            = new();
    }

    // =========================================================
    // UPDATE CHECKLIST STATUS ITEM
    // =========================================================

    public class UpdateStaffTaskChecklistItemOnlyRequest
    {
        [Required]
        public Guid Id { get; set; }

        public bool IsCompleted { get; set; }

        public int Sequence { get; set; }
    }

    // =========================================================
    // COMPLETE STAFF TASK REQUEST
    // =========================================================

    public class CompleteStaffTaskRequest
    {
        [Range(0, 100000)]
        public decimal? ActualHours { get; set; }
    }
}
