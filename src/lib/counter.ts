import { addDays } from './dates';
import { wageLedger } from './ledger';
import type { EvidenceLevel, WorkEntry } from './types';

export const REQUIRED_DAYS = 90;

export interface DayCount {
  windowStart: string;
  totalDays: number;
  confirmedDays: number;
  selfReportedDays: number;
  photoDays: number;
  remaining: number;
  ready: boolean;
}

export function evidenceLevel(entry: WorkEntry): EvidenceLevel {
  if (entry.confirmation) return 'confirmed';
  if (entry.photo) return 'photo';
  return 'reported';
}

export function entriesInWindow(entries: WorkEntry[], today: string): WorkEntry[] {
  const windowStart = addDays(today, -364);
  return entries.filter((e) => e.date >= windowStart && e.date <= today);
}

export function countWorkDays(entries: WorkEntry[], today: string): DayCount {
  const windowStart = addDays(today, -364);
  const days = new Set<string>();
  const confirmed = new Set<string>();
  const withPhoto = new Set<string>();
  for (const entry of entriesInWindow(entries, today)) {
    days.add(entry.date);
    if (entry.confirmation) confirmed.add(entry.date);
    if (entry.photo) withPhoto.add(entry.date);
  }
  const totalDays = days.size;
  return {
    windowStart,
    totalDays,
    confirmedDays: confirmed.size,
    selfReportedDays: totalDays - confirmed.size,
    photoDays: withPhoto.size,
    remaining: Math.max(0, REQUIRED_DAYS - totalDays),
    ready: totalDays >= REQUIRED_DAYS,
  };
}

export function exportCounts(entries: WorkEntry[], today: string) {
  const count = countWorkDays(entries, today);
  const ledger = wageLedger(entries);
  return {
    app: 'shramik-passbook',
    exportedOn: today,
    workDaysLast12Months: count.totalDays,
    contractorConfirmedDays: count.confirmedDays,
    daysWithPhoto: count.photoDays,
    contractors: ledger.rows.length,
    pendingWagesRupees: ledger.totalPending,
  };
}
