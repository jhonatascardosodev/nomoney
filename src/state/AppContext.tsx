import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { deleteEntry, insertEntry, loadEntries, updateEntry as persistUpdate } from '@/lib/entriesRepo';
import { dueEntries, initialGeneratedUntil } from '@/lib/recurring';
import { loadBudgets, loadRecurring, saveBudgets, saveRecurring } from '@/lib/settings';
import type { Budgets, Entry, Recurring } from './types';

type AppState = {
  entries: Entry[];
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  updateEntry: (id: string, entry: Omit<Entry, 'id'>) => void;
  removeEntry: (id: string) => void;
  /** Adds entries whose id is not present yet. Returns how many were added. */
  importEntries: (list: Entry[]) => number;
  budgets: Budgets;
  /** Sets the monthly limit (cents) of a category; null removes it. */
  setBudget: (category: string, amount: number | null) => void;
  recurring: Recurring[];
  addRecurring: (rule: Omit<Recurring, 'id' | 'generatedUntil'>) => void;
  removeRecurring: (id: string) => void;
};

const AppContext = createContext<AppState>({
  entries: [],
  addEntry: () => {},
  updateEntry: () => {},
  removeEntry: () => {},
  importEntries: () => 0,
  budgets: {},
  setBudget: () => {},
  recurring: [],
  addRecurring: () => {},
  removeRecurring: () => {},
});

const byDateDesc = (a: Entry, b: Entry) => b.date.localeCompare(a.date);

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [budgets, setBudgets] = useState<Budgets>(loadBudgets);
  const [recurring, setRecurring] = useState<Recurring[]>(loadRecurring);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadEntries()
      .then(async (loaded) => {
        // Create the entries of recurring rules that became due while the app was closed.
        const now = new Date();
        const known = new Set(loaded.map((e) => e.id));
        const fresh: Entry[] = [];
        const rules = loadRecurring().map((rule) => {
          const due = dueEntries(rule, now);
          for (const e of due.entries) if (!known.has(e.id)) fresh.push(e);
          return { ...rule, generatedUntil: due.generatedUntil };
        });
        let merged = loaded;
        if (fresh.length > 0) {
          for (const e of fresh) await insertEntry(e);
          merged = [...loaded, ...fresh].sort(byDateDesc);
          saveRecurring(rules);
        }
        if (!cancelled) {
          setEntries(merged);
          if (fresh.length > 0) setRecurring(rules);
        }
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

  const setBudget = useCallback<AppState['setBudget']>((category, amount) => {
    setBudgets((cur) => {
      const next = { ...cur };
      if (amount && amount > 0) next[category] = amount;
      else delete next[category];
      saveBudgets(next);
      return next;
    });
  }, []);

  const addRecurring = useCallback<AppState['addRecurring']>((rule) => {
    const full: Recurring = { ...rule, id: newId(), generatedUntil: initialGeneratedUntil(rule.day) };
    setRecurring((cur) => {
      const next = [...cur, full];
      saveRecurring(next);
      return next;
    });
  }, []);

  const removeRecurring = useCallback<AppState['removeRecurring']>((id) => {
    setRecurring((cur) => {
      const next = cur.filter((r) => r.id !== id);
      saveRecurring(next);
      return next;
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      entries,
      addEntry,
      updateEntry,
      removeEntry,
      importEntries,
      budgets,
      setBudget,
      recurring,
      addRecurring,
      removeRecurring,
    }),
    [entries, addEntry, updateEntry, removeEntry, importEntries, budgets, setBudget, recurring, addRecurring, removeRecurring],
  );

  // Wait for the first load so screens never flash an empty list.
  if (!ready) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
