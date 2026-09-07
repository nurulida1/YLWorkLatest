namespace YLWorks.Model.Leave
{
    public enum LeaveRequestStatus
    {
        Pending,
        Approved,
        Rejected,
        Cancelled,
        Escalated
    }

    public enum LeaveApprovalDecision
    {
        Approved,
        Rejected,
        Overridden
    }

    public enum LeaveCancelStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public enum LeaveBalanceAction
    {
        Adjusted,
        UnpaidApplied,
        Cancelled,
        CascadeApplied
    }

    public enum LeaveAppealOutcome
    {
        Upheld,
        Dismissed
    }

    /// <summary>How entitlement is calculated for a leave type.</summary>
    public enum LeavePolicyKind
    {
        Fixed = 0,
        AnnualTenure = 1,
        MedicalTenure = 2,
        Replacement = 3
    }

    /// <summary>Which employees may use this leave type.</summary>
    public enum LeaveApplicableGender
    {
        All = 0,
        Male = 1,
        Female = 2
    }

    /// <summary>Which leave-type kind a tenure band applies to.</summary>
    public enum LeaveTenureBandKind
    {
        Annual = 0,
        Medical = 1
    }

    /// <summary>Session portion of a leave day (full day or half day).</summary>
    public enum LeaveDaySession
    {
        Full = 0,
        AM = 1,
        PM = 2
    }

    public enum LeaveCalendarProvider
    {
        Google = 0,
        Outlook = 1
    }

    public static class LeaveRoles
    {
        public static readonly string[] Employee = SystemRoles.Employee;

        public static readonly string[] Manager =
            [SystemRoles.Hod, SystemRoles.Management];

        public static readonly string[] Hr = [SystemRoles.Hr];

        public static readonly string[] Admin = [SystemRoles.SuperAdmin];

        public static readonly string[] CanApply =
            Employee.Concat(Manager).Concat(Hr).Concat(Admin).ToArray();

        public static readonly string[] CanApprove =
            Manager.Concat(Hr).Concat(Admin).ToArray();
    }
}
