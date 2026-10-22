// Confirmed by the owner (2026-10-22): Monday-Friday, cutoff 16:00 the day before.
export const BAKE_WEEKDAYS = [1, 2, 3, 4, 5]; // 0 = Sunday
export const CUTOFF_HOUR = 16;
export const CUTOFF_DAYS_BEFORE = 1;

const TZ = 'Asia/Jerusalem';
const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const partsFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Israel wall-clock as 'YYYY-MM-DD' and minutes since midnight.
function israelNow(now: Date): { date: string; minutes: number } {
  const p: Record<string, string> = {};
  for (const part of partsFormat.formatToParts(now)) p[part.type] = part.value;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
  };
}

function toUtc(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, n: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

function isRealDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && fromUtc(toUtc(date)) === date;
}

// Cutoff is compared as Israel wall-clock (date + minutes), so DST shifts of the offset never matter.
export function isOrderable(date: string, now: Date, opts?: { fridayOnly?: boolean }): boolean {
  if (!isRealDate(date)) return false;
  const weekday = toUtc(date).getUTCDay();
  if (!BAKE_WEEKDAYS.includes(weekday)) return false;
  if (opts?.fridayOnly && weekday !== 5) return false;
  const cur = israelNow(now);
  const cutoffDate = addDays(date, -CUTOFF_DAYS_BEFORE);
  if (cur.date !== cutoffDate) return cur.date < cutoffDate;
  return cur.minutes < CUTOFF_HOUR * 60;
}

export function upcomingBakeDays(now: Date, count = 7, opts?: { fridayOnly?: boolean }): string[] {
  const today = israelNow(now).date;
  const out: string[] = [];
  // Scan a bounded window: with fridayOnly there is one day per week, plus the cutoff lead.
  for (let i = 0; out.length < count && i < count * 7 + 14; i++) {
    const d = addDays(today, i);
    if (isOrderable(d, now, opts)) out.push(d);
  }
  return out;
}

export function formatBakeDay(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${DAY_NAMES[toUtc(date).getUTCDay()]} ${d}.${String(m).padStart(2, '0')}`;
}
