namespace YLWorks.Model
{
    public class Project: BaseEntity
    {
        public Guid Id { get; set; }
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectTitle { get; set; } = string.Empty;
        public Guid ClientId { get; set; }
        public Company Client { get; set; } = null!;
        public string Status { get; set; } = string.Empty; // Planning, InProgress, OnHold, Completed
        public DateTime? DueDate { get; set; }
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; }
        public string? Description { get; set; } = string.Empty;
        public string? Priority { get; set; } = string.Empty; // High, Medium, Low
        public ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
        public ICollection<WorkOrder>? WorkOrders { get; set; }
        public ICollection<Quotation> Quotations { get; set; }
        public ICollection<PurchaseOrder> PurchaseOrders { get; set; }
    }

    public class ProjectMember: BaseEntity
    {
        public Guid Id { get; set; }
        public string ProjectCode { get; set; }
        public Project Project { get; set; } = null!;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime AssignedAt { get; set; }
        public Guid AssignedById { get; set; }
        public User AssignedBy { get; set; } = null!;
    }

    public class CreateProjectRequest
    {
        public string? ProjectCode { get; set; } = string.Empty;
        public string ProjectTitle { get; set; } = string.Empty;
        public Guid ClientId { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Description { get; set; } = string.Empty;
        public string? Priority { get; set; }
        public List<string>? ProjectMembers { get; set; }
    }

    public class UpdateProjectRequest : CreateProjectRequest
    {
        public Guid Id { get; set; }
    }
    public class ProjectMemberRequest
    {
        public Guid UserId { get; set; }
    }

    public class UpdateProjectStatusRequest
    {
        public Guid ProjectId { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class ProjectDto
    {
        public Guid Id { get; set; }
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectTitle { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Priority { get; set; }
        public Guid? ClientId { get; set; }
        public Company? Client { get; set; }
        public string Status { get; set;} = string.Empty;
        public List<ProjectMemberDto> ProjectMembers { get; set; } = new();
    }

    public class ProjectMemberDto
    {
        public Guid UserId { get; set; }
        public UserDto User { get; set; }
    }

}
