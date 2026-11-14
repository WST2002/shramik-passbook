import { del, get, set } from 'idb-keyval';
import { normalizeEntries } from './migrate';
import type { Profile, WorkEntry } from './types';

const ENTRIES_KEY = 'entries';
const PROFILE_KEY = 'shramik-passbook:profile';
const LANG_KEY = 'shramik-passbook:lang';

export type Lang = 'hi' | 'en';

export async function loadEntries(): Promise<WorkEntry[]> {
  return normalizeEntries(await get<unknown>(ENTRIES_KEY));
}

export async function saveEntries(entries: WorkEntry[]): Promise<void> {
  await set(ENTRIES_KEY, entries);
}

export async function savePhoto(id: string, blob: Blob): Promise<void> {
  await set(`photo:${id}`, blob);
}

export async function loadPhoto(id: string): Promise<Blob | undefined> {
  return get<Blob>(`photo:${id}`);
}

export async function deletePhoto(id: string): Promise<void> {
  await del(`photo:${id}`);
}

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null): boolean {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return readLocal(key) === value;
  } catch {
    return false;
  }
}

export function loadProfile(): Profile | undefined {
  const raw = readLocal(PROFILE_KEY);
  if (!raw) return undefined;
  try {
    const data = JSON.parse(raw) as Partial<Profile>;
    return typeof data.name === 'string' ? { name: data.name, phone: data.phone ?? '' } : undefined;
  } catch {
    return undefined;
  }
}

export function saveProfile(profile: Profile): boolean {
  return writeLocal(PROFILE_KEY, JSON.stringify(profile));
}

export function loadLang(): Lang {
  return readLocal(LANG_KEY) === 'en' ? 'en' : 'hi';
}

export function saveLang(lang: Lang): void {
  writeLocal(LANG_KEY, lang);
}

export async function deleteAllData(entries: WorkEntry[]): Promise<void> {
  await Promise.all(entries.filter((e) => e.photo).map((e) => deletePhoto(e.photo!.id)));
  await del(ENTRIES_KEY);
  writeLocal(PROFILE_KEY, null);
}
