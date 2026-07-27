namespace YLWorks.Model.Leave
{
    public class LeaveBalanceCheckRecord : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public LeaveRequest Request { get; set; } = null!;
        public double RequestedDays { get; set; }
        public double AvailableDays { get; set; }
        public bool IsSufficient { get; set; }
        public LeaveBalanceAction? ActionTaken { get; set; }
        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
    }
}
