import { WORK_TYPES, type WorkType } from './types';

export interface ConfirmDay {
  id: string;
  date: string;
  site: string;
  workType: WorkType;
  wage: number;
}

export interface ConfirmRequest {
  v: 1;
  worker: string;
  workerPhone?: string;
  contractor: string;
  days: ConfirmDay[];
}

export type CodeResult = { ok: true; ids: string[] } | { ok: false; reason: 'format' | 'checksum' };

const ID_LENGTH = 6;
const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const CODE_PATTERN = /SP1-([0-9a-z]+)-([0-9a-z]{4})/i;

export function newEntryId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('');
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function encodeRequest(request: ConfirmRequest): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(request)));
}

function isConfirmDay(value: unknown): value is ConfirmDay {
  if (typeof value !== 'object' || value === null) return false;
  const day = value as Record<string, unknown>;
  return (
    typeof day.id === 'string' &&
    day.id.length === ID_LENGTH &&
    typeof day.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
    typeof day.site === 'string' &&
    WORK_TYPES.includes(day.workType as WorkType) &&
    typeof day.wage === 'number'
  );
}

export function decodeRequest(fragment: string): ConfirmRequest | undefined {
  try {
    const json = new TextDecoder().decode(fromBase64Url(fragment.replace(/^#/, '')));
    const data = JSON.parse(json) as Record<string, unknown>;
    if (data.v !== 1 || typeof data.worker !== 'string' || typeof data.contractor !== 'string') return undefined;
    if (!Array.isArray(data.days) || !data.days.every(isConfirmDay)) return undefined;
    if (data.workerPhone !== undefined && typeof data.workerPhone !== 'string') return undefined;
    return data as unknown as ConfirmRequest;
  } catch {
    return undefined;
  }
}

export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash % 36 ** 4).toString(36).padStart(4, '0');
}

export function encodeConfirmationCode(ids: string[]): string {
  const joined = ids.join('');
  return `SP1-${joined}-${checksum(joined)}`;
}

export function decodeConfirmationCode(code: string): CodeResult {
  const match = CODE_PATTERN.exec(code.trim());
  if (!match || match[1].length % ID_LENGTH !== 0) return { ok: false, reason: 'format' };
  const joined = match[1].toLowerCase();
  if (checksum(joined) !== match[2].toLowerCase()) return { ok: false, reason: 'checksum' };
  const ids: string[] = [];
  for (let i = 0; i < joined.length; i += ID_LENGTH) ids.push(joined.slice(i, i + ID_LENGTH));
  return { ok: true, ids };
}

export function findConfirmationCode(text: string): string | undefined {
  return CODE_PATTERN.exec(text)?.[0];
}
