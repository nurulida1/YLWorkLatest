namespace YLWorks.Model { 

    public class StaffTask : BaseEntity
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;
        public string? Description { get; set; }

        public Guid AssignedToId { get; set; }
        public User AssignedTo { get; set; } = null!;

        public Guid AssignedById { get; set; }
        public User AssignedBy { get; set; } = null!;

        public string Priority { get; set; }

        public string Category { get; set; } //Admin, HR, Development, Documentation, Maintainence, Meeting, Training, Others

        public string Status { get; set; } //Todo, InProgress, Pending, Completed, Cancelled

        public DateTime? StartDate { get; set; }

        public DateTime DueDate { get; set; }

        public DateTime? ReminderAt { get; set; }

        public bool IsRecurring { get; set; }

        public string? RecurringType { get; set; } //Daily, Weekly, Monthly, Yearly 

        public decimal? EstimatedHours { get; set; }

        public decimal? ActualHours { get; set; }

        public DateTime? CompletedAt { get; set; }

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
}