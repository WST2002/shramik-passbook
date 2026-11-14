const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  return fromUtc(toUtc(isoDate) + days * DAY_MS);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / DAY_MS);
}

export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dayOfMonthOnOrBefore(today: string, day: number): string | undefined {
  if (day < 1 || day > 31) return undefined;
  const [y, m, d] = today.split('-').map(Number);
  const monthOffset = day <= d ? 0 : -1;
  const candidate = new Date(Date.UTC(y, m - 1 + monthOffset, day));
  if (candidate.getUTCDate() !== day) return undefined;
  return fromUtc(candidate.getTime());
}

export function formatDate(isoDate: string, locale: string): string {
  return new Date(toUtc(isoDate)).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
