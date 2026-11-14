import { describe, expect, it } from 'vitest';
import { groupBySiteAndContractor, wageLedger } from './ledger';
import type { WorkEntry } from './types';

function entry(id: string, date: string, extra: Partial<WorkEntry> = {}): WorkEntry {
  return {
    id,
    date,
    workType: 'helper',
    site: 'Gomti Nagar',
    contractorName: 'Ramesh',
    contractorPhone: '9876543210',
    wageAgreed: 600,
    wagePaid: 600,
    createdAt: `${date}T10:00:00.000Z`,
    ...extra,
  };
}

const confirmation = { confirmedAt: '2026-11-12T00:00:00Z', contractorName: 'Ramesh' };

describe('wageLedger', () => {
  it('totals owed and paid per contractor and overall', () => {
    const ledger = wageLedger([
      entry('a', '2026-11-01', { wagePaid: 400 }),
      entry('b', '2026-11-02'),
      entry('c', '2026-11-03', { contractorName: ' ramesh ', wageAgreed: 500, wagePaid: 0 }),
      entry('d', '2026-11-04', { contractorName: 'Suresh', contractorPhone: '', wageAgreed: 700, wagePaid: 800 }),
    ]);
    expect(ledger.rows).toEqual([
      { contractor: 'Ramesh', phone: '9876543210', days: 3, agreed: 1700, paid: 1000, pending: 700 },
      { contractor: 'Suresh', phone: '', days: 1, agreed: 700, paid: 800, pending: 0 },
    ]);
    expect(ledger.totalPending).toBe(700);
  });
});

describe('groupBySiteAndContractor', () => {
  it('groups days by site and contractor with first and last date and confirmation counts', () => {
    const groups = groupBySiteAndContractor([
      entry('a', '2026-11-03', { confirmation }),
      entry('b', '2026-11-01'),
      entry('c', '2026-11-02', { site: 'Alambagh' }),
      entry('d', '2026-11-05', { confirmation }),
    ]);
    expect(groups).toEqual([
      {
        site: 'Gomti Nagar',
        contractor: 'Ramesh',
        phone: '9876543210',
        from: '2026-11-01',
        to: '2026-11-05',
        days: 3,
        confirmedDays: 2,
        dates: ['2026-11-01', '2026-11-03', '2026-11-05'],
      },
      {
        site: 'Alambagh',
        contractor: 'Ramesh',
        phone: '9876543210',
        from: '2026-11-02',
        to: '2026-11-02',
        days: 1,
        confirmedDays: 0,
        dates: ['2026-11-02'],
      },
    ]);
  });
});
