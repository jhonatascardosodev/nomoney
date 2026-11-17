import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { CategoryDonut, MonthlyBars, useCategoryColor, type MonthPoint } from '@/components/Charts';
import { Fab } from '@/components/Fab';
import { MonthBar } from '@/components/MonthBar';
import { cardShadow, makeStyles, useColors } from '@/components/theme';
import { formatMoney, monthKey, monthLabel, shiftMonth } from '@/lib/money';
import { useApp } from '@/state/AppContext';
import { categoryOf } from '@/state/types';

export default function Resumo() {
  const styles = useStyles();
  const colors = useColors();
  const { entries, budgets } = useApp();
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const colorOf = useCategoryColor();

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

  const balance = income - expense;

  // history ends at the selected month, so the one before it is the previous month.
  const prevExpense = history[history.length - 2]?.expense ?? 0;
  const prevName = monthLabel(shiftMonth(month, -1)).split(' ')[0].toLowerCase();
  const comparison = (() => {
    if (prevExpense === 0) return null;
    const diff = ((expense - prevExpense) / prevExpense) * 100;
    if (Math.abs(diff) < 0.5) return `Gastos iguais aos de ${prevName}`;
    const pct = Math.abs(diff).toFixed(0);
    return diff > 0 ? `Você gastou ${pct}% a mais que em ${prevName}` : `Você gastou ${pct}% a menos que em ${prevName}`;
  })();
  const hasHistory = history.some((h) => h.income > 0 || h.expense > 0);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <MonthBar month={month} onChange={setMonth} />

        <LinearGradient
          colors={['#0F766E', '#0B4F4A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <Text style={styles.heroLabel}>Saldo de {monthLabel(month).split(' ')[0].toLowerCase()}</Text>
          <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(balance)}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroPill}>
              <View style={[styles.heroIcon, { backgroundColor: 'rgba(74, 222, 128, 0.25)' }]}>
                <Ionicons name="arrow-down" size={14} color="#86EFAC" />
              </View>
              <View>
                <Text style={styles.heroPillLabel}>Entradas</Text>
                <Text style={styles.heroPillValue}>{formatMoney(income)}</Text>
              </View>
            </View>
            <View style={styles.heroPill}>
              <View style={[styles.heroIcon, { backgroundColor: 'rgba(255, 93, 112, 0.25)' }]}>
                <Ionicons name="arrow-up" size={14} color="#FDA4AF" />
              </View>
              <View>
                <Text style={styles.heroPillLabel}>Saídas</Text>
                <Text style={styles.heroPillValue}>{formatMoney(expense)}</Text>
              </View>
            </View>
          </View>
          {comparison ? <Text style={styles.heroCompare}>{comparison}</Text> : null}
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gastos por categoria</Text>
          {byCategory.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="pie-chart-outline" size={36} color={colors.muted} />
              <Text style={styles.emptyText}>Nenhum gasto neste mês. Toque no + para adicionar.</Text>
            </View>
          ) : (
            <>
              <CategoryDonut data={byCategory} total={expense} />
              <View style={styles.list}>
                {byCategory.map(([id, total]) => {
                  const pct = (total / expense) * 100;
                  const limit = budgets[id];
                  const used = limit ? total / limit : 0;
                  const over = limit ? total > limit : false;
                  return (
                    <View key={id} style={styles.cat}>
                      <View style={styles.catHead}>
                        <View style={styles.catTitle}>
                          <View style={[styles.dot, { backgroundColor: colorOf(id) }]} />
                          <Text style={styles.catName}>{categoryOf(id).label}</Text>
                        </View>
                        <Text style={styles.catValue}>
                          {formatMoney(total)}
                          <Text style={styles.catPct}>
                            {'  '}
                            {pct.toFixed(pct > 0 && pct < 10 ? 1 : 0).replace('.', ',')}%
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.fill,
                            limit
                              ? { width: `${Math.min(used, 1) * 100}%`, backgroundColor: over ? colors.expense : colorOf(id) }
                              : { width: `${pct}%`, backgroundColor: colorOf(id) },
                          ]}
                        />
                      </View>
                      {limit ? (
                        <Text style={[styles.limit, over && { color: colors.error }]}>
                          {over
                            ? `Passou ${formatMoney(total - limit)} do limite de ${formatMoney(limit)}`
                            : `${Math.round(used * 100)}% do limite de ${formatMoney(limit)}`}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {hasHistory ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Últimos 6 meses</Text>
            <MonthlyBars data={history} selected={month} />
          </View>
        ) : null}
      </ScrollView>
      <Fab />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 100, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hero: { borderRadius: 24, padding: 20, gap: 4, boxShadow: '0 10px 24px rgba(15, 118, 110, 0.28)' },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  heroValue: { color: '#FFFFFF', fontSize: 38, fontWeight: '800', fontVariant: ['tabular-nums'] },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  heroPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 12,
  },
  heroIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroCompare: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 10 },
  limit: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  heroPillLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  heroPillValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
    boxShadow: cardShadow,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  list: { gap: 14, marginTop: 4 },
  cat: { gap: 6 },
  catHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  catName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  catValue: { color: colors.text, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  catPct: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
}));
