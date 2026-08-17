namespace YLWorks.Model
{
    public class StaffTask : BaseEntity
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public Guid? AssignedToId { get; set; }

        public User? AssignedTo { get; set; } = null!;

        public Guid AssignedById { get; set; }

        public User AssignedBy { get; set; } = null!;

        public string Priority { get; set; } = "Medium";

        // Admin, HR, Development, Documentation,
        // Maintenance, Meeting, Training, Others
        public string Category { get; set; } = "Others";

        // Todo, InProgress, Pending, Completed, Cancelled
        public string Status { get; set; } = "Todo";

        public DateTime? StartDate { get; set; }

        public DateTime DueDate { get; set; }

        public DateTime? ReminderAt { get; set; }

        public bool IsRecurring { get; set; }

        // Daily, Weekly, Monthly, Yearly
        public string? RecurringType { get; set; }

        public decimal? EstimatedHours { get; set; }

        public decimal? ActualHours { get; set; }

        public DateTime? CompletedAt { get; set; }

        public Guid? CompletedById { get; set; }

        public User? CompletedBy { get; set; }

        public ICollection<StaffTaskChecklist> Checklists { get; set; }
            = new List<StaffTaskChecklist>();
    }


    public class StaffTaskChecklist
    {
        public Guid Id { get; set; }

        public Guid StaffTaskId { get; set; }

        public StaffTask StaffTask { get; set; } = null!;

        public string Title { get; set; } = null!;

        public bool IsCompleted { get; set; }

        public DateTime? CompletedAt { get; set; }

        public int Sequence { get; set; }
    }

    public class CreateStaffTaskRequest
    {
        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public Guid? AssignedToId { get; set; }

        public string Priority { get; set; } = "Medium";

        public string Category { get; set; } = "Others";

        public DateTime? StartDate { get; set; }

        public DateTime DueDate { get; set; }

        public DateTime? ReminderAt { get; set; }

        public bool IsRecurring { get; set; }

        public string? RecurringType { get; set; }

        public decimal? EstimatedHours { get; set; }

        public List<CreateStaffTaskChecklistRequest> Checklists { get; set; }
            = new();
    }


    public class CreateStaffTaskChecklistRequest
    {
        public string Title { get; set; } = null!;

        public int Sequence { get; set; }
    }


    public class UpdateStaffTaskRequest
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public Guid? AssignedToId { get; set; }

        public string Priority { get; set; } = "Medium";

        public string Category { get; set; } = "Others";

        public string Status { get; set; } = "Todo";

        public DateTime? StartDate { get; set; }

        public DateTime DueDate { get; set; }

        public DateTime? ReminderAt { get; set; }

        public bool IsRecurring { get; set; }

        public string? RecurringType { get; set; }

        public decimal? EstimatedHours { get; set; }

        public List<UpdateStaffTaskChecklistItemRequest> Checklists { get; set; }
            = new();
    }


    // Used when creator updates the whole task
    public class UpdateStaffTaskChecklistItemRequest
    {
        public Guid? Id { get; set; }

        public string Title { get; set; } = null!;

        public bool IsCompleted { get; set; }

        public int Sequence { get; set; }
    }


    // Used ONLY by assigned staff when ticking checklist
    public class UpdateStaffTaskChecklistRequest
    {
        public Guid Id { get; set; }

        public List<UpdateStaffTaskChecklistItemOnlyRequest> Checklists { get; set; }
            = new();
    }


    public class UpdateStaffTaskChecklistItemOnlyRequest
    {
        public Guid Id { get; set; }

        public bool IsCompleted { get; set; }

        public int Sequence { get; set; }
    }


    public class CompleteStaffTaskRequest
    {
        public decimal? ActualHours { get; set; }
    }
}