import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { deleteEntry, insertEntry, loadEntries, updateEntry as persistUpdate } from '@/lib/entriesRepo';
import type { Entry } from './types';

type AppState = {
  entries: Entry[];
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  updateEntry: (id: string, entry: Omit<Entry, 'id'>) => void;
  removeEntry: (id: string) => void;
  /** Adds entries whose id is not present yet. Returns how many were added. */
  importEntries: (list: Entry[]) => number;
};

const AppContext = createContext<AppState>({
  entries: [],
  addEntry: () => {},
  updateEntry: () => {},
  removeEntry: () => {},
  importEntries: () => 0,
});

const byDateDesc = (a: Entry, b: Entry) => b.date.localeCompare(a.date);

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadEntries()
      .then((loaded) => {
        if (!cancelled) setEntries(loaded);
      })
      .catch((err) => console.warn('Falha ao carregar lançamentos', err))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((task: Promise<void>) => {
    task.catch((err) => console.warn('Falha ao salvar lançamento', err));
  }, []);

  const addEntry = useCallback<AppState['addEntry']>(
    (entry) => {
      const full: Entry = { ...entry, id: newId() };
      setEntries((cur) => [full, ...cur].sort(byDateDesc));
      persist(insertEntry(full));
    },
    [persist],
  );

  const updateEntry = useCallback<AppState['updateEntry']>(
    (id, entry) => {
      const full: Entry = { ...entry, id };
      setEntries((cur) => cur.map((e) => (e.id === id ? full : e)).sort(byDateDesc));
      persist(persistUpdate(full));
    },
    [persist],
  );

  const removeEntry = useCallback<AppState['removeEntry']>(
    (id) => {
      setEntries((cur) => cur.filter((e) => e.id !== id));
      persist(deleteEntry(id));
    },
    [persist],
  );

  const importEntries = useCallback<AppState['importEntries']>(
    (list) => {
      const known = new Set(entries.map((e) => e.id));
      const fresh = list.filter((e, i) => !known.has(e.id) && list.findIndex((x) => x.id === e.id) === i);
      if (fresh.length === 0) return 0;
      setEntries((cur) => [...cur, ...fresh].sort(byDateDesc));
      // Sequential so a failure stops early instead of racing.
      persist(
        fresh.reduce<Promise<void>>((chain, e) => chain.then(() => insertEntry(e)), Promise.resolve()),
      );
      return fresh.length;
    },
    [entries, persist],
  );

  const value = useMemo<AppState>(
    () => ({ entries, addEntry, updateEntry, removeEntry, importEntries }),
    [entries, addEntry, updateEntry, removeEntry, importEntries],
  );

  // Wait for the first load so screens never flash an empty list.
  if (!ready) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
