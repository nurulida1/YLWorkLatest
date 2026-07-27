namespace YLWorks.Model.Leave
{
    public class LeaveRequest : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public User Employee { get; set; } = null!;
        public Guid LeaveTypeId { get; set; }
        public LeaveType LeaveType { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalDays { get; set; }
        public string Reason { get; set; } = string.Empty;
        public LeaveRequestStatus Status { get; set; } = LeaveRequestStatus.Pending;
        public bool IsEmergency { get; set; }
        public bool IsUnpaid { get; set; }
        public bool ConflictOverride { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public ICollection<LeaveApproval> Approvals { get; set; } = new List<LeaveApproval>();
        public LeaveCancellation? Cancellation { get; set; }
        public LeaveConflictCheck? ConflictCheck { get; set; }
        public LeaveBalanceCheckRecord? BalanceCheck { get; set; }
        public ICollection<LeaveSupportingDocument> Documents { get; set; } = new List<LeaveSupportingDocument>();
        public LeaveAppeal? Appeal { get; set; }
    }
}
