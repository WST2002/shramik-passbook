import { describe, expect, it } from 'vitest';
import { entryProblems, parsedPatch, type EntryFormState } from './entryForm';
import type { WorkEntry } from './types';

const known: WorkEntry = {
  id: 'aaaaaa',
  date: '2026-11-10',
  workType: 'mason',
  site: 'Lanka',
  contractorName: 'Suresh',
  contractorPhone: '9876500002',
  wageAgreed: 650,
  wagePaid: 650,
  createdAt: '2026-11-10T10:00:00.000Z',
};

const prefilled: EntryFormState = {
  date: '2026-11-14',
  workType: 'mason',
  site: 'Sigra',
  contractorName: 'Mohan',
  contractorPhone: '9876500001',
  wageAgreed: '700',
  wagePaid: '700',
};

describe('parsedPatch', () => {
  it('clears the previous contractor phone when a new contractor is spoken', () => {
    expect(parsedPatch(prefilled, { contractorName: 'Ramesh' }, [known]).contractorPhone).toBe('');
  });

  it('uses the saved phone of a known contractor', () => {
    expect(parsedPatch(prefilled, { contractorName: 'Suresh' }, [known]).contractorPhone).toBe('9876500002');
  });

  it('keeps the phone typed for the same contractor', () => {
    expect(parsedPatch(prefilled, { contractorName: 'mohan' }, [known])).not.toHaveProperty('contractorPhone');
  });

  it('prefers a spoken phone number', () => {
    expect(parsedPatch(prefilled, { contractorName: 'Ramesh', contractorPhone: '9876500003' }, [known]).contractorPhone).toBe(
      '9876500003',
    );
  });

  it('sets the paid wage to the new agreed wage when only the agreed wage is spoken', () => {
    const patch = parsedPatch(prefilled, { wageAgreed: 900 }, []);
    expect(patch.wageAgreed).toBe('900');
    expect(patch.wagePaid).toBe('900');
  });

  it('keeps a spoken paid wage', () => {
    const patch = parsedPatch(prefilled, { wageAgreed: 700, wagePaid: 500 }, []);
    expect(patch.wagePaid).toBe('500');
  });
});

describe('entryProblems', () => {
  it('accepts a complete day', () => {
    expect(entryProblems(prefilled, '2026-11-14')).toEqual({});
  });

  it('requires the site as well as date, work type and contractor', () => {
    const empty: EntryFormState = { ...prefilled, date: '', workType: undefined, site: '  ', contractorName: '' };
    expect(entryProblems(empty, '2026-11-14')).toEqual({
      date: 'missing',
      workType: 'missing',
      site: 'missing',
      contractorName: 'missing',
    });
  });

  it('rejects a date after today', () => {
    expect(entryProblems({ ...prefilled, date: '2026-11-15' }, '2026-11-14')).toEqual({ date: 'future' });
  });
});
