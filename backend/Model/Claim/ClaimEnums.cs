namespace YLWorks.Model.Claim
{
    public enum ClaimType
    {
        MonthlyReimbursement = 0,
        Overtime = 1,
        OutstationTravel = 2
    }

    public enum ClaimRequestStatus
    {
        Pending,
        Approved,
        Rejected,
        Cancelled
    }

    public enum ClaimApprovalDecision
    {
        Approved,
        Rejected,
        Overridden
    }

    public enum ClaimReimbursementCategory
    {
        Medical = 0,
        SafetyShoes = 1,
        GeneralPurchase = 2
    }

    public enum ClaimOtDayType
    {
        Normal = 0,
        RestDay = 1,
        PublicHoliday = 2
    }

    public enum ClaimLineKind
    {
        MonthlyItem = 0,
        OvertimeItem = 1,
        Mileage = 2,
        Expense = 3,
        MealAllowance = 4
    }

    public enum ClaimVehicleType
    {
        Car = 0,
        Motorcycle = 1
    }

    public enum ClaimDocumentKind
    {
        Receipt = 0,
        EInvoice = 1
    }

    public static class ClaimRoles
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
