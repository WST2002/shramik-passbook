import { ArrowRight, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { Icon } from '../components/ui';
import { useI18n } from '../i18n';
import type { Profile } from '../lib/types';

interface Props {
  onStart: (profile: Profile) => void;
  onDemo: () => void;
}

export function Welcome({ onStart, onDemo }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <main className="screen welcome">
      <img className="welcome-logo" src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" width="96" height="96" />
      <h1>{t.appName}</h1>
      <p className="tagline">{t.tagline}</p>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onStart({ name: name.trim(), phone: phone.replace(/[^\d+]/g, '') });
        }}
      >
        <h2>{t.welcomeTitle}</h2>
        <label htmlFor="welcome-name">{t.nameLabel}</label>
        <input id="welcome-name" value={name} autoComplete="name" required onChange={(e) => setName(e.target.value)} />
        <label htmlFor="welcome-phone">{t.phoneLabel}</label>
        <input id="welcome-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <p className="hint">{t.phoneHelp}</p>
        <button type="submit" className="big-button primary" disabled={!name.trim()}>
          <Icon icon={ArrowRight} />
          {t.start}
        </button>
      </form>
      <p className="hint">{t.privacyNote}</p>
      <button type="button" className="big-button secondary" onClick={onDemo}>
        <Icon icon={FlaskConical} />
        {t.tryDemo}
      </button>
    </main>
  );
}
