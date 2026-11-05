using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model
{
    public class DailyReportTask : BaseEntity
    {
        public Guid Id { get; set; }

        [Required]
        public Guid DailyReportId { get; set; }

        [ForeignKey(nameof(DailyReportId))]
        public DailyReport? DailyReport { get; set; }

        [Required]
        public Guid StaffTaskId { get; set; }

        [ForeignKey(nameof(StaffTaskId))]
        public StaffTask? StaffTask { get; set; }

        public string? WorkDescription { get; set; }

        // Optional hours spent on this task
        [Column(TypeName = "decimal(5,2)")]
        public decimal? HoursSpent { get; set; }
    }
}