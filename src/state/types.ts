export type Kind = 'expense' | 'income';

export type Category = { id: string; label: string; icon: string; kinds: Kind[] };

const EXPENSE: Kind[] = ['expense'];
const INCOME: Kind[] = ['income'];

export const CATEGORIES: Category[] = [
  { id: 'comida', label: 'Comida', icon: 'restaurant', kinds: EXPENSE },
  { id: 'transporte', label: 'Transporte', icon: 'bus', kinds: EXPENSE },
  { id: 'moradia', label: 'Moradia', icon: 'home', kinds: EXPENSE },
  { id: 'lazer', label: 'Lazer', icon: 'game-controller', kinds: EXPENSE },
  { id: 'saude', label: 'Saúde', icon: 'medkit', kinds: EXPENSE },
  { id: 'compras', label: 'Compras', icon: 'bag', kinds: EXPENSE },
  { id: 'salario', label: 'Salário', icon: 'cash', kinds: INCOME },
  { id: 'extra', label: 'Renda extra', icon: 'briefcase', kinds: INCOME },
  { id: 'investimentos', label: 'Investimentos', icon: 'trending-up', kinds: INCOME },
  { id: 'presente', label: 'Presente', icon: 'gift', kinds: INCOME },
  // Kept last: categoryOf falls back to it for unknown ids.
  { id: 'outros', label: 'Outros', icon: 'ellipsis-horizontal', kinds: ['expense', 'income'] },
];

export const categoriesFor = (kind: Kind) => CATEGORIES.filter((c) => c.kinds.includes(kind));

export const categoryOf = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

export type Entry = {
  id: string;
  kind: Kind;
  /** Amount in cents, always positive. */
  amount: number;
  category: string;
  note: string;
  /** ISO date-time. */
  date: string;
};
