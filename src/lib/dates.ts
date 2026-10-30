const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Matches the backend's BUSINESS_TIME_ZONE (backend/src/common/business-date.ts). Cairo runs
 *  ahead of UTC, so for a few hours after UTC midnight each day its calendar date has already
 *  advanced to the next day. A naive `new Date().toISOString().slice(0, 10)` reports the OLD UTC
 *  day during that window, and the backend's "not in the past" check (which compares against the
 *  business-zone date) then rejects it as already past — computing "today" the same way the
 *  backend does avoids that skew entirely. */
const BUSINESS_TIME_ZONE = "Africa/Cairo";
const BUSINESS_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** Today's calendar date (YYYY-MM-DD) in the business zone. */
export function businessToday(): string {
  return BUSINESS_DATE_FORMAT.format(new Date());
}

/* Accepts either a plain date ("2026-10-20") or a full ISO datetime ("2026-10-20T06:30:00.000Z") —
 * only the calendar date is ever used here, so the time/offset portion, if present, is ignored. */
function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = parts(checkIn);
  const b = parts(checkOut);
  const ms = Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function addDays(iso: string, days: number): string {
  const p = parts(iso);
  const date = new Date(Date.UTC(p.y, p.m - 1, p.d + days));
  return date.toISOString().slice(0, 10);
}

/* Fixed-format output avoids server/client hydration mismatches from locale differences. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatDateRange(start: string, end: string): string {
  if (!start) return "";
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}
