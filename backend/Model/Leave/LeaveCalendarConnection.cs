namespace YLWorks.Model.Leave
{
    public class LeaveCalendarConnection : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public LeaveCalendarProvider Provider { get; set; }
        public string AccessTokenProtected { get; set; } = string.Empty;
        public string RefreshTokenProtected { get; set; } = string.Empty;
        public DateTime TokenExpiresAtUtc { get; set; }
        public string ExternalCalendarId { get; set; } = string.Empty;
        public string ExternalAccountEmail { get; set; } = string.Empty;
        public DateTime ConnectedAtUtc { get; set; }
        public DateTime? LastSyncAtUtc { get; set; }
        public string? LastError { get; set; }

        public ICollection<LeaveCalendarEventMap> EventMaps { get; set; } = new List<LeaveCalendarEventMap>();
    }

    public class LeaveCalendarEventMap : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid ConnectionId { get; set; }
        public LeaveCalendarConnection Connection { get; set; } = null!;
        public Guid LeaveRequestId { get; set; }
        public LeaveRequest LeaveRequest { get; set; } = null!;
        public string ExternalEventId { get; set; } = string.Empty;
    }
}
