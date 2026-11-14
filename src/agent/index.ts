import { parseEntryText, type ParsedEntry } from '../lib/parser';
import { WORK_TYPES, type WorkType } from '../lib/types';

export interface EntryParserAgent {
  readonly name: 'deterministic' | 'remote';
  parse(text: string, today: string): Promise<ParsedEntry>;
}

export const deterministicAgent: EntryParserAgent = {
  name: 'deterministic',
  parse: async (text, today) => parseEntryText(text, today),
};

function pickParsed(data: unknown): ParsedEntry {
  if (typeof data !== 'object' || data === null) return {};
  const raw = data as Record<string, unknown>;
  const result: ParsedEntry = {};
  if (typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) result.date = raw.date;
  if (WORK_TYPES.includes(raw.workType as WorkType)) result.workType = raw.workType as WorkType;
  if (typeof raw.site === 'string') result.site = raw.site;
  if (typeof raw.contractorName === 'string') result.contractorName = raw.contractorName;
  if (typeof raw.contractorPhone === 'string') result.contractorPhone = raw.contractorPhone;
  if (typeof raw.wageAgreed === 'number') result.wageAgreed = raw.wageAgreed;
  if (typeof raw.wagePaid === 'number') result.wagePaid = raw.wagePaid;
  return result;
}

export function remoteAgent(endpoint: string): EntryParserAgent {
  return {
    name: 'remote',
    async parse(text, today) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, today }),
        });
        if (!response.ok) return deterministicAgent.parse(text, today);
        return { ...parseEntryText(text, today), ...pickParsed(await response.json()) };
      } catch {
        return deterministicAgent.parse(text, today);
      }
    },
  };
}

export function getAgent(): EntryParserAgent {
  const endpoint = import.meta.env.VITE_PARSER_ENDPOINT;
  return endpoint ? remoteAgent(endpoint) : deterministicAgent;
}
