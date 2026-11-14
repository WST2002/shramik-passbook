import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { dictionaries, I18nContext } from '../i18n';
import type { WorkEntry } from '../lib/types';
import { Registration } from './Registration';
import { Settings } from './Settings';

const t = dictionaries.en;
const profile = { name: 'Raju', phone: '9876543210' };
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
const noop = async () => undefined;

function wrap(node: React.ReactNode) {
  return renderToStaticMarkup(<I18nContext.Provider value={{ t, lang: 'en' }}>{node}</I18nContext.Provider>);
}

function settings(entries: WorkEntry[]) {
  return wrap(
    <Settings
      profile={profile}
      entries={entries}
      today="2026-11-14"
      demo={false}
      onSaveProfile={() => undefined}
      onDemo={() => undefined}
      onDeleteAll={noop}
      onRestore={noop}
      onBackupSaved={() => undefined}
    />,
  );
}

const button = (html: string, label: string) =>
  html.match(new RegExp(`<button[^>]*>(?:(?!</button>).)*${label}`))?.[0] ?? '';

describe('Settings buttons', () => {
  it('disables profile save until something changes', () => {
    const html = settings([day]);
    expect(button(html, t.save)).toMatch(/ disabled=""/);
    expect(html).toContain(t.profileUnchanged);
  });

  it('disables backup and export when there are no days', () => {
    const html = settings([]);
    expect(button(html, t.backupSave)).toMatch(/ disabled=""/);
    expect(button(html, t.exportButton)).toMatch(/ disabled=""/);
    expect(html).toContain(t.nothingToSave);
  });

  it('enables backup and export once a day exists', () => {
    const html = settings([day]);
    expect(button(html, t.backupSave)).not.toMatch(/ disabled=""/);
    expect(button(html, t.exportButton)).not.toMatch(/ disabled=""/);
  });
});

describe('Registration print', () => {
  it('disables printing an empty summary', () => {
    const html = wrap(<Registration profile={profile} entries={[]} today="2026-11-14" />);
    expect(button(html, t.printSummary)).toMatch(/ disabled=""/);
    expect(html).toContain(t.printNothing);
  });

  it('enables printing when there are days', () => {
    const html = wrap(<Registration profile={profile} entries={[day]} today="2026-11-14" />);
    expect(button(html, t.printSummary)).not.toMatch(/ disabled=""/);
  });
});
