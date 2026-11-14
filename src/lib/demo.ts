import { addDays } from './dates';
import type { Profile, WorkEntry, WorkType } from './types';

export interface DemoWorker {
  profile: Profile;
  entries: WorkEntry[];
}

interface DemoJob {
  site: string;
  contractorName: string;
  workType: WorkType;
  wage: number;
  days: number;
  confirmed: boolean;
  unpaidEvery: number;
}

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function buildEntries(prefix: string, jobs: DemoJob[], today: string, seed: number): WorkEntry[] {
  const random = seeded(seed);
  const entries: WorkEntry[] = [];
  let date = addDays(today, -1);
  let n = 0;
  for (const job of jobs) {
    for (let i = 0; i < job.days; i += 1) {
      if (random() < 0.2) date = addDays(date, -1);
      const id = `${prefix}${String(n).padStart(5, '0')}`;
      const unpaid = job.unpaidEvery > 0 && i % job.unpaidEvery === 0;
      entries.push({
        id,
        date,
        workType: job.workType,
        site: job.site,
        contractorName: job.contractorName,
        contractorPhone: '',
        wageAgreed: job.wage,
        wagePaid: unpaid ? Math.round(job.wage / 2) : job.wage,
        confirmation: job.confirmed
          ? { confirmedAt: `${addDays(date, 2)}T12:00:00.000Z`, contractorName: job.contractorName }
          : undefined,
        photo: i % 9 === 0 ? { id: `demo-${id}`, takenAt: `${date}T09:30:00.000Z` } : undefined,
        createdAt: `${date}T18:00:00.000Z`,
      });
      date = addDays(date, -1);
      n += 1;
    }
    date = addDays(date, -Math.floor(random() * 6) - 2);
  }
  return entries;
}

export function demoWorkers(today: string): DemoWorker[] {
  return [
    {
      profile: { name: 'रामू प्रजापति (डेमो)', phone: '' },
      entries: buildEntries(
        'r',
        [
          { site: 'गोमती नगर, लखनऊ', contractorName: 'रमेश यादव', workType: 'mason', wage: 750, days: 34, confirmed: true, unpaidEvery: 11 },
          { site: 'आलमबाग, लखनऊ', contractorName: 'सलीम खान', workType: 'mason', wage: 700, days: 28, confirmed: true, unpaidEvery: 0 },
          { site: 'कानपुर रोड, लखनऊ', contractorName: 'विनोद शर्मा', workType: 'mason', wage: 700, days: 33, confirmed: false, unpaidEvery: 8 },
        ],
        today,
        11,
      ),
    },
    {
      profile: { name: 'सुनीता देवी (डेमो)', phone: '' },
      entries: buildEntries(
        's',
        [
          { site: 'इंदिरा नगर, लखनऊ', contractorName: 'रमेश यादव', workType: 'helper', wage: 450, days: 22, confirmed: true, unpaidEvery: 0 },
          { site: 'चिनहट, लखनऊ', contractorName: 'पप्पू वर्मा', workType: 'helper', wage: 450, days: 30, confirmed: false, unpaidEvery: 6 },
        ],
        today,
        23,
      ),
    },
    {
      profile: { name: 'मोहम्मद आरिफ़ (डेमो)', phone: '' },
      entries: buildEntries(
        'a',
        [
          { site: 'लंका, वाराणसी', contractorName: 'अजय सिंह', workType: 'electrician', wage: 800, days: 12, confirmed: false, unpaidEvery: 3 },
          { site: 'सिगरा, वाराणसी', contractorName: 'अजय सिंह', workType: 'painter', wage: 650, days: 9, confirmed: false, unpaidEvery: 2 },
        ],
        today,
        37,
      ),
    },
  ];
}
