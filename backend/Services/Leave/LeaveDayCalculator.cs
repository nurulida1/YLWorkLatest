namespace YLWorks.Services.Leave
{
    using YLWorks.Model.Leave;

    /// <summary>Chargeable leave days including optional AM/PM half-day sessions.</summary>
    public static class LeaveDayCalculator
    {
        public static bool TryParseSession(string? value, out LeaveDaySession session)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                session = LeaveDaySession.Full;
                return true;
            }

            if (Enum.TryParse(value.Trim(), ignoreCase: true, out session) &&
                Enum.IsDefined(typeof(LeaveDaySession), session))
                return true;

            session = LeaveDaySession.Full;
            return false;
        }

        public static (LeaveDaySession Start, LeaveDaySession End) NormalizeAndValidateSessions(
            DateTime startDate,
            DateTime endDate,
            LeaveDaySession startSession,
            LeaveDaySession endSession,
            bool allowsHalfDay)
        {
            if (!allowsHalfDay)
                return (LeaveDaySession.Full, LeaveDaySession.Full);

            var start = startDate.Date;
            var end = endDate.Date;
            if (end < start)
                throw new ArgumentException("End date must be on or after start date.");

            if (start == end)
            {
                if (startSession != endSession)
                {
                    throw new InvalidOperationException(
                        "For a single-day leave, start and end session must match (Full, AM, or PM).");
                }

                return (startSession, endSession);
            }

            // Multi-day: start may be Full or PM; end may be Full or AM.
            if (startSession == LeaveDaySession.AM)
            {
                throw new InvalidOperationException(
                    "For multi-day leave, start session must be Full day or Afternoon (PM).");
            }

            if (endSession == LeaveDaySession.PM)
            {
                throw new InvalidOperationException(
                    "For multi-day leave, end session must be Full day or Morning (AM).");
            }

            return (startSession, endSession);
        }

        /// <summary>
        /// Inclusive calendar days minus holidays, then apply 0.5 on half start/end sessions.
        /// </summary>
        public static double CalculateChargeableDays(
            DateTime startDate,
            DateTime endDate,
            LeaveDaySession startSession,
            LeaveDaySession endSession,
            IEnumerable<DateTime>? excludeDates)
        {
            var start = startDate.Date;
            var end = endDate.Date;
            if (end < start) return 0;

            HashSet<DateTime>? excluded = null;
            if (excludeDates != null)
                excluded = excludeDates.Select(d => d.Date).ToHashSet();

            var days = new List<DateTime>();
            for (var d = start; d <= end; d = d.AddDays(1))
            {
                if (excluded != null && excluded.Contains(d))
                    continue;
                days.Add(d);
            }

            if (days.Count == 0) return 0;

            if (days.Count == 1)
            {
                return startSession == LeaveDaySession.Full ? 1.0 : 0.5;
            }

            double total = 0;
            for (var i = 0; i < days.Count; i++)
            {
                var isFirst = days[i] == start;
                var isLast = days[i] == end;
                if (isFirst && startSession == LeaveDaySession.PM)
                    total += 0.5;
                else if (isLast && endSession == LeaveDaySession.AM)
                    total += 0.5;
                else
                    total += 1.0;
            }

            return total;
        }

        public static string FormatSession(LeaveDaySession session) => session switch
        {
            LeaveDaySession.AM => "AM",
            LeaveDaySession.PM => "PM",
            _ => "Full"
        };
    }
}
