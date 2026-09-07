namespace YLWorks.Model.Leave
{
    /// <summary>How a leave request's chargeable days are split across balance buckets.</summary>
    public class LeaveRequestBalanceAllocation
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public LeaveRequest Request { get; set; } = null!;
        public Guid LeaveTypeId { get; set; }
        public LeaveType LeaveType { get; set; } = null!;
        public double Days { get; set; }
        public int SortOrder { get; set; }
        public bool IsUnpaidBucket { get; set; }
    }
}
