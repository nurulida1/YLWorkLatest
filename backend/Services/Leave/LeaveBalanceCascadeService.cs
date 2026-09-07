using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Model.Leave;

namespace YLWorks.Services.Leave
{
    public sealed class LeaveBalanceAllocationLine
    {
        public Guid LeaveTypeId { get; init; }
        public string LeaveTypeName { get; init; } = string.Empty;
        public double Days { get; init; }
        public int SortOrder { get; init; }
        public bool IsUnpaidBucket { get; init; }
    }

    public sealed class LeaveBalanceCascadePlan
    {
        public List<LeaveBalanceAllocationLine> Lines { get; init; } = new();
        public bool RequiresAccept { get; init; }
        public bool IsSufficient { get; init; } = true;
        public double AvailableOnPrimary { get; init; }
        public double PrimaryDays => Lines.Where(l => l.SortOrder == 0).Sum(l => l.Days);
        public double AnnualDays => Lines.Where(l => !l.IsUnpaidBucket && l.SortOrder == 1).Sum(l => l.Days);
        public double UnpaidDays => Lines.Where(l => l.IsUnpaidBucket).Sum(l => l.Days);
        public bool UsesCascade => Lines.Count > 1 || (Lines.Count == 1 && Lines[0].IsUnpaidBucket && PrimaryDays == 0);
    }

    public class LeaveBalanceCascadeService
    {
        public const string AnnualLeaveTypeName = "Annual Leave";
        public const string UnpaidLeaveTypeName = "Unpaid Leave";

        private readonly AppDbContext _context;
        private readonly LeaveBalanceService _balanceService;

        public LeaveBalanceCascadeService(AppDbContext context, LeaveBalanceService balanceService)
        {
            _context = context;
            _balanceService = balanceService;
        }

        public async Task<LeaveBalanceCascadePlan> PlanAsync(
            Guid employeeId,
            LeaveType selectedType,
            double totalDays,
            int year,
            DateTime startDate,
            IReadOnlyDictionary<Guid, double>? creditBackByType = null)
        {
            if (totalDays <= 0)
            {
                return new LeaveBalanceCascadePlan
                {
                    Lines = new List<LeaveBalanceAllocationLine>(),
                    IsSufficient = false,
                    RequiresAccept = false
                };
            }

            double Credit(Guid leaveTypeId) =>
                creditBackByType != null && creditBackByType.TryGetValue(leaveTypeId, out var days)
                    ? Math.Max(0, days)
                    : 0;

            // Unpaid leave type: all days unpaid, no cascade needed.
            if (!selectedType.IsPaid)
            {
                return new LeaveBalanceCascadePlan
                {
                    Lines =
                    [
                        new LeaveBalanceAllocationLine
                        {
                            LeaveTypeId = selectedType.Id,
                            LeaveTypeName = selectedType.Name,
                            Days = totalDays,
                            SortOrder = 0,
                            IsUnpaidBucket = true
                        }
                    ],
                    IsSufficient = true,
                    RequiresAccept = false,
                    AvailableOnPrimary = totalDays
                };
            }

            // Emergency: no own balance — charge Annual then Unpaid (always require accept).
            // Short-notice still uses Annual. Request LeaveTypeId stays Emergency for display.
            if (selectedType.IsEmergency)
            {
                return await PlanEmergencyAsync(employeeId, totalDays, year, creditBackByType);
            }

            await _balanceService.EnsureYearBalancesAsync(employeeId, year);
            var primaryBalance = await _balanceService.GetBalanceAsync(employeeId, selectedType.Id, year);
            var availablePrimary = (primaryBalance?.RemainingDays ?? 0) + Credit(selectedType.Id);
            var primaryTake = Math.Min(availablePrimary, totalDays);
            var rest = Math.Round(totalDays - primaryTake, 4);

            var lines = new List<LeaveBalanceAllocationLine>();
            if (primaryTake > 0)
            {
                lines.Add(new LeaveBalanceAllocationLine
                {
                    LeaveTypeId = selectedType.Id,
                    LeaveTypeName = selectedType.Name,
                    Days = primaryTake,
                    SortOrder = 0,
                    IsUnpaidBucket = false
                });
            }

            if (rest <= 0)
            {
                return new LeaveBalanceCascadePlan
                {
                    Lines = lines,
                    IsSufficient = true,
                    RequiresAccept = false,
                    AvailableOnPrimary = availablePrimary
                };
            }

            if (!selectedType.AllowsBalanceCascade)
            {
                return new LeaveBalanceCascadePlan
                {
                    Lines = lines,
                    IsSufficient = false,
                    RequiresAccept = false,
                    AvailableOnPrimary = availablePrimary
                };
            }

            var unpaidType = await FindLeaveTypeByNameAsync(UnpaidLeaveTypeName)
                ?? throw new InvalidOperationException(
                    "Unpaid Leave type is not configured. Ask HR to add an \"Unpaid Leave\" leave type.");

            var isAnnualSelected = string.Equals(
                selectedType.Name?.Trim(), AnnualLeaveTypeName, StringComparison.OrdinalIgnoreCase);
            var shortNoticeBlocksAnnual = IsWithinShortNoticeWindow(startDate);

            double annualTake = 0;
            if (!isAnnualSelected && !shortNoticeBlocksAnnual)
            {
                var annualType = await FindLeaveTypeByNameAsync(AnnualLeaveTypeName);
                if (annualType != null && annualType.IsPaid)
                {
                    var annualBalance = await _balanceService.GetBalanceAsync(employeeId, annualType.Id, year);
                    var annualAvailable = (annualBalance?.RemainingDays ?? 0) + Credit(annualType.Id);
                    annualTake = Math.Min(Math.Max(0, annualAvailable), rest);
                    if (annualTake > 0)
                    {
                        lines.Add(new LeaveBalanceAllocationLine
                        {
                            LeaveTypeId = annualType.Id,
                            LeaveTypeName = annualType.Name,
                            Days = annualTake,
                            SortOrder = 1,
                            IsUnpaidBucket = false
                        });
                        rest = Math.Round(rest - annualTake, 4);
                    }
                }
            }

            if (rest > 0)
            {
                lines.Add(new LeaveBalanceAllocationLine
                {
                    LeaveTypeId = unpaidType.Id,
                    LeaveTypeName = unpaidType.Name,
                    Days = rest,
                    SortOrder = 2,
                    IsUnpaidBucket = true
                });
            }

            return new LeaveBalanceCascadePlan
            {
                Lines = lines.Where(l => l.Days > 0).ToList(),
                IsSufficient = true,
                RequiresAccept = true,
                AvailableOnPrimary = availablePrimary
            };
        }

        public static bool IsWithinShortNoticeWindow(DateTime startDate)
        {
            var today = WebApplication1.Helpers.DateTimeHelper.Now().Date;
            return (startDate.Date - today).TotalDays < 7;
        }

        /// <summary>
        /// Emergency leave charges Annual Leave first, then Unpaid. Never uses an Emergency balance row.
        /// </summary>
        private async Task<LeaveBalanceCascadePlan> PlanEmergencyAsync(
            Guid employeeId,
            double totalDays,
            int year,
            IReadOnlyDictionary<Guid, double>? creditBackByType)
        {
            double Credit(Guid leaveTypeId) =>
                creditBackByType != null && creditBackByType.TryGetValue(leaveTypeId, out var days)
                    ? Math.Max(0, days)
                    : 0;

            await _balanceService.EnsureYearBalancesAsync(employeeId, year);

            var annualType = await FindLeaveTypeByNameAsync(AnnualLeaveTypeName)
                ?? throw new InvalidOperationException(
                    "Annual Leave type is not configured. Ask HR to add an \"Annual Leave\" leave type.");
            var unpaidType = await FindLeaveTypeByNameAsync(UnpaidLeaveTypeName)
                ?? throw new InvalidOperationException(
                    "Unpaid Leave type is not configured. Ask HR to add an \"Unpaid Leave\" leave type.");

            var annualBalance = await _balanceService.GetBalanceAsync(employeeId, annualType.Id, year);
            var annualAvailable = Math.Max(0, (annualBalance?.RemainingDays ?? 0) + Credit(annualType.Id));
            var annualTake = Math.Min(annualAvailable, totalDays);
            var unpaidTake = Math.Round(totalDays - annualTake, 4);

            var lines = new List<LeaveBalanceAllocationLine>();
            if (annualTake > 0)
            {
                lines.Add(new LeaveBalanceAllocationLine
                {
                    LeaveTypeId = annualType.Id,
                    LeaveTypeName = annualType.Name,
                    Days = annualTake,
                    SortOrder = 0,
                    IsUnpaidBucket = false
                });
            }

            if (unpaidTake > 0)
            {
                lines.Add(new LeaveBalanceAllocationLine
                {
                    LeaveTypeId = unpaidType.Id,
                    LeaveTypeName = unpaidType.Name,
                    Days = unpaidTake,
                    SortOrder = 1,
                    IsUnpaidBucket = true
                });
            }

            return new LeaveBalanceCascadePlan
            {
                Lines = lines,
                IsSufficient = true,
                RequiresAccept = true,
                AvailableOnPrimary = annualAvailable
            };
        }

        private async Task<LeaveType?> FindLeaveTypeByNameAsync(string name)
        {
            var lower = name.ToLowerInvariant();
            return await _context.LeaveTypes.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Name.ToLower() == lower);
        }
    }
}
