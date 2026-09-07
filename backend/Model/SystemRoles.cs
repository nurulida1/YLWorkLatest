namespace YLWorks.Model
{
    /// <summary>Canonical system roles — keep in sync with role-permissions / user-management UI.</summary>
    public static class SystemRoles
    {
        public const string SuperAdmin = "SuperAdmin";
        public const string Management = "Management";
        public const string Hod = "HOD";
        public const string Hr = "HR";
        public const string Staff = "Staff";
        public const string Support = "Support";

        public static readonly string[] All =
            [SuperAdmin, Management, Hod, Hr, Staff, Support];

        /// <summary>Roles that can manage module settings (leave types, claim settings, etc.).</summary>
        public static readonly string[] SettingsAdmin =
            [SuperAdmin, Hr];

        /// <summary>Non-manager employees eligible for leave balances / sample requests.</summary>
        public static readonly string[] Employee =
            [Staff, Support];
    }
}
