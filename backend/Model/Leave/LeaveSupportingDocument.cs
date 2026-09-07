using WebApplication1.Helpers;
namespace YLWorks.Model.Leave
{
    public class LeaveSupportingDocument : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public LeaveRequest Request { get; set; } = null!;
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; } = DateTimeHelper.Now();
        public bool Verified { get; set; }
    }
}
