import { LeaveDaySession, LeaveRequestDto } from '../models/Leave';

export function normalizeLeaveSession(value: unknown): LeaveDaySession {
  const v = String(value ?? 'Full').trim().toUpperCase();
  if (v === 'AM') return 'AM';
  if (v === 'PM') return 'PM';
  return 'Full';
}

export function formatSessionLabel(session: unknown): string {
  const s = normalizeLeaveSession(session);
  if (s === 'AM') return 'AM';
  if (s === 'PM') return 'PM';
  return 'Full day';
}

export function formatDaysAmount(days: number | null | undefined): string {
  if (days == null || Number.isNaN(Number(days))) return '0';
  const n = Number(days);
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

/** e.g. "2.5 day(s) · Wed PM – Fri AM" style short badge text */
export function formatLeaveDurationLabel(row: {
  totalDays?: number;
  startSession?: string;
  endSession?: string;
}): string {
  const days = formatDaysAmount(row.totalDays ?? 0);
  const start = normalizeLeaveSession(row.startSession);
  const end = normalizeLeaveSession(row.endSession);
  if (start === 'Full' && end === 'Full') {
    return `${days} day(s)`;
  }
  if (start === end) {
    return `${days} day(s) · ${formatSessionLabel(start)}`;
  }
  return `${days} day(s) · ${formatSessionLabel(start)} – ${formatSessionLabel(end)}`;
}

export function formatRequestSessionSummary(row: LeaveRequestDto): string | null {
  const start = normalizeLeaveSession(row.startSession);
  const end = normalizeLeaveSession(row.endSession);
  if (start === 'Full' && end === 'Full') return null;
  if (start === end) return formatSessionLabel(start);
  return `${formatSessionLabel(start)} – ${formatSessionLabel(end)}`;
}

export function calculateChargeableDaysClient(
  start: Date,
  end: Date,
  startSession: LeaveDaySession,
  endSession: LeaveDaySession,
  isHoliday: (d: Date) => boolean,
): { total: number; skipped: number } {
  const first = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (last.getTime() < first.getTime()) return { total: 0, skipped: 0 };

  const days: Date[] = [];
  let skipped = 0;
  const cursor = new Date(first);
  while (cursor.getTime() <= last.getTime()) {
    if (isHoliday(cursor)) skipped++;
    else days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  if (days.length === 0) return { total: 0, skipped };

  const startS = normalizeLeaveSession(startSession);
  const endS = normalizeLeaveSession(endSession);

  if (days.length === 1) {
    return { total: startS === 'Full' ? 1 : 0.5, skipped };
  }

  let total = 0;
  for (const d of days) {
    const isFirst = d.getTime() === first.getTime();
    const isLast = d.getTime() === last.getTime();
    if (isFirst && startS === 'PM') total += 0.5;
    else if (isLast && endS === 'AM') total += 0.5;
    else total += 1;
  }
  return { total, skipped };
}
