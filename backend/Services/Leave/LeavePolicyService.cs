using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Model;
using YLWorks.Model.Leave;
using WebApplication1.Helpers;

namespace YLWorks.Services.Leave
{
    public class LeavePolicyService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<LeavePolicyService> _logger;

        public LeavePolicyService(AppDbContext context, ILogger<LeavePolicyService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<LeavePolicy> GetOrCreateActivePolicyAsync()
        {
            var policy = await _context.LeavePolicies
                .Include(p => p.TenureBands)
                .FirstOrDefaultAsync(p => p.IsActive);

            if (policy == null)
            {
                policy = CreateDefaultPolicy(DateTimeHelper.Now().Year);
                _context.LeavePolicies.Add(policy);
                await _context.SaveChangesAsync();
                return policy;
            }

            // Earlier failed saves could wipe bands — restore defaults so admin UI works.
            if (policy.TenureBands.Count == 0)
            {
                var defaults = CreateDefaultPolicy(policy.EffectiveFromYear).TenureBands;
                foreach (var band in defaults)
                {
                    band.LeavePolicyId = policy.Id;
                    _context.LeaveTenureBands.Add(band);
                }
                await _context.SaveChangesAsync();
                await _context.Entry(policy).Collection(p => p.TenureBands).LoadAsync();
            }

            return policy;
        }

        public async Task<LeavePolicyDto> GetPolicyDtoAsync()
        {
            var policy = await GetOrCreateActivePolicyAsync();
            return MapPolicy(policy);
        }

        public async Task<LeavePolicyDto> UpsertPolicyAsync(UpsertLeavePolicyDto dto)
        {
            if (dto.AnnualCarryForwardPercent < 0 || dto.AnnualCarryForwardPercent > 100)
                throw new ArgumentException("Carry-forward percent must be between 0 and 100.");

            if (dto.TenureBands == null || dto.TenureBands.Count == 0)
                throw new ArgumentException("At least one tenure band is required.");

            // Load policy without bands — avoid tracker conflicts when replacing children.
            var policy = await _context.LeavePolicies
                .FirstOrDefaultAsync(p => p.IsActive);

            if (policy == null)
            {
                policy = new LeavePolicy
                {
                    Id = Guid.NewGuid(),
                    IsActive = true,
                    CreatedAt = DateTimeHelper.Now()
                };
                _context.LeavePolicies.Add(policy);
                await _context.SaveChangesAsync();
            }

            policy.EffectiveFromYear = dto.EffectiveFromYear > 0
                ? dto.EffectiveFromYear
                : DateTimeHelper.Now().Year + 1;
            policy.AnnualCarryForwardPercent = dto.AnnualCarryForwardPercent;
            policy.UpdatedAt = DateTimeHelper.Now();

            // Hard-delete existing bands in SQL (ignore tracker / client Ids).
            await _context.LeaveTenureBands
                .Where(b => b.LeavePolicyId == policy.Id)
                .ExecuteDeleteAsync();

            foreach (var entry in _context.ChangeTracker.Entries<LeaveTenureBand>().ToList())
                entry.State = EntityState.Detached;

            var newBands = dto.TenureBands.Select(b => new LeaveTenureBand
            {
                Id = Guid.NewGuid(),
                LeavePolicyId = policy.Id,
                BandKind = ParseBandKind(b.BandKind),
                MinYearsInclusive = b.MinYearsInclusive,
                MaxYearsExclusive = b.MaxYearsExclusive,
                DaysPerYear = b.DaysPerYear,
                CreatedAt = DateTimeHelper.Now()
            }).ToList();

            await _context.LeaveTenureBands.AddRangeAsync(newBands);
            await _context.SaveChangesAsync();

            var refreshed = await _context.LeavePolicies
                .AsNoTracking()
                .Include(p => p.TenureBands)
                .FirstAsync(p => p.Id == policy.Id);
            return MapPolicy(refreshed);
        }

        public static int CalculateTenureYears(DateTime? joinedDate, int balanceYear)
        {
            if (!joinedDate.HasValue)
                return 0;
            var years = balanceYear - joinedDate.Value.Year;
            return Math.Max(0, years);
        }

        public double ResolveBandDays(LeavePolicy policy, LeaveTenureBandKind kind, int tenureYears)
        {
            var band = policy.TenureBands
                .Where(b => b.BandKind == kind)
                .Where(b => tenureYears >= b.MinYearsInclusive)
                .Where(b => !b.MaxYearsExclusive.HasValue || tenureYears < b.MaxYearsExclusive.Value)
                .OrderByDescending(b => b.MinYearsInclusive)
                .FirstOrDefault();

            if (band != null)
                return band.DaysPerYear;

            _logger.LogWarning("No tenure band for {Kind} at {Years} years; defaulting to 0.", kind, tenureYears);
            return 0;
        }

        public static LeavePolicy CreateDefaultPolicy(int effectiveFromYear)
        {
            var policyId = Guid.NewGuid();
            return new LeavePolicy
            {
                Id = policyId,
                EffectiveFromYear = effectiveFromYear,
                AnnualCarryForwardPercent = 50,
                IsActive = true,
                CreatedAt = DateTimeHelper.Now(),
                TenureBands =
                [
                    Band(policyId, LeaveTenureBandKind.Annual, 0, 2, 8),
                    Band(policyId, LeaveTenureBandKind.Annual, 2, 5, 12),
                    Band(policyId, LeaveTenureBandKind.Annual, 5, null, 15),
                    Band(policyId, LeaveTenureBandKind.Medical, 0, 2, 14),
                    Band(policyId, LeaveTenureBandKind.Medical, 2, 5, 18),
                    Band(policyId, LeaveTenureBandKind.Medical, 5, null, 22),
                ]
            };
        }

        private static LeaveTenureBand Band(
            Guid policyId, LeaveTenureBandKind kind, int min, int? max, double days) =>
            new()
            {
                Id = Guid.NewGuid(),
                LeavePolicyId = policyId,
                BandKind = kind,
                MinYearsInclusive = min,
                MaxYearsExclusive = max,
                DaysPerYear = days,
                CreatedAt = DateTimeHelper.Now()
            };

        private static LeaveTenureBandKind ParseBandKind(string? value)
        {
            if (Enum.TryParse<LeaveTenureBandKind>(value, true, out var kind))
                return kind;
            throw new ArgumentException($"Invalid band kind: {value}");
        }

        private static LeavePolicyDto MapPolicy(LeavePolicy policy) => new()
        {
            Id = policy.Id,
            EffectiveFromYear = policy.EffectiveFromYear,
            AnnualCarryForwardPercent = policy.AnnualCarryForwardPercent,
            IsActive = policy.IsActive,
            TenureBands = policy.TenureBands
                .OrderBy(b => b.BandKind)
                .ThenBy(b => b.MinYearsInclusive)
                .Select(b => new LeaveTenureBandDto
                {
                    Id = b.Id,
                    BandKind = b.BandKind.ToString(),
                    MinYearsInclusive = b.MinYearsInclusive,
                    MaxYearsExclusive = b.MaxYearsExclusive,
                    DaysPerYear = b.DaysPerYear
                })
                .ToList()
        };
    }
}
