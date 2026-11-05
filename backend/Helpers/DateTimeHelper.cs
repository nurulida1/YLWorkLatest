
using System;
using System.Runtime.InteropServices;

namespace WebApplication1.Helpers
{
    public static class DateTimeHelper
    {
        private static readonly TimeZoneInfo MalaysiaTimeZone =
            TimeZoneInfo.FindSystemTimeZoneById(
                RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                    ? "Singapore Standard Time"
                    : "Asia/Kuala_Lumpur"
            );

        public static DateTime Now()
        {
            return TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UtcNow,
                MalaysiaTimeZone
            );
        }

        public static DateTime ToMalaysiaTime(DateTime utcDateTime)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc),
                MalaysiaTimeZone
            );
        }

        public static DateTime ToMalaysiaDateTime(DateTime dateTime)
        {
            if (dateTime.Kind == DateTimeKind.Utc)
                return TimeZoneInfo.ConvertTimeFromUtc(
                    dateTime,
                    MalaysiaTimeZone
                );

            if (dateTime.Kind == DateTimeKind.Local)
                return TimeZoneInfo.ConvertTime(
                    dateTime,
                    MalaysiaTimeZone
                );

            return TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.SpecifyKind(dateTime, DateTimeKind.Utc),
                MalaysiaTimeZone
            );
        }
    }
}
