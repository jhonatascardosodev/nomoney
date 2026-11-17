import type { Budgets, Recurring } from '@/state/types';
import { kvStorage } from './storage';

const BUDGETS_KEY = 'gastos.budgets';
const RECURRING_KEY = 'gastos.recurring';

function readJson(key: string): unknown {
  try {
    const raw = kvStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    kvStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Falha ao salvar configuração', err);
  }
}

export function loadBudgets(): Budgets {
  const data = readJson(BUDGETS_KEY);
  const out: Budgets = {};
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [k, v] of Object.entries(data)) if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return out;
}

export const saveBudgets = (b: Budgets) => write(BUDGETS_KEY, b);

export function loadRecurring(): Recurring[] {
  const data = readJson(RECURRING_KEY);
  if (!Array.isArray(data)) return [];
  return data.filter(
    (r): r is Recurring =>
      !!r &&
      typeof r.id === 'string' &&
      (r.kind === 'expense' || r.kind === 'income') &&
      typeof r.amount === 'number' &&
      r.amount > 0 &&
      typeof r.category === 'string' &&
      typeof r.note === 'string' &&
      Number.isInteger(r.day) &&
      r.day >= 1 &&
      r.day <= 31 &&
      typeof r.generatedUntil === 'string' &&
      /^\d{4}-\d{2}$/.test(r.generatedUntil),
  );
}

export const saveRecurring = (r: Recurring[]) => write(RECURRING_KEY, r);
