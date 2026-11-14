import { ScreenHeader } from '../components/ui';
import { useI18n } from '../i18n';
import { rupees } from '../lib/format';
import { wageLedger } from '../lib/ledger';
import type { WorkEntry } from '../lib/types';

export function Ledger({ entries }: { entries: WorkEntry[] }) {
  const { t, lang } = useI18n();
  const { rows, totalPending } = wageLedger(entries);

  return (
    <main className="screen">
      <ScreenHeader title={t.ledger} />
      <section className="total-card">
        <span>{t.totalPending}</span>
        <strong className={totalPending > 0 ? 'owed' : ''}>{rupees(totalPending, lang)}</strong>
      </section>
      {rows.length === 0 && <p className="empty">{t.noDays}</p>}
      <ul className="ledger-list">
        {rows.map((row) => (
          <li key={row.contractor} className="ledger-card">
            <h2>{row.contractor}</h2>
            <p className="muted">
              {row.days} {t.days}
            </p>
            <dl>
              <div>
                <dt>{t.agreed}</dt>
                <dd>{rupees(row.agreed, lang)}</dd>
              </div>
              <div>
                <dt>{t.paid}</dt>
                <dd>{rupees(row.paid, lang)}</dd>
              </div>
              <div>
                <dt>{t.pending}</dt>
                <dd className={row.pending > 0 ? 'owed' : ''}>{rupees(row.pending, lang)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </main>
  );
}
