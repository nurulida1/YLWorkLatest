using Microsoft.EntityFrameworkCore;
using WebApplication1.Helpers;
using YLWorks.Data;
using YLWorks.Model.Leave;

namespace YLWorks.Services.Leave
{
    public class LeaveHolidayService
    {
        private readonly AppDbContext _context;

        public LeaveHolidayService(AppDbContext context) => _context = context;

        public async Task<List<PublicHolidayDto>> GetInRangeAsync(DateTime from, DateTime to, bool activeOnly = true)
        {
            var start = from.Date;
            var end = to.Date;
            if (end < start)
                (start, end) = (end, start);

            var query = _context.PublicHolidays.AsNoTracking()
                .Where(h => h.Date >= start && h.Date <= end);

            if (activeOnly)
                query = query.Where(h => h.IsActive);

            return (await query
                .OrderBy(h => h.Date)
                .ToListAsync())
                .Select(Map)
                .ToList();
        }

        public async Task<List<PublicHolidayDto>> GetByYearAsync(int year, bool includeInactive = true)
        {
            var start = new DateTime(year, 1, 1);
            var end = new DateTime(year, 12, 31);
            return await GetInRangeAsync(start, end, activeOnly: !includeInactive);
        }

        public async Task EnsureStartOrEndNotHolidayAsync(DateTime startDate, DateTime endDate)
        {
            var start = startDate.Date;
            var end = endDate.Date;

            var hits = await _context.PublicHolidays.AsNoTracking()
                .Where(h => h.IsActive && (h.Date == start || h.Date == end))
                .OrderBy(h => h.Date)
                .ToListAsync();

            if (hits.Count == 0)
                return;

            var startHit = hits.FirstOrDefault(h => h.Date == start);
            var endHit = hits.FirstOrDefault(h => h.Date == end);

            if (startHit != null && endHit != null && startHit.Id == endHit.Id)
            {
                throw new InvalidOperationException(
                    $"Start and end date cannot fall on a public holiday ({startHit.Name} on {startHit.Date:dd/MM/yyyy}).");
            }

            if (startHit != null)
            {
                throw new InvalidOperationException(
                    $"Start date cannot fall on a public holiday ({startHit.Name} on {startHit.Date:dd/MM/yyyy}).");
            }

            throw new InvalidOperationException(
                $"End date cannot fall on a public holiday ({endHit!.Name} on {endHit.Date:dd/MM/yyyy}).");
        }

        /// <summary>Leave days charged (calendar days minus active public holidays, with optional half-day sessions).</summary>
        public async Task<double> CountChargeableDaysAsync(
            DateTime startDate,
            DateTime endDate,
            LeaveDaySession startSession = LeaveDaySession.Full,
            LeaveDaySession endSession = LeaveDaySession.Full)
        {
            var start = startDate.Date;
            var end = endDate.Date;
            if (end < start) return 0;

            var holidayDates = await _context.PublicHolidays.AsNoTracking()
                .Where(h => h.IsActive && h.Date >= start && h.Date <= end)
                .Select(h => h.Date)
                .ToListAsync();

            return LeaveDayCalculator.CalculateChargeableDays(
                start, end, startSession, endSession, holidayDates);
        }

        public async Task<PublicHolidayDto> CreateAsync(UpsertPublicHolidayDto dto)
        {
            var date = dto.Date.Date;
            var name = (dto.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Holiday name is required.");

            if (await _context.PublicHolidays.AnyAsync(h => h.Date == date))
                throw new ArgumentException($"A public holiday already exists on {date:dd/MM/yyyy}.");

            var entity = new PublicHoliday
            {
                Id = Guid.NewGuid(),
                Date = date,
                Name = name,
                IsActive = dto.IsActive,
                CreatedAt = DateTimeHelper.Now()
            };
            _context.PublicHolidays.Add(entity);
            await _context.SaveChangesAsync();
            return Map(entity);
        }

        public async Task<PublicHolidayDto> UpdateAsync(Guid id, UpsertPublicHolidayDto dto)
        {
            var entity = await _context.PublicHolidays.FindAsync(id)
                ?? throw new KeyNotFoundException("Public holiday not found.");

            var date = dto.Date.Date;
            var name = (dto.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Holiday name is required.");

            if (await _context.PublicHolidays.AnyAsync(h => h.Date == date && h.Id != id))
                throw new ArgumentException($"A public holiday already exists on {date:dd/MM/yyyy}.");

            entity.Date = date;
            entity.Name = name;
            entity.IsActive = dto.IsActive;
            entity.UpdatedAt = DateTimeHelper.Now();
            await _context.SaveChangesAsync();
            return Map(entity);
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await _context.PublicHolidays.FindAsync(id)
                ?? throw new KeyNotFoundException("Public holiday not found.");
            _context.PublicHolidays.Remove(entity);
            await _context.SaveChangesAsync();
        }

        private static PublicHolidayDto Map(PublicHoliday h) => new()
        {
            Id = h.Id,
            Date = h.Date,
            Name = h.Name,
            IsActive = h.IsActive
        };
    }
}
