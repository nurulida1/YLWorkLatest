namespace YLWorks.Model
{
    public class JobSheet: BaseEntity
    {
        public Guid Id { get; set; }

        public string JobSheetNo { get; set; }

        public Guid ProjectId { get; set; }
        public Project Project { get; set; }

        public Guid? ProjectTaskId { get; set; }
        public ProjectTask? ProjectTask { get; set; }

        public DateTime? WorkDate { get; set; }

        public DateTime? StartTime { get; set; }
       
        public DateTime? EndTime { get; set; }

        public string? WorkDescription { get; set; }

        public string Status { get; set; }

        public ICollection<JobSheetMember> Members { get; set; }
            = new List<JobSheetMember>();
        public ICollection<AttachmentDto> Attachments { get; set; }
    = new List<AttachmentDto>();
    }

    public class JobSheetMember
    {
        public Guid Id { get; set; }

        public Guid JobSheetId { get; set; }
        public JobSheet JobSheet { get; set; }

        public Guid UserId { get; set; }
        public UserDto User { get; set; }
    }

    public class CreateJobSheetRequest
    {
        public string JobSheetNo { get; set; }

        public Guid ProjectId { get; set; }

        public Guid? ProjectTaskId { get; set; }

        public DateTime? WorkDate { get; set; }

        public DateTime? StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public string? WorkDescription { get; set; } = string.Empty;

        public string Status { get; set; } = "Draft";

        public List<string>? Members { get; set; }
        public List<IFormFile>? Files { get; set; }

    }

    public class CreateJobSheetMemberRequest
    {
        public Guid UserId { get; set; }

    }

    public class UpdateJobSheetRequest
    {
        public Guid Id { get; set; }

        public string JobSheetNo { get; set; }

        public Guid ProjectId { get; set; }

        public Guid? ProjectTaskId { get; set; }

        public DateTime? WorkDate { get; set; }

        public DateTime? StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public string? WorkDescription { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public List<string>? Members { get; set; }
        public List<IFormFile>? Files { get; set; }
    }

    public class UpdateJobSheetMemberRequest
    {
        public Guid? Id { get; set; }     

        public Guid UserId { get; set; }
    }

    public class UpdateJobSheetStatusRequest
    {
        public Guid JobSheetId { get; set; }

        public string Status { get; set; } = string.Empty;
    }
}