using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using YLWorks.Data;
using YLWorks.Model.Leave;

namespace YLWorks.Services.Leave
{
    public class OutlookLeaveIcsFeedService
    {
        private readonly AppDbContext _context;
        private readonly LeaveCalendarTokenProtector _tokenProtector;
        private readonly LeaveCalendarIcsOptions _options;
        private readonly ILogger<OutlookLeaveIcsFeedService> _logger;

        public OutlookLeaveIcsFeedService(
            AppDbContext context,
            LeaveCalendarTokenProtector tokenProtector,
            IOptions<LeaveCalendarIcsOptions> options,
            ILogger<OutlookLeaveIcsFeedService> logger)
        {
            _context = context;
            _tokenProtector = tokenProtector;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<(LeaveCalendarConnection Connection, string FeedUrl, string RawToken)> EnableOrCreateAsync(
            Guid userId,
            string? accountEmail,
            CancellationToken ct = default)
        {
            var existing = await _context.LeaveCalendarConnections
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == LeaveCalendarProvider.Outlook, ct);

            var rawToken = GenerateToken();
            var hash = HashToken(rawToken);

            if (existing == null)
            {
                existing = new LeaveCalendarConnection
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Provider = LeaveCalendarProvider.Outlook,
                    ConnectedAtUtc = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    TokenExpiresAtUtc = DateTime.UtcNow.AddYears(100),
                    ExternalCalendarId = "ics"
                };
                _context.LeaveCalendarConnections.Add(existing);
            }

            existing.AccessTokenProtected = _tokenProtector.Protect(rawToken);
            existing.RefreshTokenProtected = hash;
            existing.ExternalCalendarId = "ics";
            existing.ExternalAccountEmail = accountEmail ?? string.Empty;
            existing.LastError = null;
            existing.UpdatedAt = DateTime.UtcNow;
            if (existing.ConnectedAtUtc == default)
                existing.ConnectedAtUtc = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
            return (existing, BuildFeedUrl(rawToken), rawToken);
        }

        public async Task<(LeaveCalendarConnection Connection, string FeedUrl)?> RotateAsync(
            Guid userId,
            CancellationToken ct = default)
        {
            var existing = await _context.LeaveCalendarConnections
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == LeaveCalendarProvider.Outlook, ct);
            if (existing == null) return null;

            var rawToken = GenerateToken();
            existing.AccessTokenProtected = _tokenProtector.Protect(rawToken);
            existing.RefreshTokenProtected = HashToken(rawToken);
            existing.UpdatedAt = DateTime.UtcNow;
            existing.LastError = null;
            await _context.SaveChangesAsync(ct);
            return (existing, BuildFeedUrl(rawToken));
        }

        public async Task DisableAsync(Guid userId, CancellationToken ct = default)
        {
            var existing = await _context.LeaveCalendarConnections
                .Include(c => c.EventMaps)
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == LeaveCalendarProvider.Outlook, ct);
            if (existing == null) return;

            if (existing.EventMaps.Count > 0)
                _context.LeaveCalendarEventMaps.RemoveRange(existing.EventMaps);
            _context.LeaveCalendarConnections.Remove(existing);
            await _context.SaveChangesAsync(ct);
        }

        public string? TryGetFeedUrl(LeaveCalendarConnection connection)
        {
            if (connection.Provider != LeaveCalendarProvider.Outlook)
                return null;
            if (string.IsNullOrWhiteSpace(connection.AccessTokenProtected))
                return null;
            try
            {
                var raw = _tokenProtector.Unprotect(connection.AccessTokenProtected);
                return BuildFeedUrl(raw);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to unprotect Outlook ICS token for connection {Id}", connection.Id);
                return null;
            }
        }

        public async Task<string?> BuildCalendarIcsAsync(string rawToken, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(rawToken))
                return null;

            var hash = HashToken(rawToken);
            var connection = await _context.LeaveCalendarConnections
                .FirstOrDefaultAsync(
                    c => c.Provider == LeaveCalendarProvider.Outlook && c.RefreshTokenProtected == hash,
                    ct);

            if (connection == null)
                return null;

            connection.LastSyncAtUtc = DateTime.UtcNow;
            connection.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            var from = DateTime.UtcNow.Date.AddDays(-Math.Max(0, _options.IncludePastDays));
            var leaves = await _context.LeaveRequests
                .AsNoTracking()
                .Include(r => r.Employee)
                .Include(r => r.LeaveType)
                .Where(r => r.Status == LeaveRequestStatus.Approved && r.EndDate.Date >= from)
                .OrderBy(r => r.StartDate)
                .ToListAsync(ct);

            return BuildIcsDocument(leaves);
        }

        public string BuildFeedUrl(string rawToken)
        {
            var baseUrl = (_options.IcsBaseUrl ?? "https://localhost:5000").TrimEnd('/');
            return $"{baseUrl}/api/LeaveCalendarSync/outlook/ics/{Uri.EscapeDataString(rawToken)}.ics";
        }

        private string BuildIcsDocument(List<LeaveRequest> leaves)
        {
            var sb = new StringBuilder();
            sb.AppendLine("BEGIN:VCALENDAR");
            sb.AppendLine("VERSION:2.0");
            sb.AppendLine("PRODID:-//YLWork//Leave Calendar//EN");
            sb.AppendLine("CALSCALE:GREGORIAN");
            sb.AppendLine("METHOD:PUBLISH");
            sb.AppendLine($"X-WR-CALNAME:{EscapeText(_options.CalendarName)}");

            var stamp = DateTime.UtcNow.ToString("yyyyMMdd'T'HHmmss'Z'");

            foreach (var leave in leaves)
            {
                var employeeName = leave.Employee?.FullName ?? "Employee";
                var leaveType = leave.LeaveType;
                if (leaveType == null) continue;

                var title = GoogleCalendarLeaveSyncService.BuildEventTitle(employeeName, leaveType);
                var start = leave.StartDate.Date;
                var endExclusive = leave.EndDate.Date.AddDays(1);
                var description = $"{employeeName} leave on {leaveType.Name} from {start:yyyy-MM-dd} to {leave.EndDate:yyyy-MM-dd}";

                sb.AppendLine("BEGIN:VEVENT");
                sb.AppendLine($"UID:leave-{leave.Id:N}@ylwork");
                sb.AppendLine($"DTSTAMP:{stamp}");
                sb.AppendLine($"DTSTART;VALUE=DATE:{start:yyyyMMdd}");
                sb.AppendLine($"DTEND;VALUE=DATE:{endExclusive:yyyyMMdd}");
                sb.AppendLine($"SUMMARY:{EscapeText(title)}");
                sb.AppendLine($"DESCRIPTION:{EscapeText(description)}");
                sb.AppendLine("TRANSP:TRANSPARENT");
                sb.AppendLine("END:VEVENT");
            }

            sb.AppendLine("END:VCALENDAR");
            return sb.ToString();
        }

        private static string GenerateToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static string HashToken(string rawToken)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static string EscapeText(string value)
        {
            return value
                .Replace("\\", "\\\\", StringComparison.Ordinal)
                .Replace(";", "\\;", StringComparison.Ordinal)
                .Replace(",", "\\,", StringComparison.Ordinal)
                .Replace("\r\n", "\\n", StringComparison.Ordinal)
                .Replace("\n", "\\n", StringComparison.Ordinal)
                .Replace("\r", "\\n", StringComparison.Ordinal);
        }
    }
}
