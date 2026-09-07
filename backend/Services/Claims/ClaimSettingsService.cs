using Microsoft.EntityFrameworkCore;
using WebApplication1.Helpers;
using YLWorks.Data;
using YLWorks.Model.Claim;

namespace YLWorks.Services.Claims
{
    public class ClaimSettingsService
    {
        private readonly AppDbContext _context;

        public ClaimSettingsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ClaimSettings> GetActiveEntityAsync()
        {
            var settings = await _context.ClaimSettings
                .FirstOrDefaultAsync(s => s.IsActive);

            if (settings != null)
                return settings;

            settings = new ClaimSettings
            {
                Id = Guid.NewGuid(),
                IsActive = true,
                CreatedAt = DateTimeHelper.Now()
            };
            _context.ClaimSettings.Add(settings);
            await _context.SaveChangesAsync();
            return settings;
        }

        public async Task<ClaimSettingsDto> GetAsync() =>
            Map(await GetActiveEntityAsync());

        public async Task<ClaimSettingsDto> UpsertAsync(UpsertClaimSettingsDto dto)
        {
            var settings = await _context.ClaimSettings.FirstOrDefaultAsync(s => s.IsActive)
                ?? new ClaimSettings { Id = Guid.NewGuid(), IsActive = true, CreatedAt = DateTimeHelper.Now() };

            settings.MedicalPerReceiptLimit = dto.MedicalPerReceiptLimit;
            settings.MedicalAnnualLimit = dto.MedicalAnnualLimit;
            settings.SafetyShoesLimit = dto.SafetyShoesLimit;
            settings.MileageCarRatePerKm = dto.MileageCarRatePerKm;
            settings.MileageMotorcycleRatePerKm = dto.MileageMotorcycleRatePerKm;
            settings.MealAllowancePerDay = dto.MealAllowancePerDay;
            settings.OrdinaryRateDivisorDays = dto.OrdinaryRateDivisorDays;
            settings.OrdinaryDayHours = dto.OrdinaryDayHours;
            settings.OtNormalMultiplier = dto.OtNormalMultiplier;
            settings.OtRestDayFirstBandMultiplier = dto.OtRestDayFirstBandMultiplier;
            settings.OtRestDaySecondBandMultiplier = dto.OtRestDaySecondBandMultiplier;
            settings.OtRestDayAfter8HourlyMultiplier = dto.OtRestDayAfter8HourlyMultiplier;
            settings.OtPublicHolidayUpTo8Multiplier = dto.OtPublicHolidayUpTo8Multiplier;
            settings.OtPublicHolidayAfter8HourlyMultiplier = dto.OtPublicHolidayAfter8HourlyMultiplier;
            settings.DefaultWorkStartTime = ParseTime(dto.DefaultWorkStartTime, new TimeSpan(9, 0, 0));
            settings.DefaultWorkEndTime = ParseTime(dto.DefaultWorkEndTime, new TimeSpan(18, 0, 0));
            settings.DefaultUsesRestDayHalfDay = dto.DefaultUsesRestDayHalfDay;
            settings.DefaultRestDayHalfDayStart = ParseTime(dto.DefaultRestDayHalfDayStart, new TimeSpan(8, 0, 0));
            settings.DefaultRestDayHalfDayEnd = ParseTime(dto.DefaultRestDayHalfDayEnd, new TimeSpan(12, 0, 0));
            settings.UpdatedAt = DateTimeHelper.Now();

            if (_context.Entry(settings).State == EntityState.Detached)
                _context.ClaimSettings.Add(settings);

            await _context.SaveChangesAsync();
            return Map(settings);
        }

        public static TimeSpan ParseTime(string? value, TimeSpan fallback)
        {
            if (string.IsNullOrWhiteSpace(value))
                return fallback;
            if (TimeSpan.TryParse(value, out var ts))
                return ts;
            if (TimeSpan.TryParseExact(value, @"hh\:mm", null, out ts))
                return ts;
            if (TimeSpan.TryParseExact(value, @"h\:mm", null, out ts))
                return ts;
            return fallback;
        }

        public static string FormatTime(TimeSpan ts) =>
            $"{(int)ts.TotalHours:D2}:{ts.Minutes:D2}";

        public static TimeSpan? ParseOptionalTime(string? value)
        {
            if (value == null)
                return null;
            if (string.IsNullOrWhiteSpace(value))
                return null;
            if (TimeSpan.TryParse(value, out var ts))
                return ts;
            if (TimeSpan.TryParseExact(value, @"hh\:mm", null, out ts))
                return ts;
            if (TimeSpan.TryParseExact(value, @"h\:mm", null, out ts))
                return ts;
            throw new ArgumentException($"Invalid time format: {value}. Use HH:mm.");
        }

        private static ClaimSettingsDto Map(ClaimSettings s) => new()
        {
            Id = s.Id,
            MedicalPerReceiptLimit = s.MedicalPerReceiptLimit,
            MedicalAnnualLimit = s.MedicalAnnualLimit,
            SafetyShoesLimit = s.SafetyShoesLimit,
            MileageCarRatePerKm = s.MileageCarRatePerKm,
            MileageMotorcycleRatePerKm = s.MileageMotorcycleRatePerKm,
            MealAllowancePerDay = s.MealAllowancePerDay,
            OrdinaryRateDivisorDays = s.OrdinaryRateDivisorDays,
            OrdinaryDayHours = s.OrdinaryDayHours,
            OtNormalMultiplier = s.OtNormalMultiplier,
            OtRestDayFirstBandMultiplier = s.OtRestDayFirstBandMultiplier,
            OtRestDaySecondBandMultiplier = s.OtRestDaySecondBandMultiplier,
            OtRestDayAfter8HourlyMultiplier = s.OtRestDayAfter8HourlyMultiplier,
            OtPublicHolidayUpTo8Multiplier = s.OtPublicHolidayUpTo8Multiplier,
            OtPublicHolidayAfter8HourlyMultiplier = s.OtPublicHolidayAfter8HourlyMultiplier,
            DefaultWorkStartTime = FormatTime(s.DefaultWorkStartTime),
            DefaultWorkEndTime = FormatTime(s.DefaultWorkEndTime),
            DefaultUsesRestDayHalfDay = s.DefaultUsesRestDayHalfDay,
            DefaultRestDayHalfDayStart = FormatTime(s.DefaultRestDayHalfDayStart),
            DefaultRestDayHalfDayEnd = FormatTime(s.DefaultRestDayHalfDayEnd)
        };
    }
}
