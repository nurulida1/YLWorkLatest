
using Microsoft.AspNetCore.Http;

namespace YLWorks.Model
{
    public class Project : BaseEntity
    {
        public Guid Id { get; set; }

        // ==========================================
        // PROJECT INFORMATION
        // ==========================================

        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectTitle { get; set; } = string.Empty;

        // ==========================================
        // CLIENT
        // ==========================================

        public Guid ClientId { get; set; }
        public Company Client { get; set; } = null!;

        // ==========================================
        // PROJECT STATUS
        // ==========================================

        public string Status { get; set; } = string.Empty;

        // ==========================================
        // PROJECT DATES
        // ==========================================

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? EstimatedCompletedDate { get; set; }
        public DateTime? DueDate { get; set; }

        // ==========================================
        // PROJECT DETAILS
        // ==========================================

        public string? Location { get; set; }
        public double? EstimatedBudget { get; set; }
        public string? Description { get; set; }
        public string? Priority { get; set; }

        // ==========================================
        // PROJECT CREATOR
        // ==========================================

        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;

        // ==========================================
        // PROJECT LEADER
        // ==========================================

        public Guid? ProjectLeaderId { get; set; }
        public User? ProjectLeader { get; set; }

        // ==========================================
        // PROJECT RELATIONSHIPS
        // ==========================================

        public ICollection<AttachmentDto> Attachments { get; set; }
            = new List<AttachmentDto>();

        public ICollection<JobSheet> JobSheets { get; set; }
            = new List<JobSheet>();

        public ICollection<ProjectMember> ProjectMembers { get; set; }
            = new List<ProjectMember>();

        public ICollection<WorkOrder> WorkOrders { get; set; }
            = new List<WorkOrder>();

        public ICollection<Quotation> Quotations { get; set; }
            = new List<Quotation>();

        public ICollection<PurchaseOrder> PurchaseOrders { get; set; }
            = new List<PurchaseOrder>();

        // Hardware, Site Material, IT Support and Bug Reports
        public ICollection<HardwareRequest> HardwareRequests { get; set; }
            = new List<HardwareRequest>();
    }

    // ==========================================
    // PROJECT MEMBER
    // ==========================================

    public class ProjectMember : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid ProjectId { get; set; }
        public string ProjectCode { get; set; } = string.Empty;

        public Project Project { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime AssignedAt { get; set; }

        public Guid AssignedById { get; set; }
        public User AssignedBy { get; set; } = null!;
    }

    // ==========================================
    // CREATE PROJECT REQUEST
    // ==========================================

    public class CreateProjectRequest
    {
        public string? ProjectCode { get; set; } = string.Empty;

        public string ProjectTitle { get; set; } = string.Empty;

        public Guid ClientId { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? EstimatedCompletedDate { get; set; }

        public string? Description { get; set; }
        public string? Priority { get; set; }
        public string? Location { get; set; }

        public Guid? ProjectLeaderId { get; set; }

        public double? EstimatedBudget { get; set; }

        public string? Status { get; set; }

        public List<string>? ProjectMembers { get; set; }

        public List<IFormFile>? Files { get; set; }
    }

    // ==========================================
    // UPDATE PROJECT REQUEST
    // ==========================================

    public class UpdateProjectRequest : CreateProjectRequest
    {
        public Guid Id { get; set; }
    }

    // ==========================================
    // PROJECT MEMBER REQUEST
    // ==========================================

    public class ProjectMemberRequest
    {
        public Guid UserId { get; set; }
    }

    // ==========================================
    // UPDATE PROJECT STATUS REQUEST
    // ==========================================

    public class UpdateProjectStatusRequest
    {
        public Guid ProjectId { get; set; }

        public string Status { get; set; } = string.Empty;
    }

    // ==========================================
    // PROJECT DTO
    // ==========================================

    public class ProjectDto
    {
        public Guid Id { get; set; }

        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectTitle { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? EstimatedCompletedDate { get; set; }

        public double? EstimatedBudget { get; set; }

        public string? Location { get; set; }
        public string? Priority { get; set; }

        public Guid? ClientId { get; set; }
        public Company? Client { get; set; }

        public Guid? ProjectLeaderId { get; set; }
        public User? ProjectLeader { get; set; }

        public string Status { get; set; } = string.Empty;

        public ICollection<AttachmentDto> Attachments { get; set; }
            = new List<AttachmentDto>();

        public List<ProjectMemberDto> ProjectMembers { get; set; }
            = new();
    }

    // ==========================================
    // PROJECT MEMBER DTO
    // ==========================================

    public class ProjectMemberDto
    {
        public Guid ProjectId { get; set; }

        public Guid UserId { get; set; }

        public UserDto? User { get; set; }
    }

    // ==========================================
    // PROJECT DROPDOWN DTO
    // ==========================================

    public class ProjectDropdownDto
    {
        public Guid Id { get; set; }

        public string ProjectCode { get; set; } = string.Empty;

        public string ProjectTitle { get; set; } = string.Empty;
    }
}
