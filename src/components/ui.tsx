import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { evidenceLevel, REQUIRED_DAYS } from '../lib/counter';
import { loadPhoto } from '../lib/storage';
import type { WorkEntry } from '../lib/types';

export function Icon({ children }: { children: string }) {
  return (
    <span className="icon" aria-hidden="true">
      {children}
    </span>
  );
}

export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { t } = useI18n();
  return (
    <div className="screen-header">
      <button type="button" className="back-button" onClick={onBack} aria-label={t.back}>
        <Icon>←</Icon>
      </button>
      <h1>{title}</h1>
    </div>
  );
}

export function ProgressRing({ confirmed, total }: { confirmed: number; total: number }) {
  const { t } = useI18n();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const confirmedPart = Math.min(confirmed, REQUIRED_DAYS) / REQUIRED_DAYS;
  const totalPart = Math.min(total, REQUIRED_DAYS) / REQUIRED_DAYS;
  return (
    <svg className="ring" viewBox="0 0 180 180" role="img" aria-label={`${confirmed} ${t.confirmedDays}, ${total} ${t.totalDays}`}>
      <circle cx="90" cy="90" r={radius} className="ring-track" />
      <circle
        cx="90"
        cy="90"
        r={radius}
        className="ring-reported"
        strokeDasharray={`${totalPart * circumference} ${circumference}`}
      />
      <circle
        cx="90"
        cy="90"
        r={radius}
        className="ring-confirmed"
        strokeDasharray={`${confirmedPart * circumference} ${circumference}`}
      />
      <text x="90" y="88" className="ring-number">
        {confirmed}
      </text>
      <text x="90" y="116" className="ring-label">
        {t.ofRequired}
      </text>
    </svg>
  );
}

export function EvidenceBadge({ entry }: { entry: WorkEntry }) {
  const { t } = useI18n();
  const level = evidenceLevel(entry);
  const icon = level === 'confirmed' ? '✔' : level === 'photo' ? '📷' : '✎';
  return (
    <span className={`badge badge-${level}`}>
      <Icon>{icon}</Icon> {t.evidence[level]}
    </span>
  );
}

export function PhotoThumb({ photoId, demo }: { photoId: string; demo: boolean }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (demo) return;
    let objectUrl: string | undefined;
    loadPhoto(photoId).then((blob) => {
      if (!blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId, demo]);
  if (!url) return null;
  return <img className="thumb" src={url} alt="" />;
}
