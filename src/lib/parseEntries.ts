import type { Entry } from '@/state/types';

function isEntry(v: unknown): v is Entry {
  if (!v || typeof v !== 'object') return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    (e.kind === 'expense' || e.kind === 'income') &&
    typeof e.amount === 'number' &&
    Number.isFinite(e.amount) &&
    e.amount > 0 &&
    typeof e.category === 'string' &&
    typeof e.note === 'string' &&
    typeof e.date === 'string' &&
    !Number.isNaN(new Date(e.date).getTime())
  );
}

/** Parses the legacy JSON blob. Throws when it is not a JSON array; drops individual invalid items. */
export function parseEntries(raw: string): Entry[] {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('entries is not an array');
  return data.filter(isEntry);
}
