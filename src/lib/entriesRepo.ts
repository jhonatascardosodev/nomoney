import 'expo-sqlite/localStorage/install';
import * as SQLite from 'expo-sqlite';

import type { Entry } from '@/state/types';
import { parseEntries } from './parseEntries';

/** Native (Android/iOS) storage: one SQLite table. Web uses entriesRepo.web.ts. */

const LEGACY_KEY = 'gastos.entries';
const LEGACY_CORRUPT_KEY = 'gastos.entries.corrupt';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  dbPromise ??= open();
  return dbPromise;
}

async function open() {
  const db = await SQLite.openDatabaseAsync('gastos.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
      amount INTEGER NOT NULL CHECK (amount > 0),
      category TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS entries_date ON entries (date);
  `);
  await migrateLegacy(db);
  return db;
}

/** Moves entries saved by the old version (JSON in localStorage) into the table, once. */
async function migrateLegacy(db: SQLite.SQLiteDatabase) {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (raw === null) return;
  let legacy: Entry[];
  try {
    legacy = parseEntries(raw);
  } catch {
    // Unreadable: keep a copy instead of losing it.
    localStorage.setItem(LEGACY_CORRUPT_KEY, raw);
    localStorage.removeItem(LEGACY_KEY);
    return;
  }
  await db.withTransactionAsync(async () => {
    for (const e of legacy) {
      await db.runAsync(
        'INSERT OR IGNORE INTO entries (id, kind, amount, category, note, date) VALUES (?, ?, ?, ?, ?, ?)',
        e.id,
        e.kind,
        e.amount,
        e.category,
        e.note,
        e.date,
      );
    }
  });
  // Only after the commit succeeded, so a failure retries on next launch.
  localStorage.removeItem(LEGACY_KEY);
}

export async function loadEntries(): Promise<Entry[]> {
  const db = await getDb();
  return db.getAllAsync<Entry>('SELECT id, kind, amount, category, note, date FROM entries ORDER BY date DESC');
}

export async function insertEntry(e: Entry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO entries (id, kind, amount, category, note, date) VALUES (?, ?, ?, ?, ?, ?)',
    e.id,
    e.kind,
    e.amount,
    e.category,
    e.note,
    e.date,
  );
}

export async function updateEntry(e: Entry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE entries SET kind = ?, amount = ?, category = ?, note = ?, date = ? WHERE id = ?',
    e.kind,
    e.amount,
    e.category,
    e.note,
    e.date,
    e.id,
  );
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', id);
}
