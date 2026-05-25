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
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, MalaysiaTimeZone);
        }

        public static DateTime ToMalaysiaTime(DateTime utcDateTime)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, MalaysiaTimeZone);
        }
    }
}