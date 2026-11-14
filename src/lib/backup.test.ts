import { describe, expect, it } from 'vitest';
import { makeBackup, mergeEntries, parseBackup } from './backup';
import type { Profile, WorkEntry } from './types';

const profile: Profile = { name: 'रामू', phone: '9999900000' };

function entry(id: string, date: string, confirmed = false): WorkEntry {
  return {
    id,
    date,
    workType: 'mason',
    site: 'Lanka',
    contractorName: 'Ramesh',
    contractorPhone: '9999911111',
    wageAgreed: 700,
    wagePaid: 500,
    createdAt: `${date}T10:00:00.000Z`,
    ...(confirmed ? { confirmation: { confirmedAt: `${date}T18:00:00.000Z`, contractorName: 'Ramesh' } } : {}),
  };
}

describe('backup', () => {
  it('round-trips profile and entries', () => {
    const entries = [entry('a1', '2026-11-13', true), entry('a2', '2026-11-14')];
    const text = makeBackup(profile, entries, '2026-11-14T12:00:00.000Z');
    const back = parseBackup(text);
    expect(back).toEqual({ profile, entries });
  });

  it('rejects a file that is not a Shramik Passbook backup', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow();
    expect(() => parseBackup('not json')).toThrow();
  });

  it('rejects entries with a bad date or missing contractor', () => {
    const bad = JSON.parse(makeBackup(profile, [entry('a1', '2026-11-13')], '2026-11-14T12:00:00.000Z'));
    bad.entries[0].date = '13/11/2026';
    expect(() => parseBackup(JSON.stringify(bad))).toThrow();
    bad.entries[0].date = '2026-11-13';
    delete bad.entries[0].contractorName;
    expect(() => parseBackup(JSON.stringify(bad))).toThrow();
  });

  it('merges by id, keeps confirmations and adds new days without duplicates', () => {
    const current = [entry('a1', '2026-11-13'), entry('a3', '2026-11-12')];
    const restored = [entry('a1', '2026-11-13', true), entry('a2', '2026-11-14')];
    const merged = mergeEntries(current, restored);
    expect(merged.map((e) => e.id).sort()).toEqual(['a1', 'a2', 'a3']);
    expect(merged.find((e) => e.id === 'a1')?.confirmation).toBeDefined();
  });

  it('never drops a confirmation that only the current phone has', () => {
    const merged = mergeEntries([entry('a1', '2026-11-13', true)], [entry('a1', '2026-11-13')]);
    expect(merged[0].confirmation).toBeDefined();
  });
});
