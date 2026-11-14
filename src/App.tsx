import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { Icon } from './components/ui';
import { dictionaries, I18nContext, type Dict } from './i18n';
import { localToday } from './lib/dates';
import { demoWorkers, type DemoWorker } from './lib/demo';
import { markConfirmed } from './lib/payload';
import {
  deleteAllData,
  deletePhoto,
  loadEntries,
  loadLang,
  loadProfile,
  saveEntries,
  saveLang,
  savePhoto,
  saveProfile,
  type Lang,
} from './lib/storage';
import type { Profile, WorkEntry } from './lib/types';
import { codeFromHash, isContractorPage, routeFromHash, type Route } from './routes';
import { AddEntry } from './screens/AddEntry';
import { ConfirmRequest } from './screens/ConfirmRequest';
import { ContractorConfirm } from './screens/ContractorConfirm';
import { DaysList } from './screens/DaysList';
import { Home } from './screens/Home';
import { Ledger } from './screens/Ledger';
import { Registration } from './screens/Registration';
import { mergeEntries, parseBackup } from './lib/backup';
import { Settings } from './screens/Settings';
import { Welcome } from './screens/Welcome';

const TAP_GUARD_MS = 350;

interface DemoState {
  index: number;
  workers: DemoWorker[];
}

export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang);
  const [hash, setHash] = useState(window.location.hash);
  const [profile, setProfile] = useState<Profile | undefined>(loadProfile);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const entriesRef = useRef<WorkEntry[]>([]);
  const writeQueue = useRef(Promise.resolve(true));
  const [loaded, setLoaded] = useState(false);
  const [storageBroken, setStorageBroken] = useState(false);
  const [demo, setDemo] = useState<DemoState>();
  const [toast, setToast] = useState<{ text: (t: Dict) => string }>();
  const navigated = useRef(false);
  const today = localToday();
  const t = dictionaries[lang];
  const contractorPage = isContractorPage(window.location.pathname);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (contractorPage) return;
    loadEntries()
      .then(
        (stored) => {
          entriesRef.current = stored;
          setEntries(stored);
        },
        () => setStorageBroken(true),
      )
      .finally(() => setLoaded(true));
  }, [contractorPage]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const go = useCallback((next: Route) => {
    navigated.current = true;
    window.location.hash = next === 'home' ? '' : `#/${next}`;
  }, []);

  const back = useCallback(() => {
    if (navigated.current) window.history.back();
    else go('home');
  }, [go]);

  const activeEntries = demo ? demo.workers[demo.index].entries : entries;
  const activeProfile = demo ? demo.workers[demo.index].profile : profile;

  const updateEntries = useCallback(
    (change: (current: WorkEntry[]) => WorkEntry[]): Promise<boolean> => {
      if (demo) {
        setDemo((d) =>
          d && { ...d, workers: d.workers.map((w, i) => (i === d.index ? { ...w, entries: change(w.entries) } : w)) },
        );
        return Promise.resolve(true);
      }
      const write = writeQueue.current.then(async () => {
        const next = change(entriesRef.current);
        try {
          if (storageBroken) throw new Error('storage unavailable');
          await saveEntries(next);
        } catch {
          setToast({ text: (d) => d.storageFailed });
          return false;
        }
        entriesRef.current = next;
        setEntries(next);
        return true;
      });
      writeQueue.current = write;
      return write;
    },
    [demo, storageBroken],
  );

  const code = codeFromHash(hash);
  const route: Route = code ? 'confirm' : routeFromHash(hash);
  const screenKey = `${activeProfile ? route : 'welcome'}:${demo ? demo.index : 'real'}`;
  const shownScreen = useRef(screenKey);
  const screenChangedAt = useRef(-Infinity);

  useEffect(() => {
    if (shownScreen.current === screenKey) return;
    shownScreen.current = screenKey;
    screenChangedAt.current = performance.now();
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [screenKey]);

  useEffect(() => {
    const ignoreGhostTap = (event: MouseEvent) => {
      if (event.detail > 0 && performance.now() - screenChangedAt.current < TAP_GUARD_MS) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('click', ignoreGhostTap, true);
    return () => document.removeEventListener('click', ignoreGhostTap, true);
  }, []);

  const i18n = useMemo(() => ({ t, lang }), [t, lang]);

  function toggleLang() {
    const next = lang === 'hi' ? 'en' : 'hi';
    setLang(next);
    saveLang(next);
  }

  const header = (showBack: boolean) => (
    <header className="app-header no-print">
      <span className="app-title">
        {showBack && (
          <button type="button" className="header-back" onClick={back} aria-label={t.back}>
            <Icon icon={ArrowLeft} />
          </button>
        )}
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="28" height="28" />
        {t.appName}
      </span>
      <button type="button" className="lang-button" onClick={toggleLang}>
        {t.langToggle}
      </button>
    </header>
  );

  if (contractorPage) {
    return (
      <I18nContext.Provider value={i18n}>
        {header(false)}
        <ContractorConfirm fragment={hash} />
      </I18nContext.Provider>
    );
  }

  function screen() {
    if (!activeProfile) {
      return (
        <Welcome
          onStart={(p) => {
            if (!saveProfile(p)) setToast({ text: (d) => d.storageFailed });
            setProfile(p);
          }}
          onDemo={() => setDemo({ index: 0, workers: demoWorkers(today) })}
        />
      );
    }
    switch (route) {
      case 'add':
        return (
          <AddEntry
            entries={activeEntries}
            today={today}
            onSave={async (entry, photo) => {
              let saved = entry;
              if (photo && entry.photo && !demo) {
                const stored = await savePhoto(entry.photo.id, photo).then(
                  () => true,
                  () => false,
                );
                if (!stored) saved = { ...entry, photo: undefined };
              }
              if (!(await updateEntries((current) => (current.some((e) => e.id === saved.id) ? current : [...current, saved])))) {
                return false;
              }
              setToast({ text: (d) => d.saved });
              back();
              return true;
            }}
          />
        );
      case 'days':
        return (
          <DaysList
            entries={activeEntries}
            demo={Boolean(demo)}
            onDelete={(id) => {
              const removed = activeEntries.find((e) => e.id === id);
              void updateEntries((current) => current.filter((e) => e.id !== id)).then((ok) => {
                if (!ok) return;
                if (removed?.photo && !demo) void deletePhoto(removed.photo.id).catch(() => undefined);
                setToast({ text: (d) => d.deleted });
              });
            }}
          />
        );
      case 'ledger':
        return <Ledger entries={activeEntries} />;
      case 'confirm':
        return (
          <ConfirmRequest
            key={code ?? 'confirm'}
            profile={activeProfile}
            entries={activeEntries}
            initialCode={code}
            onApplyCode={(ids) => updateEntries((current) => markConfirmed(current, ids, new Date().toISOString()).entries)}
          />
        );
      case 'register':
        return <Registration profile={activeProfile} entries={activeEntries} today={today} />;
      case 'settings':
        return (
          <Settings
            key={demo ? 'demo' : 'real'}
            profile={activeProfile}
            entries={activeEntries}
            today={today}
            demo={Boolean(demo)}
            onSaveProfile={(p) => {
              if (!saveProfile(p)) {
                setToast({ text: (d) => d.storageFailed });
                return;
              }
              setProfile(p);
              setToast({ text: (d) => d.saved });
            }}
            onBackupSaved={() => setToast({ text: (d) => d.backupSaved })}
            onDemo={(on) => setDemo(on ? { index: 0, workers: demoWorkers(today) } : undefined)}
            onRestore={async (text) => {
              try {
                const backup = parseBackup(text);
                let added = 0;
                const ok = await updateEntries((current) => {
                  const merged = mergeEntries(current, backup.entries);
                  added = merged.length - current.length;
                  return merged;
                });
                if (!ok) return;
                setToast({ text: (d) => (added ? d.backupRestored(added) : d.backupNothingNew) });
              } catch {
                setToast({ text: (d) => d.backupBad });
              }
            }}
            onDeleteAll={async () => {
              try {
                await deleteAllData(entriesRef.current);
              } catch {
                setToast({ text: (d) => d.storageFailed });
                return;
              }
              entriesRef.current = [];
              setEntries([]);
              setProfile(undefined);
              go('home');
            }}
          />
        );
      default:
        return <Home profile={activeProfile} entries={activeEntries} today={today} go={go} />;
    }
  }

  return (
    <I18nContext.Provider value={i18n}>
      {header(route !== 'home')}
      {demo && (
        <div className="demo-banner no-print" role="status">
          <p>
            <Icon icon={FlaskConical} size="sm" />
            {t.demoBanner}
          </p>
          <div className="demo-controls">
            <label htmlFor="demo-worker">{t.demoWorker}</label>
            <select
              id="demo-worker"
              value={demo.index}
              onChange={(e) => setDemo({ ...demo, index: Number(e.target.value) })}
            >
              {demo.workers.map((w, i) => (
                <option key={w.profile.name} value={i}>
                  {w.profile.name}
                </option>
              ))}
            </select>
            <button type="button" className="small-button" onClick={() => setDemo(undefined)}>
              {t.demoOff}
            </button>
          </div>
        </div>
      )}
      {storageBroken && !demo && (
        <p className="error storage-error no-print" role="alert">
          {t.storageFailed}
        </p>
      )}
      {loaded || demo ? screen() : null}
      {toast && (
        <p className="toast" role="status">
          {toast.text(t)}
        </p>
      )}
    </I18nContext.Provider>
  );
}
