import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { deleteEntry, insertEntry, loadEntries, updateEntry as persistUpdate } from '@/lib/entriesRepo';
import type { Entry } from './types';

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

  const value = useMemo<AppState>(
    () => ({ entries, addEntry, updateEntry, removeEntry }),
    [entries, addEntry, updateEntry, removeEntry],
  );

  // Wait for the first load so screens never flash an empty list.
  if (!ready) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
