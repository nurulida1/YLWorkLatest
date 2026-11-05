using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model
{
	public class DailyReportAttachment : BaseEntity
	{
		public Guid Id { get; set; }

		[Required]
		public Guid DailyReportId { get; set; }

		[ForeignKey(nameof(DailyReportId))]
		public DailyReport? DailyReport { get; set; }

		[Required]
		public string FileName { get; set; } = string.Empty;

		[Required]
		public string FileUrl { get; set; } = string.Empty;

		public string? ContentType { get; set; }

		public long? FileSize { get; set; }
	}
}