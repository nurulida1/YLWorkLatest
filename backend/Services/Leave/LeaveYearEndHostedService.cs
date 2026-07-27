using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Services.Leave;

namespace YLWorks.Services.Leave
{
    /// <summary>Runs year-end leave rollover shortly after New Year (UTC), idempotent.</summary>
    public class LeaveYearEndHostedService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<LeaveYearEndHostedService> _logger;

        public LeaveYearEndHostedService(
            IServiceScopeFactory scopeFactory,
            ILogger<LeaveYearEndHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.UtcNow;
                    // After Jan 1 00:05 UTC, close previous calendar year if not done.
                    if (now.Month == 1 && now.Day >= 1 && now.Hour >= 0)
                    {
                        using var scope = _scopeFactory.CreateScope();
                        var balances = scope.ServiceProvider.GetRequiredService<LeaveBalanceService>();
                        var closedYear = now.Year - 1;
                        await balances.RunYearEndRolloverAsync(closedYear);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Leave year-end hosted check failed.");
                }

                await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
            }
        }
    }
}
