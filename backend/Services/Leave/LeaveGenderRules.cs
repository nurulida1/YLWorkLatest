using YLWorks.Model.Leave;

namespace YLWorks.Services.Leave
{
    public static class LeaveGenderRules
    {
        public static bool IsEligible(LeaveApplicableGender applicable, string? employeeGender)
        {
            if (applicable == LeaveApplicableGender.All)
                return true;

            if (string.IsNullOrWhiteSpace(employeeGender))
                return false;

            return applicable switch
            {
                LeaveApplicableGender.Male =>
                    employeeGender.Equals("Male", StringComparison.OrdinalIgnoreCase),
                LeaveApplicableGender.Female =>
                    employeeGender.Equals("Female", StringComparison.OrdinalIgnoreCase),
                _ => true
            };
        }

        public static string DescribeRequirement(LeaveApplicableGender applicable) =>
            applicable switch
            {
                LeaveApplicableGender.Male => "male employees",
                LeaveApplicableGender.Female => "female employees",
                _ => "all employees"
            };
    }
}
