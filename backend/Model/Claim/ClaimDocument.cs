using WebApplication1.Helpers;

namespace YLWorks.Model.Claim
{
    public class ClaimDocument : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public ClaimRequest Request { get; set; } = null!;
        public ClaimDocumentKind DocumentKind { get; set; } = ClaimDocumentKind.Receipt;
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; } = DateTimeHelper.Now();
    }
}
