namespace YLWorks.Model.Claim
{
    public class ClaimLineItem : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public ClaimRequest Request { get; set; } = null!;

        public ClaimLineKind LineKind { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }

        // Monthly reimbursement
        public ClaimReimbursementCategory? Category { get; set; }
        public DateTime? PurchaseDate { get; set; }

        // Overtime
        public DateTime? WorkDate { get; set; }
        public ClaimOtDayType? DayType { get; set; }
        public decimal? Hours { get; set; }
        public decimal? OrdinaryRate { get; set; }
        public decimal? HourlyRate { get; set; }

        // Mileage
        public ClaimVehicleType? VehicleType { get; set; }
        public decimal? Kilometers { get; set; }

        // Meal allowance
        public int? MealDays { get; set; }
    }
}
