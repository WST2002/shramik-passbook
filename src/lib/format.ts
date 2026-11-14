import { BrickWall, Ellipsis, Hammer, HardHat, Paintbrush, Wrench, Zap, type LucideIcon } from 'lucide-react';
import type { WorkType } from './types';

export const WORK_ICONS: Record<WorkType, LucideIcon> = {
  mason: BrickWall,
  helper: HardHat,
  plumber: Wrench,
  painter: Paintbrush,
  carpenter: Hammer,
  electrician: Zap,
  other: Ellipsis,
};

export function rupees(amount: number, lang: string): string {
  return `₹${amount.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}`;
}
