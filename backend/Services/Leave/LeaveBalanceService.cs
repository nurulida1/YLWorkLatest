using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Model;
using YLWorks.Model.Leave;
using WebApplication1.Helpers;

namespace YLWorks.Services.Leave
{
    public class LeaveBalanceService
    {
        private readonly AppDbContext _context;
        private readonly LeavePolicyService _policyService;
        private readonly ILogger<LeaveBalanceService> _logger;

        public LeaveBalanceService(
            AppDbContext context,
            LeavePolicyService policyService,
            ILogger<LeaveBalanceService> logger)
        {
            _context = context;
            _policyService = policyService;
            _logger = logger;
        }

        public static int CalculateTotalDays(DateTime start, DateTime end)
        {
            return (int)CalculateChargeableDays(start, end, LeaveDaySession.Full, LeaveDaySession.Full, null);
        }

        /// <summary>
        /// Inclusive calendar days between start and end, optionally skipping public holidays.
        /// Weekends are still counted.
        /// </summary>
        public static int CalculateTotalDays(
            DateTime start,
            DateTime end,
            IEnumerable<DateTime>? excludeDates)
        {
            return (int)CalculateChargeableDays(start, end, LeaveDaySession.Full, LeaveDaySession.Full, excludeDates);
        }

        public static double CalculateChargeableDays(
            DateTime start,
            DateTime end,
            LeaveDaySession startSession,
            LeaveDaySession endSession,
            IEnumerable<DateTime>? excludeDates)
        {
            return LeaveDayCalculator.CalculateChargeableDays(start, end, startSession, endSession, excludeDates);
        }

        public async Task<LeaveBalance?> GetBalanceAsync(Guid employeeId, Guid leaveTypeId, int year)
        {
            return await _context.LeaveBalances.FirstOrDefaultAsync(b =>
                b.EmployeeId == employeeId && b.LeaveTypeId == leaveTypeId && b.Year == year);
        }

        public async Task<BalanceCheckResultDto> CheckBalanceAsync(
            Guid employeeId, Guid leaveTypeId, double totalDays, int year, bool isUnpaid)
        {
            if (isUnpaid)
            {
                return new BalanceCheckResultDto
                {
                    IsSufficient = true,
                    RequestedDays = totalDays,
                    AvailableDays = totalDays
                };
            }

            await EnsureYearBalancesAsync(employeeId, year);
            var balance = await GetBalanceAsync(employeeId, leaveTypeId, year);
            var available = balance?.RemainingDays ?? 0;

            var result = new BalanceCheckResultDto
            {
                RequestedDays = totalDays,
                AvailableDays = available,
                IsSufficient = available >= totalDays
            };

            if (!result.IsSufficient)
            {
                result.Options =
                [
                    "Adjust dates to fit remaining balance",
                    "Apply as unpaid leave",
                    "Cancel submission"
                ];
            }

            return result;
        }

        public async Task AddPendingDaysAsync(Guid employeeId, Guid leaveTypeId, double days, int year)
        {
            var balance = await EnsureBalanceAsync(employeeId, leaveTypeId, year);
            balance.PendingDays += days;
            RecalculateRemaining(balance);
            balance.UpdatedAt = DateTimeHelper.Now();
            await _context.SaveChangesAsync();
        }

        public async Task DeductBalanceAsync(Guid employeeId, Guid leaveTypeId, double days, int year)
        {
            var balance = await EnsureBalanceAsync(employeeId, leaveTypeId, year);
            balance.PendingDays = Math.Max(0, balance.PendingDays - days);
            balance.UsedDays += days;
            RecalculateRemaining(balance);
            balance.UpdatedAt = DateTimeHelper.Now();
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deducted {Days} leave days for employee {EmployeeId}", days, employeeId);
        }

        public async Task RestoreBalanceAsync(Guid employeeId, Guid leaveTypeId, double days, int year, bool wasApproved)
        {
            var balance = await EnsureBalanceAsync(employeeId, leaveTypeId, year);
            if (wasApproved)
                balance.UsedDays = Math.Max(0, balance.UsedDays - days);
            else
                balance.PendingDays = Math.Max(0, balance.PendingDays - days);

            RecalculateRemaining(balance);
            balance.UpdatedAt = DateTimeHelper.Now();
            await _context.SaveChangesAsync();
        }

        public async Task<List<LeaveBalanceDto>> GetAllBalancesForEmployeeAsync(Guid employeeId, int year)
        {
            await EnsureYearBalancesAsync(employeeId, year);

            var employeeGender = await _context.Users.AsNoTracking()
                .Where(u => u.Id == employeeId)
                .Select(u => u.Gender)
                .FirstOrDefaultAsync();

            var balances = await _context.LeaveBalances
                .Include(b => b.LeaveType)
                .Where(b => b.EmployeeId == employeeId && b.Year == year)
                .OrderBy(b => b.LeaveType.Name)
                .ToListAsync();

            // Hide gender-restricted types that do not match this employee (leave orphan rows in DB).
            // Emergency has no balance card (charged via Annual → Unpaid).
            return balances
                .Where(b => !b.LeaveType.IsEmergency)
                .Where(b => LeaveGenderRules.IsEligible(b.LeaveType.ApplicableGender, employeeGender))
                .Select(b => new LeaveBalanceDto
                {
                    LeaveTypeId = b.LeaveTypeId,
                    LeaveTypeName = b.LeaveType.Name,
                    PolicyKind = b.LeaveType.PolicyKind.ToString(),
                    ApplicableGender = b.LeaveType.ApplicableGender.ToString(),
                    Year = b.Year,
                    EntitledDays = b.EntitledDays,
                    TenureEntitledDays = b.TenureEntitledDays,
                    CarriedForwardDays = b.CarriedForwardDays,
                    CreditedDays = b.CreditedDays,
                    UsedDays = b.UsedDays,
                    PendingDays = b.PendingDays,
                    RemainingDays = b.RemainingDays
                })
                .ToList();
        }

        /// <summary>
        /// Creates missing leave balance rows for the employee/year from active policy.
        /// Does not overwrite existing rows (policy edits apply next year only).
        /// Skips leave types not applicable to the employee's gender.
        /// </summary>
        public async Task EnsureYearBalancesAsync(Guid employeeId, int year)
        {
            var employee = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == employeeId)
                ?? throw new InvalidOperationException("Employee not found.");

            var types = await _context.LeaveTypes.AsNoTracking().ToListAsync();
            if (types.Count == 0) return;

            var policy = await _policyService.GetOrCreateActivePolicyAsync();
            var tenureYears = LeavePolicyService.CalculateTenureYears(employee.JoinedDate, year);
            var existing = await _context.LeaveBalances
                .Where(b => b.EmployeeId == employeeId && b.Year == year)
                .Select(b => b.LeaveTypeId)
                .ToListAsync();
            var existingSet = existing.ToHashSet();

            foreach (var type in types)
            {
                if (existingSet.Contains(type.Id))
                    continue;
                // Emergency has no entitlement pool — charged from Annual then Unpaid.
                if (type.IsEmergency)
                    continue;
                if (!LeaveGenderRules.IsEligible(type.ApplicableGender, employee.Gender))
                    continue;

                var balance = BuildNewBalance(employeeId, type, year, tenureYears, policy, carried: 0, credited: 0);
                _context.LeaveBalances.Add(balance);
            }

            if (_context.ChangeTracker.HasChanges())
                await _context.SaveChangesAsync();
        }

        public async Task CreditReplacementAsync(CreditLeaveBalanceDto dto, Guid? creditedBy = null)
        {
            if (dto.Days <= 0)
                throw new ArgumentException("Days must be greater than zero.");

            var year = dto.Year ?? DateTimeHelper.Now().Year;
            var leaveType = await _context.LeaveTypes.FindAsync(dto.LeaveTypeId)
                ?? throw new InvalidOperationException("Leave type not found.");

            if (leaveType.PolicyKind != LeavePolicyKind.Replacement)
                throw new InvalidOperationException("Only Replacement leave types can be credited this way.");

            var employee = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == dto.EmployeeId)
                ?? throw new InvalidOperationException("Employee not found.");

            if (!LeaveGenderRules.IsEligible(leaveType.ApplicableGender, employee.Gender))
            {
                throw new InvalidOperationException(
                    $"This leave type is only available to {LeaveGenderRules.DescribeRequirement(leaveType.ApplicableGender)}.");
            }

            await EnsureYearBalancesAsync(dto.EmployeeId, year);
            var balance = await EnsureBalanceAsync(dto.EmployeeId, dto.LeaveTypeId, year);
            balance.CreditedDays += dto.Days;
            balance.EntitledDays = balance.CreditedDays;
            RecalculateRemaining(balance);
            balance.UpdatedAt = DateTimeHelper.Now();
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Credited {Days} replacement leave to {EmployeeId} for {Year} by {By}. Note: {Note}",
                dto.Days, dto.EmployeeId, year, creditedBy, dto.Note);
        }

        /// <summary>
        /// Closes <paramref name="closedYear"/> and creates/updates balances for closedYear+1.
        /// Idempotent via LeaveYearCloses.
        /// </summary>
        public async Task<int> RunYearEndRolloverAsync(int closedYear, Guid? closedByUserId = null)
        {
            if (await _context.LeaveYearCloses.AnyAsync(c => c.ClosedYear == closedYear))
            {
                _logger.LogInformation("Year-end already completed for {Year}.", closedYear);
                return 0;
            }

            var nextYear = closedYear + 1;
            var policy = await _policyService.GetOrCreateActivePolicyAsync();
            var types = await _context.LeaveTypes.ToListAsync();
            var annualType = types.FirstOrDefault(t => t.PolicyKind == LeavePolicyKind.AnnualTenure);
            var medicalType = types.FirstOrDefault(t => t.PolicyKind == LeavePolicyKind.MedicalTenure);
            var replacementTypes = types.Where(t => t.PolicyKind == LeavePolicyKind.Replacement).ToList();
            var fixedTypes = types.Where(t => t.PolicyKind == LeavePolicyKind.Fixed).ToList();

            var employees = await _context.Users
                .Where(u => u.IsActive)
                .ToListAsync();

            var priorBalances = await _context.LeaveBalances
                .Where(b => b.Year == closedYear)
                .ToListAsync();
            var priorByKey = priorBalances.ToDictionary(b => (b.EmployeeId, b.LeaveTypeId));

            var createdOrUpdated = 0;

            foreach (var emp in employees)
            {
                var tenureNext = LeavePolicyService.CalculateTenureYears(emp.JoinedDate, nextYear);

                if (annualType != null &&
                    LeaveGenderRules.IsEligible(annualType.ApplicableGender, emp.Gender))
                {
                    priorByKey.TryGetValue((emp.Id, annualType.Id), out var priorAnnual);
                    var priorTenure = priorAnnual?.TenureEntitledDays
                        ?? _policyService.ResolveBandDays(
                            policy,
                            LeaveTenureBandKind.Annual,
                            LeavePolicyService.CalculateTenureYears(emp.JoinedDate, closedYear));
                    // Use-it-or-lose-it on % of tenure; unused remainder of that % is forfeited.
                    // Any approved UsedDays counts toward the threshold. Carry can exceed the %.
                    var carry = CalculateAnnualCarryForward(
                        priorTenure,
                        priorAnnual?.UsedDays ?? 0,
                        priorAnnual?.RemainingDays ?? 0,
                        policy.AnnualCarryForwardPercent);
                    var nextTenure = _policyService.ResolveBandDays(policy, LeaveTenureBandKind.Annual, tenureNext);

                    await UpsertYearBalanceForRolloverAsync(
                        emp.Id, annualType, nextYear, nextTenure, carry, credited: 0);
                    createdOrUpdated++;
                }

                if (medicalType != null &&
                    LeaveGenderRules.IsEligible(medicalType.ApplicableGender, emp.Gender))
                {
                    var nextTenure = _policyService.ResolveBandDays(policy, LeaveTenureBandKind.Medical, tenureNext);
                    await UpsertYearBalanceForRolloverAsync(
                        emp.Id, medicalType, nextYear, nextTenure, carried: 0, credited: 0);
                    createdOrUpdated++;
                }

                foreach (var rt in replacementTypes)
                {
                    if (!LeaveGenderRules.IsEligible(rt.ApplicableGender, emp.Gender))
                        continue;
                    // New year starts at 0; unused replacement is forfeited.
                    await UpsertYearBalanceForRolloverAsync(emp.Id, rt, nextYear, tenure: 0, carried: 0, credited: 0);
                    createdOrUpdated++;
                }

                foreach (var ft in fixedTypes)
                {
                    if (ft.IsEmergency)
                        continue;
                    if (!LeaveGenderRules.IsEligible(ft.ApplicableGender, emp.Gender))
                        continue;
                    await UpsertYearBalanceForRolloverAsync(
                        emp.Id, ft, nextYear, ft.DefaultDaysPerYear, carried: 0, credited: 0);
                    createdOrUpdated++;
                }
            }

            _context.LeaveYearCloses.Add(new LeaveYearClose
            {
                Id = Guid.NewGuid(),
                ClosedYear = closedYear,
                ClosedAt = DateTimeHelper.Now(),
                ClosedByUserId = closedByUserId,
                Notes = $"Rollover to {nextYear}",
                CreatedAt = DateTimeHelper.Now()
            });

            await _context.SaveChangesAsync();
            _logger.LogInformation("Year-end rollover closed {Year} → {Next} ({Count} balance rows).",
                closedYear, nextYear, createdOrUpdated);
            return createdOrUpdated;
        }

        /// <summary>
        /// Annual carry: <c>mustUseOrLose = percent% × tenure</c>;
        /// <c>forfeit = max(0, mustUseOrLose − usedDays)</c>;
        /// <c>carry = max(0, remainingDays − forfeit)</c>.
        /// Pending does not reduce forfeit (only approved UsedDays). No max carry cap beyond that forfeit.
        /// </summary>
        public static double CalculateAnnualCarryForward(
            double tenureEntitledDays,
            double usedDays,
            double remainingDays,
            double carryForwardPercent)
        {
            var mustUseOrLose = Math.Max(0, tenureEntitledDays) * (Math.Clamp(carryForwardPercent, 0, 100) / 100.0);
            var used = Math.Max(0, usedDays);
            var remaining = Math.Max(0, remainingDays);
            var forfeit = Math.Max(0, mustUseOrLose - used);
            return Math.Max(0, remaining - forfeit);
        }

        /// <summary>
        /// Year-end may upgrade balances already created by EnsureYearBalances (tenure only, no carry).
        /// Overwrites entitlement when the next-year row has no usage yet.
        /// </summary>
        private async Task UpsertYearBalanceForRolloverAsync(
            Guid employeeId,
            LeaveType type,
            int year,
            double tenure,
            double carried,
            double credited)
        {
            var balance = await GetBalanceAsync(employeeId, type.Id, year);
            if (balance == null)
            {
                balance = BuildNewBalance(employeeId, type, year, tenureYears: 0, policy: null, carried, credited, tenureOverride: tenure);
                _context.LeaveBalances.Add(balance);
                return;
            }

            // Do not rewrite mid-year activity; do allow fixing shells that already have tenure/carry.
            if (balance.UsedDays != 0 || balance.PendingDays != 0)
            {
                _logger.LogInformation(
                    "Skip rollover upsert for {Employee} {Type} {Year}: used/pending already set.",
                    employeeId, type.Name, year);
                return;
            }

            ApplyEntitlement(balance, type, tenure, carried, credited);
            RecalculateRemaining(balance);
            balance.UpdatedAt = DateTimeHelper.Now();
        }

        private async Task UpsertYearBalanceAsync(
            Guid employeeId,
            LeaveType type,
            int year,
            double tenure,
            double carried,
            double credited)
        {
            var balance = await GetBalanceAsync(employeeId, type.Id, year);
            if (balance == null)
            {
                balance = BuildNewBalance(employeeId, type, year, tenureYears: 0, policy: null, carried, credited, tenureOverride: tenure);
                _context.LeaveBalances.Add(balance);
                return;
            }

            // Only fill empty next-year shells; do not rewrite used mid-year balances.
            if (balance.UsedDays == 0 && balance.PendingDays == 0 && balance.EntitledDays == 0)
            {
                ApplyEntitlement(balance, type, tenure, carried, credited);
                RecalculateRemaining(balance);
                balance.UpdatedAt = DateTimeHelper.Now();
            }
        }

        private LeaveBalance BuildNewBalance(
            Guid employeeId,
            LeaveType type,
            int year,
            int tenureYears,
            LeavePolicy? policy,
            double carried,
            double credited,
            double? tenureOverride = null)
        {
            double tenure = tenureOverride ?? type.PolicyKind switch
            {
                LeavePolicyKind.AnnualTenure when policy != null =>
                    _policyService.ResolveBandDays(policy, LeaveTenureBandKind.Annual, tenureYears),
                LeavePolicyKind.MedicalTenure when policy != null =>
                    _policyService.ResolveBandDays(policy, LeaveTenureBandKind.Medical, tenureYears),
                LeavePolicyKind.Fixed => type.DefaultDaysPerYear,
                LeavePolicyKind.Replacement => 0,
                _ => type.DefaultDaysPerYear
            };

            if (type.PolicyKind == LeavePolicyKind.Replacement)
            {
                tenure = 0;
                carried = 0;
            }
            else if (type.PolicyKind != LeavePolicyKind.AnnualTenure)
            {
                carried = 0;
            }

            if (type.PolicyKind != LeavePolicyKind.Replacement)
                credited = 0;

            var balance = new LeaveBalance
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId,
                LeaveTypeId = type.Id,
                Year = year,
                UsedDays = 0,
                PendingDays = 0,
                CreatedAt = DateTimeHelper.Now()
            };
            ApplyEntitlement(balance, type, tenure, carried, credited);
            RecalculateRemaining(balance);
            return balance;
        }

        private static void ApplyEntitlement(
            LeaveBalance balance,
            LeaveType type,
            double tenure,
            double carried,
            double credited)
        {
            balance.TenureEntitledDays = tenure;
            balance.CarriedForwardDays = type.PolicyKind == LeavePolicyKind.AnnualTenure ? carried : 0;
            balance.CreditedDays = type.PolicyKind == LeavePolicyKind.Replacement ? credited : 0;
            balance.EntitledDays = type.PolicyKind switch
            {
                LeavePolicyKind.AnnualTenure => tenure + carried,
                LeavePolicyKind.MedicalTenure => tenure,
                LeavePolicyKind.Replacement => credited,
                _ => tenure
            };
        }

        private async Task<LeaveBalance> EnsureBalanceAsync(Guid employeeId, Guid leaveTypeId, int year)
        {
            await EnsureYearBalancesAsync(employeeId, year);
            var balance = await GetBalanceAsync(employeeId, leaveTypeId, year);
            if (balance != null) return balance;

            var leaveType = await _context.LeaveTypes.FindAsync(leaveTypeId)
                ?? throw new InvalidOperationException("Leave type not found.");
            var employee = await _context.Users.AsNoTracking().FirstAsync(u => u.Id == employeeId);
            var policy = await _policyService.GetOrCreateActivePolicyAsync();
            var tenureYears = LeavePolicyService.CalculateTenureYears(employee.JoinedDate, year);
            balance = BuildNewBalance(employeeId, leaveType, year, tenureYears, policy, 0, 0);
            _context.LeaveBalances.Add(balance);
            await _context.SaveChangesAsync();
            return balance;
        }

        private static void RecalculateRemaining(LeaveBalance balance)
        {
            balance.RemainingDays = balance.EntitledDays - balance.UsedDays - balance.PendingDays;
        }
    }
}
