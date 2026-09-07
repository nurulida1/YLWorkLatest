using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model.Claim
{
    /// <summary>Singleton company claim policy (rates, caps, default hours).</summary>
    public class ClaimSettings : BaseEntity
    {
        public Guid Id { get; set; }
        public bool IsActive { get; set; } = true;

        public decimal MedicalPerReceiptLimit { get; set; } = 100m;

        [Column("MedicalMonthlyTotalLimit")]
        public decimal MedicalAnnualLimit { get; set; } = 400m;
        public decimal SafetyShoesLimit { get; set; } = 100m;

        public decimal MileageCarRatePerKm { get; set; } = 0.50m;
        public decimal MileageMotorcycleRatePerKm { get; set; } = 0.30m;
        public decimal MealAllowancePerDay { get; set; } = 50m;

        /// <summary>Days in month divisor for ordinary rate (default 26).</summary>
        public int OrdinaryRateDivisorDays { get; set; } = 26;
        /// <summary>Hours per ordinary day (default 8).</summary>
        public int OrdinaryDayHours { get; set; } = 8;

        public decimal OtNormalMultiplier { get; set; } = 1.5m;
        public decimal OtRestDayFirstBandMultiplier { get; set; } = 0.5m;
        public decimal OtRestDaySecondBandMultiplier { get; set; } = 1.0m;
        public decimal OtRestDayAfter8HourlyMultiplier { get; set; } = 2.0m;
        public decimal OtPublicHolidayUpTo8Multiplier { get; set; } = 2.0m;
        public decimal OtPublicHolidayAfter8HourlyMultiplier { get; set; } = 3.0m;

        // Company fallback working hours (HH:mm stored as TimeSpan)
        public TimeSpan DefaultWorkStartTime { get; set; } = new TimeSpan(9, 0, 0);
        public TimeSpan DefaultWorkEndTime { get; set; } = new TimeSpan(18, 0, 0);
        public bool DefaultUsesRestDayHalfDay { get; set; } = true;
        public TimeSpan DefaultRestDayHalfDayStart { get; set; } = new TimeSpan(8, 0, 0);
        public TimeSpan DefaultRestDayHalfDayEnd { get; set; } = new TimeSpan(12, 0, 0);
    }
}
