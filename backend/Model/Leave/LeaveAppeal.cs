using WebApplication1.Helpers;
namespace YLWorks.Model.Leave
{
    public class LeaveAppeal : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public LeaveRequest Request { get; set; } = null!;
        public Guid RaisedBy { get; set; }
        public User RaisedByUser { get; set; } = null!;
        public Guid? ReviewedBy { get; set; }
        public User? ReviewedByUser { get; set; }
        public string AppealReason { get; set; } = string.Empty;
        public LeaveAppealOutcome? Outcome { get; set; }
        public DateTime RaisedAt { get; set; } = DateTimeHelper.Now();
        public DateTime? ResolvedAt { get; set; }
    }
}
