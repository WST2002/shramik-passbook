import { WORK_TYPES, type Profile, type WorkEntry } from './types';

const FORMAT = 'shramik-passbook-backup';
const VERSION = 1;

export interface Backup {
  profile: Profile;
  entries: WorkEntry[];
}

export function makeBackup(profile: Profile, entries: WorkEntry[], createdAt: string): string {
  return JSON.stringify({ format: FORMAT, version: VERSION, createdAt, profile, entries }, null, 2);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isEntry(value: unknown): value is WorkEntry {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return (
    isString(e.id) &&
    isString(e.date) &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
    isString(e.workType) &&
    (WORK_TYPES as readonly string[]).includes(e.workType) &&
    isString(e.site) &&
    isString(e.contractorName) &&
    isString(e.contractorPhone) &&
    typeof e.wageAgreed === 'number' &&
    typeof e.wagePaid === 'number' &&
    isString(e.createdAt)
  );
}

export function parseBackup(text: string): Backup {
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Not a backup file');
  const d = data as Record<string, unknown>;
  if (d.format !== FORMAT || d.version !== VERSION) throw new Error('Not a Shramik Passbook backup');
  const p = d.profile as Record<string, unknown> | undefined;
  if (!p || !isString(p.name) || !isString(p.phone)) throw new Error('Backup has no worker profile');
  if (!Array.isArray(d.entries) || !d.entries.every(isEntry)) throw new Error('Backup has a broken work day');
  const entries = (d.entries as WorkEntry[]).map(({ photo: _photo, ...rest }) => rest);
  return { profile: { name: p.name, phone: p.phone }, entries };
}

export function mergeEntries(current: WorkEntry[], restored: WorkEntry[]): WorkEntry[] {
  const byId = new Map(current.map((e) => [e.id, e]));
  for (const r of restored) {
    const mine = byId.get(r.id);
    byId.set(r.id, mine ? { ...r, ...mine, confirmation: mine.confirmation ?? r.confirmation } : r);
  }
  return [...byId.values()];
}
