namespace YLWorks.Services.Leave
{
    public class EmergencyLeaveApprovalScheduler
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmergencyLeaveApprovalScheduler> _logger;

        public EmergencyLeaveApprovalScheduler(
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration,
            ILogger<EmergencyLeaveApprovalScheduler> logger)
        {
            _scopeFactory = scopeFactory;
            _configuration = configuration;
            _logger = logger;
        }

        public void ScheduleAutoApproval(Guid requestId)
        {
            var delayMinutes = _configuration.GetValue<int?>("Leave:EmergencyAutoApproveMinutes") ?? 120;
            _ = RunDelayedApprovalAsync(requestId, TimeSpan.FromMinutes(delayMinutes));
        }

        private async Task RunDelayedApprovalAsync(Guid requestId, TimeSpan delay)
        {
            try
            {
                await Task.Delay(delay);

                using var scope = _scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<LeaveRequestService>();
                await service.AutoApproveEmergencyIfPendingAsync(requestId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Emergency auto-approval failed for request {RequestId}", requestId);
            }
        }
    }
}
