namespace YLWorks.Services.Leave
{
    public class GoogleCalendarOptions
    {
        public const string SectionName = "GoogleCalendar";

        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string RedirectUri { get; set; } = string.Empty;
        public string FrontendBaseUrl { get; set; } = "http://localhost:4200";
        public string FrontendSuccessPath { get; set; } = "/settings/leave-calendar-sync";
        public string CalendarName { get; set; } = "YLWork Company Leave";
    }
}
