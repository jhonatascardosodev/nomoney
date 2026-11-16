import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { CategoryStack, MonthlyBars, useCategoryColor, type MonthPoint } from '@/components/Charts';
import { MonthBar } from '@/components/MonthBar';
import { makeStyles } from '@/components/theme';
import { formatMoney, monthKey, shiftMonth } from '@/lib/money';
import { useApp } from '@/state/AppContext';
import { categoryOf } from '@/state/types';

export default function Resumo() {
  const styles = useStyles();
  const { entries } = useApp();
  const [month, setMonth] = useState(() => monthKey(new Date()));

  const { income, expense, byCategory } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const totals = new Map<string, number>();
    for (const e of entries) {
      if (monthKey(new Date(e.date)) !== month) continue;
      if (e.kind === 'income') income += e.amount;
      else {
        expense += e.amount;
        totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
      }
    }
    const byCategory = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return { income, expense, byCategory };
  }, [entries, month]);

  // Last 6 months ending at the selected one.
  const history = useMemo<MonthPoint[]>(() => {
    const points = new Map<string, MonthPoint>();
    for (let i = 5; i >= 0; i--) {
      const key = shiftMonth(month, -i);
      const [y, m] = key.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      points.set(key, { key, label, income: 0, expense: 0 });
    }
    for (const e of entries) {
      const p = points.get(monthKey(new Date(e.date)));
      if (!p) continue;
      if (e.kind === 'income') p.income += e.amount;
      else p.expense += e.amount;
    }
    return [...points.values()];
  }, [entries, month]);
  const colorOf = useCategoryColor();

  const balance = income - expense;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <MonthBar month={month} onChange={setMonth} />

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Saldo do mês</Text>
        <Text style={styles.heroValue}>{formatMoney(balance)}</Text>
      </View>

      <View style={styles.pair}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Entradas</Text>
          <Text style={[styles.cardValue, styles.positive]}>{formatMoney(income)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Saídas</Text>
          <Text style={[styles.cardValue, styles.negative]}>{formatMoney(expense)}</Text>
        </View>
      </View>

      <Text style={styles.section}>Últimos 6 meses</Text>
      <MonthlyBars data={history} selected={month} />

      <Text style={styles.section}>Gastos por categoria</Text>
      <CategoryStack data={byCategory} />
      {byCategory.length === 0 ? (
        <Text style={styles.empty}>Nenhum gasto neste mês. Toque no + para adicionar.</Text>
      ) : (
        byCategory.map(([id, total]) => {
          const pct = expense > 0 ? (total / expense) * 100 : 0;
          return (
            <View key={id} style={styles.cat}>
              <View style={styles.catHead}>
                <View style={styles.catTitle}>
                  <View style={[styles.dot, { backgroundColor: colorOf(id) }]} />
                  <Text style={styles.catName}>{categoryOf(id).label}</Text>
                </View>
                <Text style={styles.catValue}>
                  {formatMoney(total)} · {pct.toFixed(pct > 0 && pct < 10 ? 1 : 0).replace('.', ',')}%
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colorOf(id) }]} />
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 16, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hero: { backgroundColor: colors.primary, borderRadius: 22, padding: 20 },
  heroLabel: { color: colors.background, opacity: 0.85, fontSize: 14, fontWeight: '600' },
  heroValue: { color: colors.background, fontSize: 34, fontWeight: '800', marginTop: 4 },
  pair: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  positive: { color: colors.income },
  negative: { color: colors.expense },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 8 },
  empty: { color: colors.muted, fontSize: 14 },
  cat: { gap: 6 },
  catHead: { flexDirection: 'row', justifyContent: 'space-between' },
  catTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  catName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  catValue: { color: colors.muted, fontSize: 14 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
}));
