import { describe, expect, it } from 'vitest';
import { countWorkDays, evidenceLevel, REQUIRED_DAYS } from './counter';
import type { WorkEntry } from './types';

function entry(id: string, date: string, extra: Partial<WorkEntry> = {}): WorkEntry {
  return {
    id,
    date,
    workType: 'helper',
    site: 'Site',
    contractorName: 'Ramesh',
    contractorPhone: '',
    wageAgreed: 500,
    wagePaid: 500,
    createdAt: `${date}T10:00:00.000Z`,
    ...extra,
  };
}

const confirmed = { confirmation: { confirmedAt: '2026-11-01T00:00:00Z', contractorName: 'Ramesh' } };

describe('countWorkDays', () => {
  it('counts distinct dates within the last 12 months', () => {
    const result = countWorkDays(
      [
        entry('a', '2026-11-14'),
        entry('b', '2026-11-14'),
        entry('c', '2025-11-15'),
        entry('d', '2025-11-14'),
        entry('e', '2026-11-15'),
      ],
      '2026-11-14',
    );
    expect(result.windowStart).toBe('2025-11-15');
    expect(result.totalDays).toBe(2);
    expect(result.remaining).toBe(REQUIRED_DAYS - 2);
  });

  it('counts a day as confirmed when any entry on that date is confirmed', () => {
    const result = countWorkDays(
      [
        entry('a', '2026-11-10', confirmed),
        entry('b', '2026-11-10'),
        entry('c', '2026-11-11'),
        entry('d', '2026-11-12', { photo: { id: 'p', takenAt: '2026-11-12T08:00:00Z' } }),
      ],
      '2026-11-14',
    );
    expect(result.totalDays).toBe(3);
    expect(result.confirmedDays).toBe(1);
    expect(result.selfReportedDays).toBe(2);
    expect(result.photoDays).toBe(1);
  });

  it('never reports negative remaining days', () => {
    const entries = Array.from({ length: 120 }, (_, i) =>
      entry(String(i), `2026-${String(7 + Math.floor(i / 30)).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`),
    );
    const result = countWorkDays(entries, '2026-11-14');
    expect(result.totalDays).toBeGreaterThanOrEqual(REQUIRED_DAYS);
    expect(result.remaining).toBe(0);
    expect(result.ready).toBe(true);
  });
});

describe('evidenceLevel', () => {
  it('ranks contractor confirmation above a photo', () => {
    expect(evidenceLevel(entry('a', '2026-11-01'))).toBe('reported');
    expect(evidenceLevel(entry('a', '2026-11-01', { photo: { id: 'p', takenAt: 'x' } }))).toBe('photo');
    expect(evidenceLevel(entry('a', '2026-11-01', confirmed))).toBe('confirmed');
  });
});
