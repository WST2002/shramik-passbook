import type { WorkEntry } from './types';

export interface LedgerRow {
  contractor: string;
  phone: string;
  days: number;
  agreed: number;
  paid: number;
  pending: number;
}

export interface Ledger {
  rows: LedgerRow[];
  totalPending: number;
}

export interface SiteGroup {
  site: string;
  contractor: string;
  phone: string;
  from: string;
  to: string;
  days: number;
  confirmedDays: number;
  dates: string[];
  confirmedDates: string[];
}

export function contractorKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function wageLedger(entries: WorkEntry[]): Ledger {
  const rows = new Map<string, LedgerRow>();
  for (const entry of entries) {
    const key = contractorKey(entry.contractorName);
    const row = rows.get(key) ?? {
      contractor: entry.contractorName.trim(),
      phone: entry.contractorPhone,
      days: 0,
      agreed: 0,
      paid: 0,
      pending: 0,
    };
    row.days += 1;
    row.agreed += entry.wageAgreed;
    row.paid += entry.wagePaid;
    row.pending = Math.max(0, row.agreed - row.paid);
    row.phone = row.phone || entry.contractorPhone;
    rows.set(key, row);
  }
  const list = [...rows.values()];
  return { rows: list, totalPending: list.reduce((sum, row) => sum + row.pending, 0) };
}

export function groupBySiteAndContractor(entries: WorkEntry[]): SiteGroup[] {
  const groups = new Map<string, SiteGroup>();
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  for (const entry of sorted) {
    const key = `${entry.site.trim().toLowerCase()}|${contractorKey(entry.contractorName)}`;
    const group = groups.get(key) ?? {
      site: entry.site.trim(),
      contractor: entry.contractorName.trim(),
      phone: entry.contractorPhone,
      from: entry.date,
      to: entry.date,
      days: 0,
      confirmedDays: 0,
      dates: [],
      confirmedDates: [],
    };
    if (!group.dates.includes(entry.date)) {
      group.dates.push(entry.date);
      group.days += 1;
    }
    if (entry.confirmation && !group.confirmedDates.includes(entry.date)) {
      group.confirmedDates.push(entry.date);
      group.confirmedDays += 1;
    }
    group.to = entry.date;
    groups.set(key, group);
  }
  return [...groups.values()];
}
