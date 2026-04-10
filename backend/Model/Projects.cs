namespace YLWorks.Model
{
    public class Project: BaseEntity
    {
        public Guid Id { get; set; }
        public string ProjectTitle { get; set; } = string.Empty;
        public Guid ClientId { get; set; }
        public Client Client { get; set; } = null!;
        public string Status { get; set; } = string.Empty; // Planning, InProgress, OnHold, Completed
        public DateTime? DueDate { get; set; }
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; }
        public string? Description { get; set; } = string.Empty;
        public string? Priority { get; set; } = string.Empty; // High, Medium, Low
        public ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
        public ICollection<ProjectTask>? Tasks { get; set; }
        public ICollection<Quotation> Quotations { get; set; }
        public ICollection<PurchaseOrder> PurchaseOrders { get; set; }

        public double Progress
        {
            get
            {
                if (Tasks == null || Tasks.Count == 0) return 0;

                var total = Tasks.Count;
                var completed = Tasks.Count(t => t.Status == "Completed");
                return Math.Round((double)completed / total * 100, 2);
            }
        }

    }

    public class ProjectMember: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid ProjectId { get; set; }
        public Project Project { get; set; } = null!;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime AssignedAt { get; set; }
    }

    public class CreateProjectRequest
    {
        public string ProjectTitle { get; set; } = string.Empty;

        public Guid ClientId { get; set; }

        public DateTime? DueDate { get; set; }

        public string? Description { get; set; } = string.Empty;
        public string? Priority { get; set; }
        public List<string>? ProjectMembers { get; set; }
    }

    public class UpdateProjectRequest
    {
        public Guid Id { get; set; } // required to identify project
        public string ProjectTitle { get; set; } = string.Empty;

        public Guid? ClientId { get; set; }

        public DateTime? DueDate { get; set; }

        public string? Description { get; set; } = string.Empty;
        public string? Priority { get; set; }
        public List<Guid>? ProjectMembers { get; set; }
    }
    public class ProjectMemberRequest
    {
        public Guid UserId { get; set; }
    }

    public class UpdateProjectStatusRequest
    {
        public Guid ProjectId { get; set; }
        public string Status { get; set; } = string.Empty;
        // Example: Planned, InProgress, OnHold, Completed, Cancelled
    }

    public class ProjectDto
    {
        public Guid Id { get; set; }
        public string ProjectTitle { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Priority { get; set; }
        public Guid? ClientId { get; set; }
        public Client? Client { get; set; }
        public string Status { get; set;} = string.Empty;
        public List<ProjectMemberDto> ProjectMembers { get; set; } = new();
    }

    public class ProjectMemberDto
    {
        public Guid UserId { get; set; }
        public UserDto User { get; set; }
    }

}
