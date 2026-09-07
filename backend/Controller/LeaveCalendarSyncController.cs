using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Model.Leave;
using YLWorks.Services.Leave;

namespace YLWorks.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
    public class LeaveCalendarSyncController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GoogleCalendarAuthService _googleAuth;
        private readonly LeaveExternalCalendarSyncCoordinator _coordinator;
        private readonly OutlookLeaveIcsFeedService _outlookIcs;

        public LeaveCalendarSyncController(
            AppDbContext context,
            GoogleCalendarAuthService googleAuth,
            LeaveExternalCalendarSyncCoordinator coordinator,
            OutlookLeaveIcsFeedService outlookIcs)
        {
            _context = context;
            _googleAuth = googleAuth;
            _coordinator = coordinator;
            _outlookIcs = outlookIcs;
        }

        [HttpGet("status")]
        public async Task<ActionResult<LeaveCalendarSyncStatusDto>> GetStatus()
        {
            var userId = GetUserId();
            var connections = await _context.LeaveCalendarConnections
                .AsNoTracking()
                .Where(c => c.UserId == userId)
                .ToListAsync();

            var google = connections.FirstOrDefault(c => c.Provider == LeaveCalendarProvider.Google);
            var outlook = connections.FirstOrDefault(c => c.Provider == LeaveCalendarProvider.Outlook);

            return Ok(new LeaveCalendarSyncStatusDto
            {
                GoogleConnected = google != null,
                GoogleAccountEmail = google?.ExternalAccountEmail,
                LastSyncAtUtc = google?.LastSyncAtUtc,
                LastError = google?.LastError,
                ConnectedAtUtc = google?.ConnectedAtUtc,
                OutlookConnected = outlook != null,
                OutlookFeedUrl = outlook == null ? null : _outlookIcs.TryGetFeedUrl(outlook),
                OutlookConnectedAtUtc = outlook?.ConnectedAtUtc,
                OutlookLastAccessedAtUtc = outlook?.LastSyncAtUtc
            });
        }

        [HttpGet("google/connect-url")]
        public ActionResult<LeaveCalendarConnectUrlDto> GetGoogleConnectUrl()
        {
            try
            {
                var url = _googleAuth.BuildConnectUrl(GetUserId());
                return Ok(new LeaveCalendarConnectUrlDto { AuthUrl = url });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpGet("google/callback")]
        public async Task<IActionResult> GoogleCallback([FromQuery] string? code, [FromQuery] string? state)
        {
            var redirect = await _googleAuth.HandleCallbackAsync(code, state);
            return Redirect(redirect);
        }

        [HttpPost("google/disconnect")]
        public async Task<IActionResult> DisconnectGoogle()
        {
            await _googleAuth.DisconnectAsync(GetUserId());
            return Ok(new { message = "Google Calendar disconnected." });
        }

        [HttpPost("google/resync")]
        public async Task<IActionResult> ResyncGoogle()
        {
            var userId = GetUserId();
            var connection = await _context.LeaveCalendarConnections
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == LeaveCalendarProvider.Google);

            if (connection == null)
                return BadRequest(new { message = "Google Calendar is not connected." });

            await _coordinator.BackfillConnectionAsync(connection.Id);
            return Ok(new { message = "Resync started." });
        }

        [HttpPost("outlook/ics/enable")]
        public async Task<ActionResult<LeaveCalendarOutlookFeedDto>> EnableOutlookIcs()
        {
            var userId = GetUserId();
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var (_, feedUrl, _) = await _outlookIcs.EnableOrCreateAsync(userId, email);
            return Ok(new LeaveCalendarOutlookFeedDto
            {
                FeedUrl = feedUrl,
                Message = "Outlook ICS feed enabled. Paste this URL into Outlook as an Internet Calendar."
            });
        }

        [HttpPost("outlook/ics/rotate")]
        public async Task<ActionResult<LeaveCalendarOutlookFeedDto>> RotateOutlookIcs()
        {
            var result = await _outlookIcs.RotateAsync(GetUserId());
            if (result == null)
                return BadRequest(new { message = "Outlook ICS feed is not enabled." });

            return Ok(new LeaveCalendarOutlookFeedDto
            {
                FeedUrl = result.Value.FeedUrl,
                Message = "Feed URL rotated. Update the calendar subscription in Outlook with the new URL."
            });
        }

        [HttpPost("outlook/ics/disable")]
        public async Task<IActionResult> DisableOutlookIcs()
        {
            await _outlookIcs.DisableAsync(GetUserId());
            return Ok(new { message = "Outlook ICS feed disabled." });
        }

        /// <summary>Anonymous ICS subscribe endpoint — token is the secret.</summary>
        [AllowAnonymous]
        [HttpGet("outlook/ics/{token}.ics")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> GetOutlookIcs(string token)
        {
            var ics = await _outlookIcs.BuildCalendarIcsAsync(token);
            if (ics == null)
                return NotFound();

            return Content(ics, "text/calendar; charset=utf-8");
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException());
    }
}
