import type { Entry } from '@/state/types';
import { categoryOf } from '@/state/types';

const cell = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const pad = (n: number) => String(n).padStart(2, '0');

/** CSV for Excel/Sheets in pt-BR: ";" separator, decimal comma, dd/mm/aaaa dates, signed amounts. */
export function makeCsv(entries: Entry[]): string {
  const rows = ['Data;Tipo;Categoria;Descrição;Valor'];
  for (const e of entries) {
    const d = new Date(e.date);
    const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const value = ((e.kind === 'expense' ? -e.amount : e.amount) / 100).toFixed(2).replace('.', ',');
    rows.push([date, e.kind === 'expense' ? 'Gasto' : 'Entrada', categoryOf(e.category).label, e.note, value].map(cell).join(';'));
  }
  // BOM so Excel reads accents as UTF-8.
  return '﻿' + rows.join('\r\n');
}
