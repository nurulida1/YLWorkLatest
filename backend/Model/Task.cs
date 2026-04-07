namespace YLWorks.Model
{
    public class ProjectTask: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid ProjectId { get; set; }
        public Project Project { get; set; }
        public string TaskNo { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public List<Guid> AssignedToIds { get; set; } = new();

        public ICollection<User> AssignedUsers { get; set; } = new List<User>();

        public string Priority { get; set; } = "Normal"; // Default to avoid null
        public string Status { get; set; } = "InProgress"; // InProgress, OnHold, Completed
        public double? EstimatedHours { get; set; }
        public double? ActualHours { get; set; }

        public string[]? Attachments { get; set; } = Array.Empty<string>();
    }

    public class CreateTaskRequest
    {
        public Guid ProjectId { get; set; }

        public string TaskNo { get; set; } = string.Empty;
        public string JobTitle { get; set; }
        public string Description { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }

        public string Priority { get; set; } = "Normal"; // Default value

        public List<Guid> AssignedToIds { get; set; } = new();

        public string[]? Attachments { get; set; } = Array.Empty<string>();
    }

    public class UpdateTaskRequest
    {
        public Guid Id { get; set; }

        public string? TaskNo { get; set; }
        public string JobTitle { get; set; }
        public string? Description { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }

        public List<Guid>? AssignedToIds { get; set; }
        public string? Priority { get; set; }

        public string[]? Attachments { get; set; } = Array.Empty<string>();
    }

    public class UpdateTaskStatusRequest
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        // InProgress, OnHold, Completed
    }

}
