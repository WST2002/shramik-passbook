import { contractorKey } from './ledger';
import type { ParsedEntry } from './parser';
import type { WorkEntry, WorkType } from './types';

export interface EntryFormState {
  date: string;
  workType?: WorkType;
  site: string;
  contractorName: string;
  contractorPhone: string;
  wageAgreed: string;
  wagePaid: string;
}

export function parsedPatch(form: EntryFormState, parsed: ParsedEntry, entries: WorkEntry[]): Partial<EntryFormState> {
  const patch: Partial<EntryFormState> = {};
  if (parsed.date) patch.date = parsed.date;
  if (parsed.workType) patch.workType = parsed.workType;
  if (parsed.site) patch.site = parsed.site;
  if (parsed.contractorName) {
    patch.contractorName = parsed.contractorName;
    const key = contractorKey(parsed.contractorName);
    if (key !== contractorKey(form.contractorName)) {
      const known = entries.find((e) => contractorKey(e.contractorName) === key && e.contractorPhone);
      patch.contractorPhone = known?.contractorPhone ?? '';
    }
  }
  if (parsed.contractorPhone) patch.contractorPhone = parsed.contractorPhone;
  if (parsed.wageAgreed !== undefined) patch.wageAgreed = String(parsed.wageAgreed);
  if (parsed.wagePaid !== undefined) patch.wagePaid = String(parsed.wagePaid);
  else if (parsed.wageAgreed !== undefined) patch.wagePaid = String(parsed.wageAgreed);
  return patch;
}

export type RequiredField = 'date' | 'workType' | 'site' | 'contractorName';
export type FieldProblem = 'missing' | 'future';

export function entryProblems(form: EntryFormState, today: string): Partial<Record<RequiredField, FieldProblem>> {
  const problems: Partial<Record<RequiredField, FieldProblem>> = {};
  if (!form.date) problems.date = 'missing';
  else if (form.date > today) problems.date = 'future';
  if (!form.workType) problems.workType = 'missing';
  if (!form.site.trim()) problems.site = 'missing';
  if (!form.contractorName.trim()) problems.contractorName = 'missing';
  return problems;
}
