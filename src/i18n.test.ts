import { describe, expect, it } from 'vitest';
import { dictionaries } from './i18n';

const { hi, en } = dictionaries;

describe('count strings', () => {
  it('uses the singular in Hindi for one day', () => {
    expect(hi.codeApplied(1)).toMatch(/^1 दिन पर/);
    expect(hi.codeApplied(2)).toMatch(/^2 दिनों पर/);
    expect(hi.days(1)).toBe('1 दिन');
  });

  it('uses the singular in English for one day', () => {
    const one = [
      en.remaining(1),
      en.unconfirmedDays(1),
      en.codeApplied(1),
      en.askMessage('Ramesh', 'Raju', 1, 'https://x'),
      en.replyMessage('Ramesh', 'Raju', 1, 'SP1-x', 'https://x'),
      en.confirmedOf(1, 1),
      en.summaryTotals(1, 1),
      en.days(1),
    ];
    for (const text of one) expect(text).not.toMatch(/\b1 (more |work )?days\b/);
    expect(en.codeApplied(1)).toBe('1 day is now marked "confirmed by contractor":');
  });

  it('uses the plural in English for several days', () => {
    expect(en.unconfirmedDays(3)).toBe('3 days not confirmed');
    expect(en.remaining(2)).toBe('2 more days needed for registration');
    expect(en.days(0)).toBe('0 days');
  });
});
