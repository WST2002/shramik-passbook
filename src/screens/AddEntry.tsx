import { Camera, MapPin, Mic, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { getAgent } from '../agent';
import { Icon, ScreenHeader } from '../components/ui';
import { useI18n } from '../i18n';
import { compressPhoto, currentPosition, isSpeechSupported, listenOnce } from '../lib/device';
import { WORK_ICONS } from '../lib/format';
import type { ParsedEntry } from '../lib/parser';
import { newEntryId } from '../lib/payload';
import { WORK_TYPES, type GeoPoint, type WorkEntry, type WorkType } from '../lib/types';

interface Props {
  entries: WorkEntry[];
  today: string;
  onSave: (entry: WorkEntry, photo?: Blob) => Promise<void>;
  onBack: () => void;
}

interface FormState {
  date: string;
  workType?: WorkType;
  site: string;
  contractorName: string;
  contractorPhone: string;
  wageAgreed: string;
  wagePaid: string;
}

function initialForm(entries: WorkEntry[], today: string): FormState {
  const last = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return {
    date: today,
    workType: last?.workType,
    site: last?.site ?? '',
    contractorName: last?.contractorName ?? '',
    contractorPhone: last?.contractorPhone ?? '',
    wageAgreed: last ? String(last.wageAgreed) : '',
    wagePaid: last ? String(last.wageAgreed) : '',
  };
}

export function AddEntry({ entries, today, onSave, onBack }: Props) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState(() => initialForm(entries, today));
  const [filled, setFilled] = useState<Set<keyof FormState>>(new Set());
  const [heard, setHeard] = useState('');
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');
  const [gps, setGps] = useState<GeoPoint>();
  const [gpsStatus, setGpsStatus] = useState('');
  const [photo, setPhoto] = useState<{ blob: Blob; gps?: GeoPoint; takenAt: string }>();
  const [error, setError] = useState('');

  const contractors = [...new Set(entries.map((e) => e.contractorName))];
  const sites = [...new Set(entries.map((e) => e.site).filter(Boolean))];

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  async function applyText(text: string) {
    if (!text.trim()) return;
    const parsed: ParsedEntry = await getAgent().parse(text, today);
    const patch: Partial<FormState> = {};
    if (parsed.date) patch.date = parsed.date;
    if (parsed.workType) patch.workType = parsed.workType;
    if (parsed.site) patch.site = parsed.site;
    if (parsed.contractorName) {
      patch.contractorName = parsed.contractorName;
      const known = entries.find((e) => e.contractorName === parsed.contractorName && e.contractorPhone);
      if (known && !parsed.contractorPhone) patch.contractorPhone = known.contractorPhone;
    }
    if (parsed.contractorPhone) patch.contractorPhone = parsed.contractorPhone;
    if (parsed.wageAgreed !== undefined) patch.wageAgreed = String(parsed.wageAgreed);
    if (parsed.wagePaid !== undefined) patch.wagePaid = String(parsed.wagePaid);
    update(patch);
    setFilled(new Set(Object.keys(patch) as (keyof FormState)[]));
    setMessage(Object.keys(patch).length ? t.checkParsed : t.voiceFailed);
  }

  async function speak() {
    setListening(true);
    setMessage('');
    try {
      const text = await listenOnce(lang === 'hi' ? 'hi-IN' : 'en-IN');
      setHeard(text);
      if (text) await applyText(text);
      else setMessage(t.voiceFailed);
    } catch {
      setMessage(t.voiceFailed);
    } finally {
      setListening(false);
    }
  }

  async function addGps() {
    const point = await currentPosition();
    setGps(point);
    setGpsStatus(point ? t.gpsAdded : t.gpsFailed);
  }

  async function addPhoto(file: File | undefined) {
    if (!file) return;
    const [blob, point] = await Promise.all([compressPhoto(file), currentPosition()]);
    setPhoto({ blob, gps: point, takenAt: new Date().toISOString() });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.date || !form.workType || !form.contractorName.trim()) {
      setError(t.required);
      return;
    }
    const agreed = Number(form.wageAgreed) || 0;
    const entry: WorkEntry = {
      id: newEntryId(),
      date: form.date,
      workType: form.workType,
      site: form.site.trim(),
      gps,
      contractorName: form.contractorName.trim(),
      contractorPhone: form.contractorPhone.replace(/[^\d+]/g, ''),
      wageAgreed: agreed,
      wagePaid: form.wagePaid === '' ? agreed : Number(form.wagePaid) || 0,
      photo: photo ? { id: newEntryId(), takenAt: photo.takenAt, gps: photo.gps } : undefined,
      createdAt: new Date().toISOString(),
    };
    await onSave(entry, photo?.blob);
  }

  const cls = (field: keyof FormState) => (filled.has(field) ? 'field filled' : 'field');

  return (
    <main className="screen">
      <ScreenHeader title={t.addToday} onBack={onBack} />

      <section className="voice-box">
        {isSpeechSupported() ? (
          <button type="button" className="big-button voice" onClick={speak} disabled={listening}>
            <Icon icon={Mic} />
            {listening ? t.listening : t.speak}
          </button>
        ) : (
          <p className="hint">{t.voiceUnsupported}</p>
        )}
        <p className="hint">{t.speakExample}</p>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            void applyText(heard);
          }}
        >
          <label className="sr-only" htmlFor="heard">
            {t.typeInstead}
          </label>
          <input id="heard" value={heard} placeholder={t.typeInstead} onChange={(e) => setHeard(e.target.value)} />
          <button type="submit" className="small-button">
            {t.fillFromText}
          </button>
        </form>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </section>

      <form className="entry-form" onSubmit={submit} noValidate>
        <div className={cls('date')}>
          <label htmlFor="date">{t.date}</label>
          <input id="date" type="date" value={form.date} max={today} onChange={(e) => update({ date: e.target.value })} />
        </div>

        <fieldset className={cls('workType')}>
          <legend>{t.workType}</legend>
          <div className="work-grid">
            {WORK_TYPES.map((type) => (
              <label key={type} className={form.workType === type ? 'work-option selected' : 'work-option'}>
                <input
                  type="radio"
                  name="workType"
                  value={type}
                  checked={form.workType === type}
                  onChange={() => update({ workType: type })}
                />
                <Icon icon={WORK_ICONS[type]} size="lg" />
                <span>{t.workTypes[type]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={cls('site')}>
          <label htmlFor="site">{t.site}</label>
          <input id="site" list="site-list" value={form.site} placeholder={t.sitePlaceholder} onChange={(e) => update({ site: e.target.value })} />
          <datalist id="site-list">
            {sites.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button type="button" className="small-button" onClick={addGps}>
            <Icon icon={MapPin} size="sm" />
            {t.addGps}
          </button>
          {gpsStatus && <span className="hint">{gpsStatus}</span>}
        </div>

        <div className={cls('contractorName')}>
          <label htmlFor="contractor">{t.contractor}</label>
          <input
            id="contractor"
            list="contractor-list"
            value={form.contractorName}
            onChange={(e) => update({ contractorName: e.target.value })}
          />
          <datalist id="contractor-list">
            {contractors.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className={cls('contractorPhone')}>
          <label htmlFor="contractor-phone">{t.contractorPhone}</label>
          <input
            id="contractor-phone"
            type="tel"
            inputMode="tel"
            value={form.contractorPhone}
            onChange={(e) => update({ contractorPhone: e.target.value })}
          />
        </div>

        <div className="money-row">
          <div className={cls('wageAgreed')}>
            <label htmlFor="agreed">{t.wageAgreed}</label>
            <input id="agreed" type="number" inputMode="numeric" min="0" value={form.wageAgreed} onChange={(e) => update({ wageAgreed: e.target.value })} />
          </div>
          <div className={cls('wagePaid')}>
            <label htmlFor="paid">{t.wagePaid}</label>
            <input id="paid" type="number" inputMode="numeric" min="0" value={form.wagePaid} onChange={(e) => update({ wagePaid: e.target.value })} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="photo" className="photo-label">
            <Icon icon={Camera} />
            {t.photo}
          </label>
          <p className="hint">{t.photoRule}</p>
          <input id="photo" type="file" accept="image/*" capture="environment" onChange={(e) => void addPhoto(e.target.files?.[0])} />
          {photo && <span className="hint">{t.photoAdded}</span>}
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="big-button primary">
          <Icon icon={Save} />
          {t.save}
        </button>
      </form>
    </main>
  );
}
