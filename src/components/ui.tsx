import { Camera, Check, Pencil, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { evidenceLevel, REQUIRED_DAYS } from '../lib/counter';
import { loadPhoto } from '../lib/storage';
import type { WorkEntry } from '../lib/types';

const ICON_SIZES = { sm: 18, md: 24, lg: 32 } as const;

export function Icon({ icon: Glyph, size = 'md' }: { icon: LucideIcon; size?: keyof typeof ICON_SIZES }) {
  return <Glyph className="icon" size={ICON_SIZES[size]} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" focusable="false" />;
}

export function ScreenHeader({ title }: { title: string }) {
  return (
    <div className="screen-header">
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
  const icon = level === 'confirmed' ? Check : level === 'photo' ? Camera : Pencil;
  return (
    <span className={`badge badge-${level}`}>
      <Icon icon={icon} size="sm" />
      {t.evidence[level]}
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
