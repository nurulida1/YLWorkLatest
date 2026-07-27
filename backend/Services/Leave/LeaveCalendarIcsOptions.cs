namespace YLWorks.Services.Leave
{
    public class LeaveCalendarIcsOptions
    {
        public const string SectionName = "LeaveCalendar";

        /// <summary>Public API base used in subscribe URLs, e.g. https://localhost:5000</summary>
        public string IcsBaseUrl { get; set; } = "https://localhost:5000";

        public string CalendarName { get; set; } = "YLWork Company Leave";

        /// <summary>Include approved leave that ended within this many days.</summary>
        public int IncludePastDays { get; set; } = 30;
    }
}
