using YLWorks.Model;
using YLWorks.Model.Claim;

namespace YLWorks.Services.Claims
{
    public static class ClaimMedicalCalculator
    {
        /// <summary>
        /// Pro-rated annual medical limit for a calendar year.
        /// Join month counts toward months remaining (e.g. Aug join → 5/12 of annual limit).
        /// </summary>
        public static decimal ResolveAnnualLimit(User employee, int year, decimal configuredAnnualLimit)
        {
            if (configuredAnnualLimit <= 0)
                return 0m;

            if (!employee.JoinedDate.HasValue)
                return Math.Round(configuredAnnualLimit, 2, MidpointRounding.AwayFromZero);

            var joined = employee.JoinedDate.Value.Date;
            if (joined.Year < year)
                return Math.Round(configuredAnnualLimit, 2, MidpointRounding.AwayFromZero);

            if (joined.Year > year)
                return 0m;

            var monthsRemaining = 12 - joined.Month + 1;
            var prorated = configuredAnnualLimit / 12m * monthsRemaining;
            return Math.Round(prorated, 2, MidpointRounding.AwayFromZero);
        }

        public static decimal SumMedicalLines(IEnumerable<ClaimLineItem> lines) =>
            lines
                .Where(l => l.Category == ClaimReimbursementCategory.Medical)
                .Sum(l => l.Amount);
    }
}
