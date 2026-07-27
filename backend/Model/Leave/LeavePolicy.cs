namespace YLWorks.Model.Leave
{
    public class LeavePolicy : BaseEntity
    {
        public Guid Id { get; set; }
        /// <summary>Calendar year from which this policy applies for new balances / rollover.</summary>
        public int EffectiveFromYear { get; set; }
        /// <summary>
        /// Percent of this year's tenure entitlement that is use-it-or-lose-it at year-end (e.g. 50).
        /// Unused portion of that amount is forfeited; the rest of remaining Annual balance carries forward.
        /// </summary>
        public double AnnualCarryForwardPercent { get; set; } = 50;
        public bool IsActive { get; set; } = true;

        public ICollection<LeaveTenureBand> TenureBands { get; set; } = new List<LeaveTenureBand>();
    }

    public class LeaveTenureBand : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid LeavePolicyId { get; set; }
        public LeavePolicy LeavePolicy { get; set; } = null!;
        public LeaveTenureBandKind BandKind { get; set; }
        /// <summary>Inclusive lower bound of tenure years.</summary>
        public int MinYearsInclusive { get; set; }
        /// <summary>Exclusive upper bound; null means open-ended.</summary>
        public int? MaxYearsExclusive { get; set; }
        public double DaysPerYear { get; set; }
    }

    /// <summary>Idempotent log that year-end rollover was completed for a calendar year.</summary>
    public class LeaveYearClose : BaseEntity
    {
        public Guid Id { get; set; }
        /// <summary>The year that was closed (e.g. 2026 closed → creates 2027 balances).</summary>
        public int ClosedYear { get; set; }
        public DateTime ClosedAt { get; set; }
        public Guid? ClosedByUserId { get; set; }
        public string? Notes { get; set; }
    }
}
