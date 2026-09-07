using WebApplication1.Helpers;
namespace YLWorks.Model.Leave
{
    public class LeaveApproval : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public LeaveRequest Request { get; set; } = null!;
        public Guid ApproverId { get; set; }
        public User Approver { get; set; } = null!;
        public LeaveApprovalDecision Decision { get; set; }
        public string? RejectionReason { get; set; }
        public string ApproverRole { get; set; } = string.Empty;
        public DateTime DecidedAt { get; set; } = DateTimeHelper.Now();
    }
}
