using WebApplication1.Helpers;
namespace YLWorks.Model.Leave
{
    public class LeaveCancellation : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public LeaveRequest Request { get; set; } = null!;
        public Guid RequestedBy { get; set; }
        public bool LeaveStarted { get; set; }
        public bool RequiresApproval { get; set; }
        public LeaveCancelStatus Status { get; set; } = LeaveCancelStatus.Pending;
        public DateTime RequestedAt { get; set; } = DateTimeHelper.Now();
        public DateTime? ResolvedAt { get; set; }
    }
}
