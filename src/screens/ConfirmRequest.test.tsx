import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { dictionaries, I18nContext } from '../i18n';
import { encodeConfirmationCode } from '../lib/payload';
import type { WorkEntry } from '../lib/types';
import { ConfirmRequest } from './ConfirmRequest';

const t = dictionaries.hi;
const day: WorkEntry = {
  id: 'aaaaaa',
  date: '2026-11-10',
  workType: 'mason',
  site: 'Lanka',
  contractorName: 'Ramesh',
  contractorPhone: '',
  wageAgreed: 700,
  wagePaid: 700,
  createdAt: '2026-11-10T10:00:00.000Z',
};

function render(entries: WorkEntry[], initialCode?: string) {
  return renderToStaticMarkup(
    <I18nContext.Provider value={{ t, lang: 'hi' }}>
      <ConfirmRequest profile={{ name: 'Raju', phone: '' }} entries={entries} initialCode={initialCode} onApplyCode={async () => true} />
    </I18nContext.Provider>,
  );
}

const applyButton = (html: string) => html.match(/<button[^>]*>(?:(?!<\/button>).)*पुष्टि जोड़ें/)?.[0] ?? '';

describe('ConfirmRequest paste box', () => {
  it('keeps the add button disabled while the box is empty', () => {
    expect(applyButton(render([day]))).toMatch(/ disabled=""/);
  });

  it('enables the add button for a code that still has work to do', () => {
    expect(applyButton(render([day], encodeConfirmationCode(['aaaaaa'])))).not.toMatch(/ disabled=""/);
  });

  it('says a code was already added and keeps the button disabled', () => {
    const confirmed = { ...day, confirmation: { confirmedAt: '2026-11-11T00:00:00.000Z', contractorName: 'Ramesh' } };
    const html = render([confirmed], encodeConfirmationCode(['aaaaaa']));
    expect(html).toContain(t.codeAlready);
    expect(applyButton(html)).toContain('aria-disabled="true"');
  });
});
