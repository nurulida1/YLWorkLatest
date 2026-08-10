namespace YLWorks.Model
{
    public class ProjectTask : BaseEntity
    {
        public Guid Id { get; set; }
        public string TaskCode { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? Priority { get; set; }
        public DateTime? EstimatedStartDate { get; set; }
        public DateTime? EstimatedEndDate { get; set; }
        public Guid? ProjectId { get; set; }
        public Project? Project { get; set; }
        public string? Category { get; set; } //Installation, Configuration, Testing, Documentation, Maintenance
        public string? Status { get; set; }
        //NotStarted, InProgress, OnHold, Completed, Cancelled
        public DateTime? ActualStartDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Progress { get; set; }
        public string? Remarks { get; set; }
        public ICollection<JobSheet> JobSheets { get; set; } = new List<JobSheet>();
        public ICollection<ProjectTaskAssignment> AssignedTaskMembers { get; set; } = new List<ProjectTaskAssignment>();
        public ICollection<ProjectTaskAttachment> TaskAttachments { get; set; } = new List<ProjectTaskAttachment>();
        public List<ProjectTaskChecklist> Checklists { get; set; } = new();

    }

    public class ProjectTaskAssignment : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid ProjectTaskId { get; set; }
        public ProjectTask ProjectTask { get; set; }
        public Guid? UserId { get; set; }
        public User? User { get; set; }
        public DateTime? AssignedDate { get; set; }
    }

    public class ProjectTaskAttachment : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid ProjectTaskId { get; set; }
        public ProjectTask ProjectTask { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public string? FileType { get; set; }
        public Guid? UploadedById { get; set; }
        public User? UploadedBy { get; set; }
        public DateTime UploadedDate { get; set; }
    }

    public class ProjectTaskChecklist: BaseEntity
    {
        public Guid Id { get; set; }
        public Guid ProjectTaskId { get; set; }
        public ProjectTask ProjectTask { get; set; }
        public string Title { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedDate { get; set; }
    }

    public class CreateProjectTaskRequest
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? Priority { get; set; }
        public DateTime? EstimatedStartDate { get; set; }
        public DateTime? EstimatedEndDate { get; set; }
        public Guid? ProjectId { get; set; }
        public string? Category { get; set; }
        public string? Status { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Progress { get; set; }
        public string? Remarks { get; set; }
        public List<Guid> AssignedUserIds { get; set; }
        public List<CreateProjectTaskChecklistRequest> Checklists { get; set; } = new();
    }

    public class CreateProjectTaskChecklistRequest
    {
        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
    }

    public class UpdateProjectTaskRequest
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? Priority { get; set; }
        public DateTime? EstimatedStartDate { get; set; }
        public DateTime? EstimatedEndDate { get; set; }
        public Guid? ProjectId { get; set; }
        public string? Category { get; set; }
        public string? Status { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Progress { get; set; }
        public string? Remarks { get; set; }
        public List<Guid> AssignedUserIds { get; set; }
        public List<UpdateProjectTaskChecklistRequest> Checklists { get; set; } = new();
    }

    public class UpdateProjectTaskChecklistRequest
    {
        public Guid? Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }
    }

    public class UploadProjectTaskAttachmentRequest
    {
        public Guid ProjectTaskId { get; set; }

        public IFormFile File { get; set; } = null!;
    }

    public class UpdateProjectTaskStatusRequest
    {
        public Guid ProjectTaskId { get; set; }
        public string Status { get; set; } = string.Empty;
    }

}