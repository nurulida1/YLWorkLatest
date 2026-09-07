using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using YLWorks.Data;
using YLWorks.Model.Leave;
using WebApplication1.Helpers;

namespace YLWorks.Services.Leave
{
    public class GoogleCalendarAuthService
    {
        private static readonly string[] Scopes =
        [
            CalendarService.Scope.Calendar,
            "https://www.googleapis.com/auth/userinfo.email",
            "openid"
        ];

        private const string StateCachePrefix = "gcal_oauth_state_";

        private readonly GoogleCalendarOptions _options;
        private readonly IMemoryCache _cache;
        private readonly AppDbContext _context;
        private readonly LeaveCalendarTokenProtector _tokenProtector;
        private readonly GoogleCalendarLeaveSyncService _syncService;
        private readonly LeaveExternalCalendarSyncCoordinator _coordinator;
        private readonly ILogger<GoogleCalendarAuthService> _logger;

        public GoogleCalendarAuthService(
            IOptions<GoogleCalendarOptions> options,
            IMemoryCache cache,
            AppDbContext context,
            LeaveCalendarTokenProtector tokenProtector,
            GoogleCalendarLeaveSyncService syncService,
            LeaveExternalCalendarSyncCoordinator coordinator,
            ILogger<GoogleCalendarAuthService> logger)
        {
            _options = options.Value;
            _cache = cache;
            _context = context;
            _tokenProtector = tokenProtector;
            _syncService = syncService;
            _coordinator = coordinator;
            _logger = logger;
        }

        public string BuildConnectUrl(Guid userId)
        {
            EnsureConfigured();

            var state = Guid.NewGuid().ToString("N");
            _cache.Set($"{StateCachePrefix}{state}", userId, TimeSpan.FromMinutes(10));

            var flow = CreateFlow();
            // CreateAuthorizationCodeRequest returns GoogleAuthorizationCodeRequestUrl,
            // which already sets access_type=offline. Do not append access_type again
            // (Google returns Error 400: "parameters can only have a single value: access_type").
            var request = (Google.Apis.Auth.OAuth2.Requests.GoogleAuthorizationCodeRequestUrl)
                flow.CreateAuthorizationCodeRequest(_options.RedirectUri);
            request.State = state;
            request.Prompt = "consent";
            return request.Build().ToString();
        }

        public async Task<string> HandleCallbackAsync(string? code, string? state, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
                return BuildFrontendRedirect("missing_code");

            if (!_cache.TryGetValue<Guid>($"{StateCachePrefix}{state}", out var userId))
                return BuildFrontendRedirect("invalid_state");

            _cache.Remove($"{StateCachePrefix}{state}");

            try
            {
                EnsureConfigured();
                var flow = CreateFlow();
                var token = await flow.ExchangeCodeForTokenAsync(
                    userId.ToString(), code, _options.RedirectUri, ct);

                var credential = new UserCredential(flow, userId.ToString(), token);
                var calendarService = new CalendarService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "YLWork Leave Sync"
                });

                // Calendar first so connection succeeds even if email lookup fails.
                var calendarId = await _syncService.FindOrCreateCalendarAsync(calendarService, ct);
                var email = await TryGetAccountEmailAsync(credential, calendarService, ct);

                var existing = await _context.LeaveCalendarConnections
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == LeaveCalendarProvider.Google, ct);

                if (existing == null)
                {
                    existing = new LeaveCalendarConnection
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Provider = LeaveCalendarProvider.Google,
                        ConnectedAtUtc = DateTime.UtcNow,
                        CreatedAt = DateTimeHelper.Now()
                    };
                    _context.LeaveCalendarConnections.Add(existing);
                }

                existing.AccessTokenProtected = _tokenProtector.Protect(token.AccessToken);
                existing.RefreshTokenProtected = string.IsNullOrEmpty(token.RefreshToken)
                    ? existing.RefreshTokenProtected
                    : _tokenProtector.Protect(token.RefreshToken);
                existing.TokenExpiresAtUtc = token.IssuedUtc.AddSeconds(token.ExpiresInSeconds ?? 3600);
                existing.ExternalCalendarId = calendarId;
                existing.ExternalAccountEmail = email;
                existing.LastError = null;
                existing.UpdatedAt = DateTimeHelper.Now();

                await _context.SaveChangesAsync(ct);
                await _coordinator.BackfillConnectionAsync(existing.Id, ct);

                return BuildFrontendRedirect("connected");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google Calendar OAuth callback failed for user {UserId}", userId);
                return BuildFrontendRedirect("oauth_failed");
            }
        }

        public async Task DisconnectAsync(Guid userId, CancellationToken ct = default)
        {
            var connection = await _context.LeaveCalendarConnections
                .Include(c => c.EventMaps)
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == LeaveCalendarProvider.Google, ct);

            if (connection == null) return;

            try
            {
                var service = await _syncService.CreateCalendarServiceAsync(connection, ct);
                if (service != null)
                {
                    foreach (var map in connection.EventMaps.ToList())
                    {
                        try
                        {
                            await _syncService.DeleteEventAsync(service, connection.ExternalCalendarId, map.ExternalEventId, ct);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to delete Google event {EventId} on disconnect", map.ExternalEventId);
                        }
                    }

                    try
                    {
                        await service.Calendars.Delete(connection.ExternalCalendarId).ExecuteAsync(ct);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete Google calendar {CalendarId} on disconnect", connection.ExternalCalendarId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Google disconnect cleanup failed for user {UserId}", userId);
            }

            _context.LeaveCalendarEventMaps.RemoveRange(connection.EventMaps);
            _context.LeaveCalendarConnections.Remove(connection);
            await _context.SaveChangesAsync(ct);
        }

        private GoogleAuthorizationCodeFlow CreateFlow()
        {
            return new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = _options.ClientId,
                    ClientSecret = _options.ClientSecret
                },
                Scopes = Scopes
            });
        }

        private async Task<string> TryGetAccountEmailAsync(
            UserCredential credential,
            CalendarService calendarService,
            CancellationToken ct)
        {
            try
            {
                if (credential.Token.IsStale)
                    await credential.RefreshTokenAsync(ct);

                using var http = new HttpClient();
                http.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", credential.Token.AccessToken);

                var response = await http.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo", ct);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync(ct);
                    using var doc = System.Text.Json.JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("email", out var emailProp))
                    {
                        var email = emailProp.GetString();
                        if (!string.IsNullOrWhiteSpace(email))
                            return email;
                    }
                }
                else
                {
                    _logger.LogWarning(
                        "userinfo email lookup returned {Status}; falling back to primary calendar id",
                        (int)response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "userinfo email lookup failed; falling back to primary calendar id");
            }

            try
            {
                var primary = await calendarService.CalendarList.Get("primary").ExecuteAsync(ct);
                if (!string.IsNullOrWhiteSpace(primary.Id) && primary.Id.Contains('@'))
                    return primary.Id;
                if (!string.IsNullOrWhiteSpace(primary.SummaryOverride))
                    return primary.SummaryOverride!;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "primary calendar email fallback failed");
            }

            return string.Empty;
        }

        private void EnsureConfigured()
        {
            if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret))
                throw new InvalidOperationException("Google Calendar OAuth is not configured.");
        }

        private string BuildFrontendRedirect(string result) =>
            $"{_options.FrontendBaseUrl.TrimEnd('/')}{_options.FrontendSuccessPath}?{result}=1";
    }
}
