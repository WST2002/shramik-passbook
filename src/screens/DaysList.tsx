import { EvidenceBadge, Icon, PhotoThumb, ScreenHeader } from '../components/ui';
import { useI18n } from '../i18n';
import { formatDate } from '../lib/dates';
import { rupees, WORK_ICONS } from '../lib/format';
import type { WorkEntry } from '../lib/types';

interface Props {
  entries: WorkEntry[];
  demo: boolean;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function DaysList({ entries, demo, onDelete, onBack }: Props) {
  const { t, lang } = useI18n();
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';

  return (
    <main className="screen">
      <ScreenHeader title={t.myDays} onBack={onBack} />
      {sorted.length === 0 && <p className="empty">{t.noDays}</p>}
      <ul className="day-list">
        {sorted.map((entry) => (
          <li key={entry.id} className={entry.confirmation ? 'day-card confirmed' : 'day-card'}>
            <div className="day-top">
              <Icon>{WORK_ICONS[entry.workType]}</Icon>
              <div className="day-main">
                <strong>{formatDate(entry.date, locale)}</strong>
                <span>
                  {t.workTypes[entry.workType]} · {entry.contractorName}
                </span>
                {entry.site && <span className="muted">{entry.site}</span>}
                <span className="muted">
                  {t.agreed} {rupees(entry.wageAgreed, lang)} · {t.paid} {rupees(entry.wagePaid, lang)}
                </span>
              </div>
              {entry.photo && <PhotoThumb photoId={entry.photo.id} demo={demo} />}
            </div>
            <div className="day-bottom">
              <EvidenceBadge entry={entry} />
              <button
                type="button"
                className="small-button danger"
                onClick={() => {
                  if (window.confirm(t.confirmDelete)) onDelete(entry.id);
                }}
              >
                {t.delete}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
