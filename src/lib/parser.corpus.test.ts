import { describe, expect, it } from 'vitest';
import { parseEntryText, type ParsedEntry } from './parser';
import { CORPUS_TODAY, PARSER_CORPUS } from './parser.corpus';

const FIELDS: (keyof ParsedEntry)[] = ['date', 'workType', 'site', 'contractorName', 'contractorPhone', 'wageAgreed', 'wagePaid'];

const MIN_ACCURACY: Record<keyof ParsedEntry, number> = {
  date: 0.78,
  workType: 1,
  site: 0.89,
  contractorName: 0.89,
  contractorPhone: 0.99,
  wageAgreed: 0.92,
  wagePaid: 0.85,
};

const results = PARSER_CORPUS.map(({ text, expected }) => ({ text, expected, parsed: parseEntryText(text, CORPUS_TODAY) }));

function accuracy(field: keyof ParsedEntry): number {
  return results.filter((r) => r.parsed[field] === r.expected[field]).length / results.length;
}

describe('parser corpus', () => {
  it('has at least 120 worker sentences', () => {
    expect(PARSER_CORPUS.length).toBeGreaterThanOrEqual(120);
  });

  it.each(FIELDS)('reads %s accurately across the corpus', (field) => {
    const misses = results
      .filter((r) => r.parsed[field] !== r.expected[field])
      .map((r) => `${r.text} | expected ${r.expected[field]} got ${r.parsed[field]}`);
    if (process.env.CORPUS_REPORT) console.log(`${field}: ${(accuracy(field) * 100).toFixed(1)}%\n${misses.join('\n')}`);
    expect(accuracy(field)).toBeGreaterThanOrEqual(MIN_ACCURACY[field]);
  });
});
