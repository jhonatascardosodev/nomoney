export type Kind = 'expense' | 'income';

export type Category = { id: string; label: string; icon: string };

export const CATEGORIES: Category[] = [
  { id: 'comida', label: 'Comida', icon: 'restaurant' },
  { id: 'transporte', label: 'Transporte', icon: 'bus' },
  { id: 'moradia', label: 'Moradia', icon: 'home' },
  { id: 'lazer', label: 'Lazer', icon: 'game-controller' },
  { id: 'saude', label: 'Saúde', icon: 'medkit' },
  { id: 'compras', label: 'Compras', icon: 'bag' },
  { id: 'salario', label: 'Salário', icon: 'cash' },
  { id: 'outros', label: 'Outros', icon: 'ellipsis-horizontal' },
];

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
