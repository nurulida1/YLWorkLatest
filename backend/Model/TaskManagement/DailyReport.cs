using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model
{
    public class DailyReport : BaseEntity
    {
        public Guid Id { get; set; }

        [Required]
        public Guid EmployeeId { get; set; }

        [ForeignKey(nameof(EmployeeId))]
        public User? Employee { get; set; }

        // Optional project
        public Guid? ProjectId { get; set; }

        [ForeignKey(nameof(ProjectId))]
        public Project? Project { get; set; }

        [Required]
        public DateTime ReportDate { get; set; } = DateTime.Today;

        public string? CompletedWork { get; set; }

        public string? InProgressWork { get; set; }

        public string? Issues { get; set; }

        public string? NextDayPlan { get; set; }

        // Draft, Submitted, Reviewed
        [Required]
        public string Status { get; set; } = "Draft";

        public DateTime? SubmittedAt { get; set; }

        public Guid? ReviewedById { get; set; }

        [ForeignKey(nameof(ReviewedById))]
        public User? ReviewedBy { get; set; }

        public DateTime? ReviewedAt { get; set; }

        public string? ReviewRemarks { get; set; }

        public ICollection<DailyReportTask> DailyReportTasks { get; set; }
            = new List<DailyReportTask>();

        public ICollection<DailyReportAttachment> Attachments { get; set; }
            = new List<DailyReportAttachment>();
    }
}