import { newEntryId } from './payload';
import { WORK_TYPES, type GeoPoint, type WorkEntry, type WorkType } from './types';

type Raw = Record<string, unknown>;

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const amount = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined);

function point(value: unknown): GeoPoint | undefined {
  const p = value as Raw | undefined;
  return p && typeof p.lat === 'number' && typeof p.lng === 'number' ? { lat: p.lat, lng: p.lng } : undefined;
}

function entry(value: unknown): WorkEntry | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const e = value as Raw;
  const date = text(e.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const wageAgreed = amount(e.wageAgreed) ?? 0;
  const confirmation = e.confirmation as Raw | undefined;
  const photo = e.photo as Raw | undefined;
  return {
    id: text(e.id) || newEntryId(),
    date,
    workType: WORK_TYPES.includes(e.workType as WorkType) ? (e.workType as WorkType) : 'other',
    site: text(e.site),
    gps: point(e.gps),
    contractorName: text(e.contractorName),
    contractorPhone: text(e.contractorPhone),
    wageAgreed,
    wagePaid: amount(e.wagePaid) ?? wageAgreed,
    confirmation:
      confirmation && typeof confirmation.confirmedAt === 'string'
        ? { confirmedAt: confirmation.confirmedAt, contractorName: text(confirmation.contractorName) || text(e.contractorName) }
        : undefined,
    photo:
      photo && typeof photo.id === 'string'
        ? { id: photo.id, takenAt: text(photo.takenAt), gps: point(photo.gps) }
        : undefined,
    createdAt: text(e.createdAt) || `${date}T00:00:00.000Z`,
  };
}

export function normalizeEntries(raw: unknown): WorkEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: WorkEntry[] = [];
  for (const value of raw) {
    const e = entry(value);
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    result.push(e);
  }
  return result;
}
