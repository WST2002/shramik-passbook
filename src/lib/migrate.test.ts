import { describe, expect, it } from 'vitest';
import { normalizeEntries } from './migrate';

describe('normalizeEntries', () => {
  it('returns no days for missing or broken storage', () => {
    expect(normalizeEntries(undefined)).toEqual([]);
    expect(normalizeEntries({ entries: [] })).toEqual([]);
  });

  it('fills fields an older version did not store', () => {
    const [day] = normalizeEntries([{ id: 'aaaaaa', date: '2026-11-01', contractorName: 'Ramesh', wageAgreed: 700 }]);
    expect(day).toMatchObject({
      id: 'aaaaaa',
      workType: 'other',
      site: '',
      contractorPhone: '',
      wageAgreed: 700,
      wagePaid: 700,
      createdAt: '2026-11-01T00:00:00.000Z',
    });
    expect(day.confirmation).toBeUndefined();
  });

  it('keeps a stored confirmation and photo', () => {
    const [day] = normalizeEntries([
      {
        id: 'aaaaaa',
        date: '2026-11-01',
        workType: 'mason',
        contractorName: 'Ramesh',
        confirmation: { confirmedAt: '2026-11-02T00:00:00.000Z' },
        photo: { id: 'pppppp', takenAt: '2026-11-01T09:00:00.000Z' },
      },
    ]);
    expect(day.confirmation).toEqual({ confirmedAt: '2026-11-02T00:00:00.000Z', contractorName: 'Ramesh' });
    expect(day.photo?.id).toBe('pppppp');
  });

  it('drops days without a usable date and repeated ids', () => {
    const days = normalizeEntries([
      { id: 'aaaaaa', date: 'kal' },
      { id: 'bbbbbb', date: '2026-11-01' },
      { id: 'bbbbbb', date: '2026-11-02' },
      null,
    ]);
    expect(days.map((d) => d.date)).toEqual(['2026-11-01']);
  });

  it('gives a day without an id a new one', () => {
    const [day] = normalizeEntries([{ date: '2026-11-01' }]);
    expect(day.id).toMatch(/^[0-9a-z]{6}$/);
  });

  it('replaces a broken wage with zero', () => {
    const [day] = normalizeEntries([{ id: 'aaaaaa', date: '2026-11-01', wageAgreed: 'saat sau', wagePaid: Number.NaN }]);
    expect(day.wageAgreed).toBe(0);
    expect(day.wagePaid).toBe(0);
  });
});
