import { Icon, ProgressRing } from '../components/ui';
import { useI18n } from '../i18n';
import { countWorkDays } from '../lib/counter';
import { rupees } from '../lib/format';
import { wageLedger } from '../lib/ledger';
import type { Profile, WorkEntry } from '../lib/types';
import type { Route } from '../routes';

interface Props {
  profile: Profile;
  entries: WorkEntry[];
  today: string;
  go: (route: Route) => void;
}

export function Home({ profile, entries, today, go }: Props) {
  const { t, lang } = useI18n();
  const count = countWorkDays(entries, today);
  const { totalPending } = wageLedger(entries);

  return (
    <main className="screen home">
      <p className="greeting">{profile.name}</p>

      <section className="hero-card" aria-labelledby="hero-title">
        <h2 id="hero-title" className="hero-title">
          {t.confirmedDays}
        </h2>
        <ProgressRing confirmed={count.confirmedDays} total={count.totalDays} />
        <ul className="hero-legend">
          <li>
            <span className="swatch swatch-confirmed" aria-hidden="true" />
            {t.evidence.confirmed}: <strong>{count.confirmedDays}</strong>
          </li>
          <li>
            <span className="swatch swatch-reported" aria-hidden="true" />
            {t.selfReported}: <strong>{count.selfReportedDays}</strong>
          </li>
        </ul>
        <p className="hero-total">
          {t.totalDays}: <strong>{count.totalDays}</strong>
        </p>
        <p className={count.ready ? 'hero-status ready' : 'hero-status'}>
          {count.ready ? t.readyLine : t.remaining(count.remaining)}
        </p>
        <p className="hint">{t.confirmHint}</p>
      </section>

      <button type="button" className="big-button primary" onClick={() => go('add')}>
        <Icon>➕</Icon>
        {t.addToday}
      </button>
      <button type="button" className="big-button confirm" onClick={() => go('confirm')}>
        <Icon>✅</Icon>
        {t.askConfirm}
      </button>

      <div className="tile-grid">
        <button type="button" className="tile" onClick={() => go('days')}>
          <Icon>📒</Icon>
          {t.myDays}
        </button>
        <button type="button" className="tile" onClick={() => go('ledger')}>
          <Icon>💰</Icon>
          {t.ledger}
          {totalPending > 0 && <span className="tile-note">{`${t.pending} ${rupees(totalPending, lang)}`}</span>}
        </button>
        <button type="button" className="tile" onClick={() => go('register')}>
          <Icon>📄</Icon>
          {t.registration}
        </button>
        <button type="button" className="tile" onClick={() => go('settings')}>
          <Icon>⚙️</Icon>
          {t.settings}
        </button>
      </div>
    </main>
  );
}
