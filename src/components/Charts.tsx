import { Text, View } from 'react-native';

import { formatMoney } from '@/lib/money';
import { categoryOf } from '@/state/types';
import { makeStyles, useColors, useTheme } from './theme';

/**
 * Categorical palette (validated set, fixed order). The color follows the category, never its rank,
 * so filtering or a new month never repaints a category. Always shown next to a text label.
 */
const SERIES: Record<'light' | 'dark', string[]> = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'],
};

const SLOT: Record<string, number> = {
  comida: 0,
  transporte: 1,
  moradia: 2,
  lazer: 3,
  saude: 4,
  compras: 5,
  outros: 6,
};

export function useCategoryColor() {
  const { scheme } = useTheme();
  return (id: string) => SERIES[scheme][SLOT[categoryOf(id).id] ?? 6];
}

/** One 100% bar split by category, 2px gaps, rounded only at the outer ends. */
export function CategoryStack({ data }: { data: [string, number][] }) {
  const styles = useStyles();
  const colorOf = useCategoryColor();
  if (data.length === 0) return null;
  const total = data.reduce((s, [, v]) => s + v, 0);
  const summary = data
    .map(([id, v]) => `${categoryOf(id).label} ${Math.round((v / total) * 100)}%`)
    .join(', ');
  return (
    <View style={styles.stack} accessible accessibilityRole="image" accessibilityLabel={`Gastos por categoria: ${summary}`}>
      {data.map(([id, value], i) => (
        <View
          key={id}
          style={{
            flex: value,
            backgroundColor: colorOf(id),
            borderTopLeftRadius: i === 0 ? 6 : 0,
            borderBottomLeftRadius: i === 0 ? 6 : 0,
            borderTopRightRadius: i === data.length - 1 ? 6 : 0,
            borderBottomRightRadius: i === data.length - 1 ? 6 : 0,
          }}
        />
      ))}
    </View>
  );
}

export type MonthPoint = { key: string; label: string; income: number; expense: number };

const CHART_H = 110;

/** Income vs expense for a few months. One shared axis; the selected month is emphasized. */
export function MonthlyBars({ data, selected }: { data: MonthPoint[]; selected: string }) {
  const styles = useStyles();
  const colors = useColors();
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const height = (v: number) => (v > 0 ? Math.max(3, (v / max) * CHART_H) : 0);
  const bar = (v: number, color: string, on: boolean) => ({
    height: height(v),
    backgroundColor: color,
    opacity: on ? 1 : 0.55,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  });
  const summary = data
    .map((d) => `${d.label}: entradas ${formatMoney(d.income)}, saídas ${formatMoney(d.expense)}`)
    .join('; ');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Entradas e saídas por mês. ${summary}`}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.income }]} />
          <Text style={styles.legendText}>Entradas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.expense }]} />
          <Text style={styles.legendText}>Saídas</Text>
        </View>
      </View>
      <View style={styles.plot}>
        {data.map((d) => {
          const on = d.key === selected;
          return (
            <View key={d.key} style={styles.col}>
              <View style={styles.pair}>
                <View style={[styles.bar, bar(d.income, colors.income, on)]} />
                <View style={[styles.bar, bar(d.expense, colors.expense, on)]} />
              </View>
              <Text style={[styles.monthLabel, on && styles.monthLabelOn]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  stack: { flexDirection: 'row', height: 16, gap: 2, marginVertical: 4 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_H + 22 },
  pair: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: CHART_H },
  bar: { width: 12 },
  monthLabel: { color: colors.muted, fontSize: 12, marginTop: 6, height: 16 },
  monthLabelOn: { color: colors.text, fontWeight: '800' },
}));
