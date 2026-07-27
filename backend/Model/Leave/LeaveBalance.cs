namespace YLWorks.Model.Leave
{
    public class LeaveBalance : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public User Employee { get; set; } = null!;
        public Guid LeaveTypeId { get; set; }
        public LeaveType LeaveType { get; set; } = null!;
        public int Year { get; set; }
        /// <summary>Total usable pool for the year (tenure + carried + credited as applicable).</summary>
        public double EntitledDays { get; set; }
        /// <summary>Tenure-band days for Annual/MC (or fixed default for Fixed kinds).</summary>
        public double TenureEntitledDays { get; set; }
        /// <summary>Days carried from prior year (Annual only).</summary>
        public double CarriedForwardDays { get; set; }
        /// <summary>Manually credited days (Replacement Leave).</summary>
        public double CreditedDays { get; set; }
        public double UsedDays { get; set; }
        public double PendingDays { get; set; }
        public double RemainingDays { get; set; }
    }
}
