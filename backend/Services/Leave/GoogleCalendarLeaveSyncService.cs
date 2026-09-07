using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using YLWorks.Data;
using YLWorks.Model.Leave;
using WebApplication1.Helpers;

namespace YLWorks.Services.Leave
{
    public class GoogleCalendarLeaveSyncService
    {
        private readonly AppDbContext _context;
        private readonly LeaveCalendarTokenProtector _tokenProtector;
        private readonly GoogleCalendarOptions _options;
        private readonly ILogger<GoogleCalendarLeaveSyncService> _logger;

        public GoogleCalendarLeaveSyncService(
            AppDbContext context,
            LeaveCalendarTokenProtector tokenProtector,
            IOptions<GoogleCalendarOptions> options,
            ILogger<GoogleCalendarLeaveSyncService> logger)
        {
            _context = context;
            _tokenProtector = tokenProtector;
            _options = options.Value;
            _logger = logger;
        }

        public static string BuildEventTitle(string employeeName, LeaveType leaveType)
        {
            if (leaveType.PolicyKind == LeavePolicyKind.MedicalTenure)
                return $"{employeeName} — On leave";
            return $"{employeeName} — {leaveType.Name}";
        }

        public async Task<CalendarService?> CreateCalendarServiceAsync(
            LeaveCalendarConnection connection,
            CancellationToken ct = default)
        {
            if (connection.Provider != LeaveCalendarProvider.Google)
                return null;

            try
            {
                var accessToken = _tokenProtector.Unprotect(connection.AccessTokenProtected);
                var refreshToken = string.IsNullOrWhiteSpace(connection.RefreshTokenProtected)
                    ? null
                    : _tokenProtector.Unprotect(connection.RefreshTokenProtected);

                var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
                {
                    ClientSecrets = new ClientSecrets
                    {
                        ClientId = _options.ClientId,
                        ClientSecret = _options.ClientSecret
                    },
                    Scopes = [CalendarService.Scope.Calendar]
                });

                var token = new TokenResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresInSeconds = Math.Max(0, (long)(connection.TokenExpiresAtUtc - DateTime.UtcNow).TotalSeconds)
                };

                var credential = new UserCredential(flow, connection.UserId.ToString(), token);

                if (connection.TokenExpiresAtUtc <= DateTime.UtcNow.AddMinutes(2) && !string.IsNullOrEmpty(refreshToken))
                {
                    var refreshed = await credential.RefreshTokenAsync(ct);
                    if (refreshed)
                    {
                        connection.AccessTokenProtected = _tokenProtector.Protect(credential.Token.AccessToken);
                        if (!string.IsNullOrEmpty(credential.Token.RefreshToken))
                            connection.RefreshTokenProtected = _tokenProtector.Protect(credential.Token.RefreshToken);
                        connection.TokenExpiresAtUtc = credential.Token.IssuedUtc
                            .AddSeconds(credential.Token.ExpiresInSeconds ?? 3600);
                        connection.UpdatedAt = DateTimeHelper.Now();
                        await _context.SaveChangesAsync(ct);
                    }
                }

                return new CalendarService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "YLWork Leave Sync"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create Google Calendar service for connection {ConnectionId}", connection.Id);
                connection.LastError = ex.Message;
                connection.UpdatedAt = DateTimeHelper.Now();
                await _context.SaveChangesAsync(ct);
                return null;
            }
        }

        public async Task<string> FindOrCreateCalendarAsync(CalendarService service, CancellationToken ct = default)
        {
            var list = await service.CalendarList.List().ExecuteAsync(ct);
            var existing = list.Items?.FirstOrDefault(c =>
                string.Equals(c.Summary, _options.CalendarName, StringComparison.OrdinalIgnoreCase));

            if (existing?.Id != null)
                return existing.Id;

            var created = await service.Calendars.Insert(new Calendar
            {
                Summary = _options.CalendarName,
                Description = "Company leave synced from YLWork",
                TimeZone = "UTC"
            }).ExecuteAsync(ct);

            return created.Id ?? throw new InvalidOperationException("Google Calendar creation returned no id.");
        }

        public async Task<string> UpsertLeaveEventAsync(
            CalendarService service,
            string calendarId,
            LeaveRequest request,
            string? existingEventId,
            CancellationToken ct = default)
        {
            var employeeName = request.Employee?.FullName ?? "Employee";
            var leaveType = request.LeaveType ?? throw new InvalidOperationException("Leave type required.");
            var title = BuildEventTitle(employeeName, leaveType);
            var start = request.StartDate.Date;
            var endExclusive = request.EndDate.Date.AddDays(1);

            var body = new Event
            {
                Summary = title,
                Description = $"{employeeName} leave on {leaveType.Name} from {start:yyyy-MM-dd} to {endExclusive:yyyy-MM-dd}",
                Start = new EventDateTime { Date = start.ToString("yyyy-MM-dd"), TimeZone = "UTC" },
                End = new EventDateTime { Date = endExclusive.ToString("yyyy-MM-dd"), TimeZone = "UTC" },
                Transparency = "transparent"
            };

            if (!string.IsNullOrEmpty(existingEventId))
            {
                try
                {
                    var updated = await service.Events.Update(body, calendarId, existingEventId).ExecuteAsync(ct);
                    return updated.Id ?? existingEventId;
                }
                catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogWarning("Google event {EventId} not found; creating new event", existingEventId);
                }
            }

            var created = await service.Events.Insert(body, calendarId).ExecuteAsync(ct);
            return created.Id ?? throw new InvalidOperationException("Google event insert returned no id.");
        }

        public Task DeleteEventAsync(
            CalendarService service,
            string calendarId,
            string externalEventId,
            CancellationToken ct = default) =>
            service.Events.Delete(calendarId, externalEventId).ExecuteAsync(ct);
    }
}
