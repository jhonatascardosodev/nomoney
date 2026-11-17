import type { Entry, Recurring } from '@/state/types';
import { monthKey, shiftMonth } from './money';

/** Date of the occurrence in `month` ("YYYY-MM"), clamped to the month length, at noon local time. */
export function occurrenceDate(month: string, day: number): Date {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return new Date(y, m - 1, Math.min(day, last), 12, 0, 0);
}

/** Deterministic id: generating the same month twice can never duplicate an entry. */
export const recurringEntryId = (ruleId: string, month: string) => `rec-${ruleId}-${month}`;

/** First month still to generate when a rule is created today: this month if the day is still ahead, else next. */
export function initialGeneratedUntil(day: number, now = new Date()): string {
  const current = monthKey(now);
  return occurrenceDate(current, day).getTime() > now.getTime() ? shiftMonth(current, -1) : current;
}

/** Entries that became due since `rule.generatedUntil`, up to `now`. */
export function dueEntries(rule: Recurring, now = new Date()): { entries: Entry[]; generatedUntil: string } {
  const entries: Entry[] = [];
  let until = rule.generatedUntil;
  const current = monthKey(now);
  // Guard against a corrupt value looping forever.
  for (let i = 0; i < 600 && until < current; i++) {
    const next = shiftMonth(until, 1);
    const when = occurrenceDate(next, rule.day);
    if (when.getTime() > now.getTime()) break;
    entries.push({
      id: recurringEntryId(rule.id, next),
      kind: rule.kind,
      amount: rule.amount,
      category: rule.category,
      note: rule.note,
      date: when.toISOString(),
    });
    until = next;
  }
  return { entries, generatedUntil: until };
}
