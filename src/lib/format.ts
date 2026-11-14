import type { WorkType } from './types';

export const WORK_ICONS: Record<WorkType, string> = {
  mason: '🧱',
  helper: '🏗️',
  plumber: '🔧',
  painter: '🖌️',
  carpenter: '🔨',
  electrician: '💡',
  other: '🛠️',
};

export function rupees(amount: number, lang: string): string {
  return `₹${amount.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}`;
}
