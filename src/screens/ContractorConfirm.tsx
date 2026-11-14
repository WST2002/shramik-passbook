import { Check, MessageCircle, ThumbsUp, X } from 'lucide-react';
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
  const [sent, setSent] = useState(false);

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
        <p className="notice success" role="status">
          {t.confirmDone(confirmedIds.length)}
        </p>
        <p className="code-box">{code}</p>
        <a
          className="big-button whatsapp"
          href={whatsappLink(request.workerPhone ?? '', reply)}
          target="_blank"
          rel="noreferrer"
          onClick={() => setSent(true)}
        >
          <Icon icon={MessageCircle} />
          {sent ? t.sendBackAgain : t.sendBack}
        </a>
        {sent && (
          <p className="notice" role="status">
            {t.sentBack}
          </p>
        )}
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
                <span className="confirm-date">
                  <Icon icon={isWrong ? X : Check} />
                  <strong>{formatDate(day.date, locale)}</strong>
                </span>
                <span className="muted">
                  <Icon icon={WORK_ICONS[day.workType]} size="sm" /> {t.workTypes[day.workType]}
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
        onClick={() => setCode((current) => current ?? encodeConfirmationCode(confirmedIds))}
      >
        <Icon icon={ThumbsUp} />
        {t.confirmYes} ({confirmedIds.length})
      </button>
      {confirmedIds.length === 0 && <p className="hint">{t.confirmNothing}</p>}
      <p className="hint">{t.confirmPrivacy}</p>
    </main>
  );
}
