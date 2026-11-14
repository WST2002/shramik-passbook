import { CircleCheck, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Icon, ScreenHeader } from '../components/ui';
import { useI18n } from '../i18n';
import { formatDate } from '../lib/dates';
import { appUrl, whatsappLink } from '../lib/device';
import { WORK_ICONS } from '../lib/format';
import { contractorKey } from '../lib/ledger';
import {
  buildRequest,
  decodeConfirmationCode,
  encodeRequest,
  findConfirmationCode,
  MAX_DAYS_PER_REQUEST,
} from '../lib/payload';
import type { Profile, WorkEntry } from '../lib/types';

interface Props {
  profile: Profile;
  entries: WorkEntry[];
  initialCode?: string;
  onApplyCode: (ids: string[]) => number;
  onBack: () => void;
}

export function ConfirmRequest({ profile, entries, initialCode, onApplyCode, onBack }: Props) {
  const { t, lang } = useI18n();
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const [contractor, setContractor] = useState<string>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [codeText, setCodeText] = useState(initialCode ?? '');
  const [codeMessage, setCodeMessage] = useState('');

  const unconfirmed = entries
    .filter((e) => !e.confirmation)
    .sort((a, b) => b.date.localeCompare(a.date));
  const byContractor = new Map<string, WorkEntry[]>();
  for (const entry of unconfirmed) {
    const key = contractorKey(entry.contractorName);
    byContractor.set(key, [...(byContractor.get(key) ?? []), entry]);
  }
  const chosen = contractor ? (byContractor.get(contractor) ?? []) : [];

  function choose(key: string) {
    setContractor(key);
    const days = byContractor.get(key) ?? [];
    setSelected(new Set(days.slice(0, MAX_DAYS_PER_REQUEST).map((e) => e.id)));
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const days = chosen.filter((e) => selected.has(e.id));
  const name = chosen[0]?.contractorName ?? '';
  const phone = chosen.find((e) => e.contractorPhone)?.contractorPhone ?? '';
  const link = days.length
    ? whatsappLink(
        phone,
        t.askMessage(name, profile.name, days.length, `${appUrl('confirm/')}#${encodeRequest(buildRequest(profile, name, days))}`),
      )
    : undefined;

  function applyCode() {
    const code = findConfirmationCode(codeText) ?? codeText;
    const result = decodeConfirmationCode(code);
    if (!result.ok) {
      setCodeMessage(t.codeBad);
      return;
    }
    const applied = onApplyCode(result.ids);
    setCodeMessage(applied ? t.codeApplied(applied) : t.codeUnknown);
  }

  return (
    <main className="screen">
      <ScreenHeader title={t.askConfirm} onBack={onBack} />

      <section className="panel">
        <h2>{t.haveCode}</h2>
        <label className="sr-only" htmlFor="code">
          {t.codePlaceholder}
        </label>
        <textarea id="code" rows={3} value={codeText} placeholder={t.codePlaceholder} onChange={(e) => setCodeText(e.target.value)} />
        <button type="button" className="big-button confirm" onClick={applyCode} disabled={!codeText.trim()}>
          <Icon icon={CircleCheck} />
          {t.applyCode}
        </button>
        {codeMessage && (
          <p className="notice" role="status">
            {codeMessage}
          </p>
        )}
      </section>

      <section className="panel">
        <h2>{t.chooseContractor}</h2>
        {byContractor.size === 0 && <p className="empty">{entries.length ? t.allConfirmed : t.noDays}</p>}
        <div className="choice-list">
          {[...byContractor.entries()].map(([key, list]) => (
            <button
              key={key}
              type="button"
              className={key === contractor ? 'choice selected' : 'choice'}
              aria-pressed={key === contractor}
              onClick={() => choose(key)}
            >
              <strong>{list[0].contractorName}</strong>
              <span>{t.unconfirmedDays(list.length)}</span>
            </button>
          ))}
        </div>
      </section>

      {chosen.length > 0 && (
        <section className="panel">
          <h2>{t.selectDays}</h2>
          <ul className="check-list">
            {chosen.slice(0, MAX_DAYS_PER_REQUEST).map((entry) => (
              <li key={entry.id}>
                <label>
                  <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggle(entry.id)} />
                  <Icon icon={WORK_ICONS[entry.workType]} />
                  <span>
                    {formatDate(entry.date, locale)} · {entry.site || t.workTypes[entry.workType]}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {!phone && <p className="hint">{t.noContractorPhone}</p>}
          {link && (
            <a className="big-button whatsapp" href={link} target="_blank" rel="noreferrer">
              <Icon icon={MessageCircle} />
              {t.sendWhatsapp} ({days.length})
            </a>
          )}
        </section>
      )}
    </main>
  );
}
