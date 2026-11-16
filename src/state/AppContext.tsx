import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { authStorage } from '@/lib/storage';
import type { Entry } from './types';

const STORAGE_KEY = 'gastos.entries';

type AppState = {
  entries: Entry[];
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  updateEntry: (id: string, entry: Omit<Entry, 'id'>) => void;
  removeEntry: (id: string) => void;
};

const AppContext = createContext<AppState>({
  entries: [],
  addEntry: () => {},
  updateEntry: () => {},
  removeEntry: () => {},
});

function load(): Entry[] {
  try {
    const raw = authStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: Entry[]) {
  try {
    authStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Not saved; entries still live until the app closes.
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>(load);

  const update = useCallback((fn: (current: Entry[]) => Entry[]) => {
    setEntries((current) => {
      const next = fn(current);
      save(next);
      return next;
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      entries,
      addEntry: (entry) =>
        update((cur) =>
          [{ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }, ...cur].sort((a, b) =>
            b.date.localeCompare(a.date),
          ),
        ),
      updateEntry: (id, entry) =>
        update((cur) => cur.map((e) => (e.id === id ? { ...entry, id } : e)).sort((a, b) => b.date.localeCompare(a.date))),
      removeEntry: (id) => update((cur) => cur.filter((e) => e.id !== id)),
    }),
    [entries, update],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
