export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** "12,50" / "12.5" / "1.234,56" -> 1250 (cents). Returns null when invalid or not positive. */
export function parseMoney(text: string): number | null {
  let t = text.trim().replace(/[^\d.,]/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const value = Number(t);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** ISO date-time -> "dd/mm/aaaa" (local time). */
export function formatDateInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Keeps only digits and inserts the slashes while typing: "1611" -> "16/11". */
export function maskDateInput(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "dd/mm/aaaa" -> ISO date-time keeping the time of day of `base`. Null when not a real date. */
export function parseDateInput(text: string, base: Date): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(year, month - 1, day, base.getHours(), base.getMinutes(), base.getSeconds());
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d.toISOString();
}

/** Currency mask: only digits are kept and read as cents. "1234" -> "12,34", "123456" -> "1.234,56". Empty stays empty. */
export function maskMoneyInput(text: string): string {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
  if (!digits) return '';
  const padded = digits.padStart(3, '0');
  const cents = padded.slice(-2);
  const int = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${int},${cents}`;
}

/** Short money for chart axes: 950 -> "R$ 9,50"; 123400 -> "R$ 1,2 mil"; 250000000 -> "R$ 2,5 mi". */
export function formatCompact(cents: number): string {
  const v = cents / 100;
  const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  if (v >= 1_000_000) return `R$ ${fmt(v / 1_000_000)} mi`;
  if (v >= 1_000) return `R$ ${fmt(v / 1_000)} mil`;
  return `R$ ${fmt(v)}`;
}

/** "Hoje", "Ontem" or "12 de nov." for grouping lists by day. */
export function dayTitle(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86_400_000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}
