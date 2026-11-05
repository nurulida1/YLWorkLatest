using System.ComponentModel.DataAnnotations;

namespace YLWorks.DTO
{
    public class CreateDailyReportRequest
    {
        public Guid? ProjectId { get; set; }

        [Required]
        public DateTime ReportDate { get; set; }

        public string? CompletedWork { get; set; }

        public string? InProgressWork { get; set; }

        public string? Issues { get; set; }

        public string? NextDayPlan { get; set; }

        public List<DailyReportTaskRequest> Tasks { get; set; }
            = new();
    }

    public class UpdateDailyReportRequest : CreateDailyReportRequest
    {
        [Required]
        public Guid Id { get; set; }
    }

    public class DailyReportTaskRequest
    {
        [Required]
        public Guid StaffTaskId { get; set; }

        public string? WorkDescription { get; set; }

        public decimal? HoursSpent { get; set; }
    }
}