import { useState } from 'react';
import { Icon, ScreenHeader } from '../components/ui';
import { useI18n } from '../i18n';
import { exportCounts } from '../lib/counter';
import type { Profile, WorkEntry } from '../lib/types';

interface Props {
  profile: Profile;
  entries: WorkEntry[];
  today: string;
  demo: boolean;
  onSaveProfile: (profile: Profile) => void;
  onDemo: (on: boolean) => void;
  onDeleteAll: () => void;
  onBack: () => void;
}

export function Settings({ profile, entries, today, demo, onSaveProfile, onDemo, onDeleteAll, onBack }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);

  function download() {
    const blob = new Blob([JSON.stringify(exportCounts(entries, today), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shramik-passbook-summary-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="screen">
      <ScreenHeader title={t.settings} onBack={onBack} />

      {!demo && (
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSaveProfile({ name: name.trim(), phone: phone.replace(/[^\d+]/g, '') });
          }}
        >
          <h2>{t.profile}</h2>
          <label htmlFor="name">{t.nameLabel}</label>
          <input id="name" value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
          <label htmlFor="phone">{t.phoneLabel}</label>
          <input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <p className="hint">{t.phoneHelp}</p>
          <button type="submit" className="big-button primary">
            <Icon>💾</Icon>
            {t.save}
          </button>
        </form>
      )}

      <section className="panel">
        <h2>{t.demoMode}</h2>
        <p className="hint">{t.demoHelp}</p>
        <button type="button" className="big-button secondary" onClick={() => onDemo(!demo)}>
          <Icon>🧪</Icon>
          {demo ? t.demoOff : t.demoOn}
        </button>
      </section>

      <section className="panel">
        <h2>{t.exportTitle}</h2>
        <p className="hint">{t.exportHelp}</p>
        <button type="button" className="big-button secondary" onClick={download}>
          <Icon>⬇️</Icon>
          {t.exportButton}
        </button>
      </section>

      {!demo && (
        <section className="panel">
          <p className="hint">{t.privacyNote}</p>
          <button
            type="button"
            className="big-button danger"
            onClick={() => {
              if (window.confirm(t.deleteAllConfirm)) onDeleteAll();
            }}
          >
            <Icon>🗑️</Icon>
            {t.deleteAll}
          </button>
        </section>
      )}
    </main>
  );
}
