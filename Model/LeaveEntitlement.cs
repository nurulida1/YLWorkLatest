namespace YLWorks.Model
{
    public class LeaveEntitlement : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }

        public Guid LeaveTypeId { get; set; }

        public int Year { get; set; }
        public double TotalDays { get; set; }
        public double CarriedForwardDays { get; set; }
        public double UsedDays { get; set; }

        // Computed property
        public double RemainingDays => TotalDays + CarriedForwardDays - UsedDays;
    }

    public class CreateLeaveEntitlementRequest
    {
        public Guid UserId { get; set; }
        public Guid LeaveTypeId { get; set; }
        public int Year { get; set; }
        public double TotalDays { get; set; }
        public double CarriedForwardDays { get; set; }
        public double UsedDays { get; set; }
    }


    public class UpdateLeaveEntitlementRequest
    {
        public Guid Id { get; set; } // needed for update
        public Guid UserId { get; set; }
        public Guid LeaveTypeId { get; set; }
        public int Year { get; set; }
        public double TotalDays { get; set; }
        public double CarriedForwardDays { get; set; }
        public double UsedDays { get; set; }
    }
}
