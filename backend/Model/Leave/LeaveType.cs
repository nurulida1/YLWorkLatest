namespace YLWorks.Model.Leave
{
    public class LeaveType : BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPaid { get; set; } = true;
        public bool IsEmergency { get; set; }
        public int DefaultDaysPerYear { get; set; }
        public bool RequiresDocument { get; set; }
        /// <summary>When true, staff may select AM/PM half-day sessions on apply.</summary>
        public bool AllowsHalfDay { get; set; }
        /// <summary>
        /// When true and paid balance is insufficient, remaining days cascade to Annual then Unpaid.
        /// </summary>
        public bool AllowsBalanceCascade { get; set; }
        public LeavePolicyKind PolicyKind { get; set; } = LeavePolicyKind.Fixed;
        /// <summary>All | Male | Female — who may apply this leave type.</summary>
        public LeaveApplicableGender ApplicableGender { get; set; } = LeaveApplicableGender.All;

        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
        public ICollection<LeaveBalance> LeaveBalances { get; set; } = new List<LeaveBalance>();
    }
}
