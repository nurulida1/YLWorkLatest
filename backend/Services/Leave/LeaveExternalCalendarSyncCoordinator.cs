using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Model.Leave;
using WebApplication1.Helpers;

namespace YLWorks.Services.Leave
{
    public class LeaveExternalCalendarSyncCoordinator
    {
        private readonly AppDbContext _context;
        private readonly GoogleCalendarLeaveSyncService _googleSync;
        private readonly ILogger<LeaveExternalCalendarSyncCoordinator> _logger;

        public LeaveExternalCalendarSyncCoordinator(
            AppDbContext context,
            GoogleCalendarLeaveSyncService googleSync,
            ILogger<LeaveExternalCalendarSyncCoordinator> logger)
        {
            _context = context;
            _googleSync = googleSync;
            _logger = logger;
        }

        public async Task SyncApprovedLeaveAsync(Guid leaveRequestId, CancellationToken ct = default)
        {
            var request = await _context.LeaveRequests
                .Include(r => r.Employee)
                .Include(r => r.LeaveType)
                .FirstOrDefaultAsync(r => r.Id == leaveRequestId, ct);

            if (request == null || request.Status != LeaveRequestStatus.Approved)
                return;

            var connections = await _context.LeaveCalendarConnections
                .Where(c => c.Provider == LeaveCalendarProvider.Google)
                .ToListAsync(ct);

            foreach (var connection in connections)
                await SyncRequestForConnectionAsync(connection, request, ct);
        }

        public async Task RemoveLeaveAsync(Guid leaveRequestId, CancellationToken ct = default)
        {
            var maps = await _context.LeaveCalendarEventMaps
                .Include(m => m.Connection)
                .Where(m => m.LeaveRequestId == leaveRequestId)
                .ToListAsync(ct);

            foreach (var map in maps)
            {
                try
                {
                    if (map.Connection.Provider == LeaveCalendarProvider.Google)
                    {
                        var service = await _googleSync.CreateCalendarServiceAsync(map.Connection, ct);
                        if (service != null)
                        {
                            await _googleSync.DeleteEventAsync(
                                service, map.Connection.ExternalCalendarId, map.ExternalEventId, ct);
                        }
                    }

                    _context.LeaveCalendarEventMaps.Remove(map);
                    map.Connection.LastSyncAtUtc = DateTime.UtcNow;
                    map.Connection.LastError = null;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Failed to remove Google event for leave {LeaveRequestId} on connection {ConnectionId}",
                        leaveRequestId, map.ConnectionId);
                    map.Connection.LastError = ex.Message;
                }
            }

            await _context.SaveChangesAsync(ct);
        }

        public async Task BackfillConnectionAsync(Guid connectionId, CancellationToken ct = default)
        {
            var connection = await _context.LeaveCalendarConnections.FindAsync([connectionId], ct);
            if (connection == null) return;

            var today = DateTimeHelper.Now().Date;
            var approved = await _context.LeaveRequests
                .Include(r => r.Employee)
                .Include(r => r.LeaveType)
                .Where(r => r.Status == LeaveRequestStatus.Approved && r.EndDate.Date >= today)
                .ToListAsync(ct);

            foreach (var request in approved)
                await SyncRequestForConnectionAsync(connection, request, ct);
        }

        private async Task SyncRequestForConnectionAsync(
            LeaveCalendarConnection connection,
            LeaveRequest request,
            CancellationToken ct)
        {
            try
            {
                var service = await _googleSync.CreateCalendarServiceAsync(connection, ct);
                if (service == null) return;

                var existingMap = await _context.LeaveCalendarEventMaps
                    .FirstOrDefaultAsync(m => m.ConnectionId == connection.Id && m.LeaveRequestId == request.Id, ct);

                var externalEventId = await _googleSync.UpsertLeaveEventAsync(
                    service,
                    connection.ExternalCalendarId,
                    request,
                    existingMap?.ExternalEventId,
                    ct);

                if (existingMap == null)
                {
                    existingMap = new LeaveCalendarEventMap
                    {
                        Id = Guid.NewGuid(),
                        ConnectionId = connection.Id,
                        LeaveRequestId = request.Id,
                        ExternalEventId = externalEventId,
                        CreatedAt = DateTimeHelper.Now()
                    };
                    _context.LeaveCalendarEventMaps.Add(existingMap);
                }
                else
                {
                    existingMap.ExternalEventId = externalEventId;
                    existingMap.UpdatedAt = DateTimeHelper.Now();
                }

                connection.LastSyncAtUtc = DateTime.UtcNow;
                connection.LastError = null;
                await _context.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Google sync failed for leave {LeaveRequestId} on connection {ConnectionId}",
                    request.Id, connection.Id);
                connection.LastError = ex.Message;
                connection.UpdatedAt = DateTimeHelper.Now();
                await _context.SaveChangesAsync(ct);
            }
        }
    }
}
