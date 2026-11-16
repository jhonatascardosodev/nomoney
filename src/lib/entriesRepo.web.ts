import type { Entry } from '@/state/types';
import { parseEntries } from './parseEntries';

/** Web storage: JSON in localStorage (expo-sqlite on web is still experimental). Same API as entriesRepo.ts. */

const KEY = 'gastos.entries';
const CORRUPT_KEY = 'gastos.entries.corrupt';

const memory = new Map<string, string>();
const store = {
  getItem: (k: string) =>
    typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(k) : (memory.get(k) ?? null),
  setItem: (k: string, v: string) =>
    typeof window !== 'undefined' && window.localStorage ? window.localStorage.setItem(k, v) : void memory.set(k, v),
};

let cache: Entry[] | null = null;

function read(): Entry[] {
  if (cache) return cache;
  const raw = store.getItem(KEY);
  if (raw === null) return (cache = []);
  try {
    return (cache = parseEntries(raw));
  } catch {
    // Unreadable: keep a copy so the next save does not destroy it.
    store.setItem(CORRUPT_KEY, raw);
    return (cache = []);
  }
}

function write(entries: Entry[]) {
  cache = entries;
  store.setItem(KEY, JSON.stringify(entries));
}

export async function loadEntries(): Promise<Entry[]> {
  return [...read()].sort((a, b) => b.date.localeCompare(a.date));
}

export async function insertEntry(e: Entry): Promise<void> {
  write([...read(), e]);
}

export async function updateEntry(e: Entry): Promise<void> {
  write(read().map((x) => (x.id === e.id ? e : x)));
}

export async function deleteEntry(id: string): Promise<void> {
  write(read().filter((x) => x.id !== id));
}
