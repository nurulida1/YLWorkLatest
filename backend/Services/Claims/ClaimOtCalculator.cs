using YLWorks.Model.Claim;

namespace YLWorks.Services.Claims
{
    public static class ClaimOtCalculator
    {
        public static (decimal OrdinaryRate, decimal HourlyRate) GetRates(
            decimal monthlySalary,
            ClaimSettings settings)
        {
            var days = settings.OrdinaryRateDivisorDays <= 0 ? 26 : settings.OrdinaryRateDivisorDays;
            var hours = settings.OrdinaryDayHours <= 0 ? 8 : settings.OrdinaryDayHours;
            var ordinary = Math.Round(monthlySalary / days, 4, MidpointRounding.AwayFromZero);
            var hourly = Math.Round(ordinary / hours, 4, MidpointRounding.AwayFromZero);
            return (ordinary, hourly);
        }

        public static decimal CalculateAmount(
            ClaimOtDayType dayType,
            decimal hours,
            decimal ordinaryRate,
            decimal hourlyRate,
            ClaimSettings settings)
        {
            if (hours <= 0)
                throw new ArgumentException("Overtime hours must be greater than zero.");

            return dayType switch
            {
                ClaimOtDayType.Normal =>
                    Math.Round(hours * settings.OtNormalMultiplier * hourlyRate, 2, MidpointRounding.AwayFromZero),

                ClaimOtDayType.RestDay => CalculateRestDay(hours, ordinaryRate, hourlyRate, settings),

                ClaimOtDayType.PublicHoliday => CalculatePublicHoliday(hours, ordinaryRate, hourlyRate, settings),

                _ => throw new ArgumentException("Invalid overtime day type.")
            };
        }

        private static decimal CalculateRestDay(
            decimal hours,
            decimal ordinaryRate,
            decimal hourlyRate,
            ClaimSettings settings)
        {
            // 0–4h: flat 0.5 × ordinary; >4 up to 8: flat 1 × ordinary; beyond 8: extra × 2 × hourly
            decimal amount;
            if (hours <= 4m)
                amount = settings.OtRestDayFirstBandMultiplier * ordinaryRate;
            else
                amount = settings.OtRestDaySecondBandMultiplier * ordinaryRate;

            if (hours > 8m)
                amount += (hours - 8m) * settings.OtRestDayAfter8HourlyMultiplier * hourlyRate;

            return Math.Round(amount, 2, MidpointRounding.AwayFromZero);
        }

        private static decimal CalculatePublicHoliday(
            decimal hours,
            decimal ordinaryRate,
            decimal hourlyRate,
            ClaimSettings settings)
        {
            // ≤8h: flat 2 × ordinary; beyond 8: extra × 3 × hourly
            var amount = settings.OtPublicHolidayUpTo8Multiplier * ordinaryRate;
            if (hours > 8m)
                amount += (hours - 8m) * settings.OtPublicHolidayAfter8HourlyMultiplier * hourlyRate;

            return Math.Round(amount, 2, MidpointRounding.AwayFromZero);
        }
    }
}
