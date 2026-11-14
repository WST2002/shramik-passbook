import { Download, FlaskConical, HardDriveDownload, HardDriveUpload, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Icon, ScreenHeader } from '../components/ui';
import { useI18n } from '../i18n';
import { makeBackup } from '../lib/backup';
import { exportCounts } from '../lib/counter';
import type { Profile, WorkEntry } from '../lib/types';

function saveFile(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface Props {
  profile: Profile;
  entries: WorkEntry[];
  today: string;
  demo: boolean;
  onSaveProfile: (profile: Profile) => void;
  onDemo: (on: boolean) => void;
  onDeleteAll: () => Promise<void>;
  onRestore: (text: string) => Promise<void>;
  onBackupSaved: () => void;
}

export function Settings({ profile, entries, today, demo, onSaveProfile, onDemo, onDeleteAll, onRestore, onBackupSaved }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [busy, setBusy] = useState<'restore' | 'delete'>();
  const edited = { name: name.trim(), phone: phone.replace(/[^\d+]/g, '') };
  const unchanged = edited.name === profile.name && edited.phone === profile.phone;
  const canSave = Boolean(edited.name) && !unchanged;
  const noDays = entries.length === 0;

  async function run(kind: 'restore' | 'delete', action: () => Promise<void>) {
    if (busy) return;
    setBusy(kind);
    try {
      await action();
    } finally {
      setBusy(undefined);
    }
  }

  function download() {
    saveFile(JSON.stringify(exportCounts(entries, today), null, 2), `shramik-passbook-summary-${today}.json`);
  }

  return (
    <main className="screen">
      <ScreenHeader title={t.settings} />

      {!demo && (
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) onSaveProfile(edited);
          }}
        >
          <h2>{t.profile}</h2>
          <label htmlFor="name">{t.nameLabel}</label>
          <input id="name" value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
          <label htmlFor="phone">{t.phoneLabel}</label>
          <input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <p className="hint">{t.phoneHelp}</p>
          <button type="submit" className="big-button primary" disabled={!canSave} aria-disabled={!canSave}>
            <Icon icon={Save} />
            {t.save}
          </button>
          {unchanged && <p className="hint">{t.profileUnchanged}</p>}
        </form>
      )}

      <section className="panel">
        <h2>{t.demoMode}</h2>
        <p className="hint">{t.demoHelp}</p>
        <button type="button" className="big-button secondary" onClick={() => onDemo(!demo)}>
          <Icon icon={FlaskConical} />
          {demo ? t.demoOff : t.demoOn}
        </button>
      </section>

      {!demo && (
        <section className="panel">
          <h2>{t.backupTitle}</h2>
          <p className="hint">{t.backupHelp}</p>
          <button
            type="button"
            className="big-button secondary"
            disabled={noDays}
            aria-disabled={noDays}
            onClick={() => {
              saveFile(makeBackup(profile, entries, new Date().toISOString()), `shramik-passbook-backup-${today}.json`);
              onBackupSaved();
            }}
          >
            <Icon icon={HardDriveDownload} />
            {t.backupSave}
          </button>
          {noDays && <p className="hint">{t.nothingToSave}</p>}
          <label className="big-button secondary file-button" aria-disabled={busy === 'restore'}>
            <Icon icon={HardDriveUpload} />
            {t.backupRestore}
            <input
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              disabled={busy === 'restore'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void run('restore', async () => onRestore(await file.text()));
              }}
            />
          </label>
        </section>
      )}

      {!demo && (
      <section className="panel">
        <h2>{t.exportTitle}</h2>
        <p className="hint">{t.exportHelp}</p>
        <button type="button" className="big-button secondary" onClick={download} disabled={noDays} aria-disabled={noDays}>
          <Icon icon={Download} />
          {t.exportButton}
        </button>
      </section>
      )}

      {!demo && (
        <section className="panel">
          <p className="hint">{t.privacyNote}</p>
          <button
            type="button"
            className="big-button danger"
            disabled={busy === 'delete'}
            onClick={() => {
              if (window.confirm(t.deleteAllConfirm)) void run('delete', onDeleteAll);
            }}
          >
            <Icon icon={Trash2} />
            {t.deleteAll}
          </button>
        </section>
      )}
    </main>
  );
}
