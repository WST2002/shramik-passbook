import { useState } from 'react';
import { Icon } from '../components/ui';
import { useI18n } from '../i18n';
import { formatDate } from '../lib/dates';
import { appUrl, whatsappLink } from '../lib/device';
import { rupees, WORK_ICONS } from '../lib/format';
import { decodeRequest, encodeConfirmationCode } from '../lib/payload';

export function ContractorConfirm({ fragment }: { fragment: string }) {
  const { t, lang } = useI18n();
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const [request] = useState(() => decodeRequest(fragment));
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [code, setCode] = useState<string>();

  if (!request) {
    return (
      <main className="screen">
        <p className="error" role="alert">
          {t.confirmBadLink}
        </p>
      </main>
    );
  }

  const confirmedIds = request.days.filter((d) => !wrong.has(d.id)).map((d) => d.id);

  function toggle(id: string) {
    setWrong((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (code) {
    const reply = t.replyMessage(request.contractor, request.worker, confirmedIds.length, code, `${appUrl()}#code=${code}`);
    return (
      <main className="screen">
        <h1>{t.confirmTitle(request.worker)}</h1>
        <p className="notice">{t.confirmDone}</p>
        <p className="code-box">{code}</p>
        <a className="big-button whatsapp" href={whatsappLink(request.workerPhone ?? '', reply)} target="_blank" rel="noreferrer">
          <Icon>💬</Icon>
          {t.sendBack}
        </a>
        <p className="hint">{t.confirmPrivacy}</p>
      </main>
    );
  }

  return (
    <main className="screen">
      <h1>{t.confirmTitle(request.worker)}</h1>
      <p>{t.confirmIntro(request.contractor)}</p>
      <ul className="confirm-list">
        {request.days.map((day) => {
          const isWrong = wrong.has(day.id);
          return (
            <li key={day.id} className={isWrong ? 'confirm-day wrong' : 'confirm-day'}>
              <div>
                <Icon>{isWrong ? '✖' : '✔'}</Icon>
                <strong>{formatDate(day.date, locale)}</strong>
                <span className="muted">
                  <Icon>{WORK_ICONS[day.workType]}</Icon> {t.workTypes[day.workType]}
                  {day.site ? ` · ${day.site}` : ''} · {rupees(day.wage, lang)}
                </span>
              </div>
              <button type="button" className="small-button" aria-pressed={isWrong} onClick={() => toggle(day.id)}>
                {isWrong ? t.markRight : t.markWrong}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="big-button confirm"
        disabled={confirmedIds.length === 0}
        onClick={() => setCode(encodeConfirmationCode(confirmedIds))}
      >
        <Icon>👍</Icon>
        {t.confirmYes} ({confirmedIds.length})
      </button>
      {confirmedIds.length === 0 && <p className="hint">{t.confirmNothing}</p>}
      <p className="hint">{t.confirmPrivacy}</p>
    </main>
  );
}
