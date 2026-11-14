import { CircleCheck, MessageCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { Icon, ScreenHeader } from '../components/ui';
import { useI18n } from '../i18n';
import { formatDate } from '../lib/dates';
import { appUrl, whatsappLink } from '../lib/device';
import { WORK_ICONS } from '../lib/format';
import { contractorKey } from '../lib/ledger';
import { buildRequest, checkConfirmation, encodeRequest, MAX_DAYS_PER_REQUEST } from '../lib/payload';
import type { Profile, WorkEntry } from '../lib/types';

interface Props {
  profile: Profile;
  entries: WorkEntry[];
  initialCode?: string;
  onApplyCode: (ids: string[]) => Promise<boolean>;
}

type CodeMessage = { status: 'bad' } | { status: 'unknown' } | { status: 'applied'; dates: string[] };

export function ConfirmRequest({ profile, entries, initialCode, onApplyCode }: Props) {
  const { t, lang } = useI18n();
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const [contractor, setContractor] = useState<string>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [codeText, setCodeText] = useState(initialCode ?? '');
  const [codeMessage, setCodeMessage] = useState<CodeMessage>();
  const [applying, setApplying] = useState(false);
  const busy = useRef(false);

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

  const check = codeText.trim() ? checkConfirmation(codeText, entries) : undefined;

  function typeCode(text: string) {
    setCodeText(text);
    setCodeMessage(undefined);
  }

  async function applyCode() {
    if (busy.current || !check) return;
    if (check.status !== 'ready') {
      if (check.status !== 'already') setCodeMessage(check);
      return;
    }
    busy.current = true;
    setApplying(true);
    const dates = entries
      .filter((e) => check.ids.includes(e.id))
      .map((e) => e.date)
      .sort();
    if (await onApplyCode(check.ids)) {
      setCodeText('');
      setCodeMessage({ status: 'applied', dates });
    }
    busy.current = false;
    setApplying(false);
  }

  const codeNotice = (() => {
    if (check?.status === 'already') return t.codeAlready;
    if (!codeMessage) return '';
    if (codeMessage.status === 'bad') return t.codeBad;
    if (codeMessage.status === 'unknown') return t.codeUnknown;
    return `${t.codeApplied(codeMessage.dates.length)} ${codeMessage.dates.map((d) => formatDate(d, locale)).join(', ')}`;
  })();
  const codeDisabled = !check || check.status === 'already' || applying;

  return (
    <main className="screen">
      <ScreenHeader title={t.askConfirm} />

      <section className="panel">
        <h2>{t.haveCode}</h2>
        <label className="sr-only" htmlFor="code">
          {t.codePlaceholder}
        </label>
        <textarea id="code" rows={3} value={codeText} placeholder={t.codePlaceholder} onChange={(e) => typeCode(e.target.value)} />
        <button
          type="button"
          className="big-button confirm"
          onClick={() => void applyCode()}
          disabled={codeDisabled}
          aria-disabled={codeDisabled}
        >
          <Icon icon={CircleCheck} />
          {t.applyCode}
        </button>
        {codeNotice && (
          <p className={codeMessage?.status === 'applied' ? 'notice success' : 'notice'} role="status">
            {codeNotice}
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
          {link ? (
            <a className="big-button whatsapp" href={link} target="_blank" rel="noreferrer">
              <Icon icon={MessageCircle} />
              {t.sendWhatsapp} ({days.length})
            </a>
          ) : (
            <>
              <button type="button" className="big-button whatsapp" disabled aria-disabled="true">
                <Icon icon={MessageCircle} />
                {t.sendWhatsapp} (0)
              </button>
              <p className="hint">{t.pickDays}</p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
