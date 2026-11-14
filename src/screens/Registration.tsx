import { Globe, Printer, Square, SquareCheck } from 'lucide-react';
import { Icon, ScreenHeader } from '../components/ui';
import { useI18n } from '../i18n';
import { countWorkDays, entriesInWindow } from '../lib/counter';
import { formatDate } from '../lib/dates';
import { groupBySiteAndContractor } from '../lib/ledger';
import type { Profile, WorkEntry } from '../lib/types';

interface Props {
  profile: Profile;
  entries: WorkEntry[];
  today: string;
}

export function Registration({ profile, entries, today }: Props) {
  const { t, lang } = useI18n();
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const count = countWorkDays(entries, today);
  const groups = groupBySiteAndContractor(entriesInWindow(entries, today));
  const shortDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });

  const checklist = [
    { text: t.regAge, done: undefined },
    { text: t.regDays, done: count.ready },
    { text: t.regAadhaar, done: undefined },
    { text: t.regBank, done: undefined },
    { text: t.regPhoto, done: undefined },
    { text: t.regDeclaration, done: count.ready },
  ];

  return (
    <main className="screen">
      <div className="no-print">
        <ScreenHeader title={t.registration} />
        <section className="panel">
          <h2>{t.regTitle}</h2>
          <p>{t.regIntro}</p>
          <ul className="checklist">
            {checklist.map((item) => (
              <li key={item.text} className={item.done ? 'done' : ''}>
                <Icon icon={item.done ? SquareCheck : Square} />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          <p>{t.regWhere}</p>
          <a className="big-button secondary" href="https://upbocw.in" target="_blank" rel="noreferrer">
            <Icon icon={Globe} />
            {t.regOpen}
          </a>
        </section>
        <p className="hint">{t.regSummaryHelp}</p>
        <button type="button" className="big-button primary" onClick={() => window.print()}>
          <Icon icon={Printer} />
          {t.printSummary}
        </button>
      </div>

      <article className="summary print-area" aria-labelledby="summary-title">
        <h2 id="summary-title">{t.summaryTitle}</h2>
        <p className="summary-subtitle">{t.summarySubtitle}</p>
        <p className="hint">{t.summaryLegend}</p>
        <p className="disclaimer">{t.notCertificate}</p>
        <dl className="summary-meta">
          <div>
            <dt>{t.workerName}</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt>{t.period}</dt>
            <dd>
              {formatDate(count.windowStart, locale)} – {formatDate(today, locale)}
            </dd>
          </div>
          <div>
            <dt>{t.preparedOn}</dt>
            <dd>{formatDate(today, locale)}</dd>
          </div>
        </dl>
        <p className="summary-totals">{t.summaryTotals(count.totalDays, count.confirmedDays)}</p>
        <div className="table-scroll" role="region" aria-labelledby="summary-title" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">{t.colSite}</th>
                <th scope="col">{t.colContractor}</th>
                <th scope="col">{t.colDates}</th>
                <th scope="col">{t.colDays}</th>
                <th scope="col">{t.colConfirmed}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={`${group.site}|${group.contractor}`}>
                  <td>{group.site || '—'}</td>
                  <td>
                    {group.contractor}
                    {group.phone && <span className="muted"> ({group.phone})</span>}
                  </td>
                  <td>
                    <strong>
                      {formatDate(group.from, locale)} – {formatDate(group.to, locale)}
                    </strong>
                    <span className="date-list">
                      {group.dates
                        .map((d) => (group.confirmedDates.includes(d) ? `${shortDate(d)} ✓` : shortDate(d)))
                        .join(', ')}
                    </span>
                  </td>
                  <td>{group.days}</td>
                  <td className={group.confirmedDays === group.days ? 'all-confirmed' : ''}>
                    {t.confirmedOf(group.confirmedDays, group.days)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="signature">{t.signature}: ______________________</p>
      </article>
    </main>
  );
}
