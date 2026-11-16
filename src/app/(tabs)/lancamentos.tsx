import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, SectionList, Text, TextInput, View } from 'react-native';

import { EntryRow } from '@/components/EntryRow';
import { Fab } from '@/components/Fab';
import { MonthBar } from '@/components/MonthBar';
import { makeStyles, useColors } from '@/components/theme';
import { dayTitle, formatMoney, monthKey } from '@/lib/money';
import { useApp } from '@/state/AppContext';
import { CATEGORIES, categoryOf, type Kind } from '@/state/types';

type KindFilter = Kind | 'all';

const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Entradas' },
];

/** Lowercase and strip accents so "saude" finds "Saúde". */
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Lancamentos() {
  const styles = useStyles();
  const colors = useColors();
  const { entries } = useApp();
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [category, setCategory] = useState<string | null>(null);

  const monthEntries = useMemo(() => entries.filter((e) => monthKey(new Date(e.date)) === month), [entries, month]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return monthEntries.filter((e) => {
      if (kind !== 'all' && e.kind !== kind) return false;
      if (category && categoryOf(e.category).id !== category) return false;
      if (!q) return true;
      return normalize(`${e.note} ${categoryOf(e.category).label}`).includes(q);
    });
  }, [monthEntries, query, kind, category]);

  // Group by local day; entries are already sorted newest first.
  const sections = useMemo(() => {
    const groups: { key: string; title: string; net: number; data: typeof visible }[] = [];
    for (const e of visible) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      let g = groups[groups.length - 1];
      if (!g || g.key !== key) {
        g = { key, title: dayTitle(e.date), net: 0, data: [] };
        groups.push(g);
      }
      g.data.push(e);
      g.net += e.kind === 'income' ? e.amount : -e.amount;
    }
    return groups;
  }, [visible]);

  const categories = CATEGORIES.filter((c) => kind === 'all' || c.kinds.includes(kind));
  const filtering = query.trim() !== '' || kind !== 'all' || category !== null;

  const changeKind = (next: KindFilter) => {
    setKind(next);
    // Drop a category filter that does not exist for the new kind.
    if (category && next !== 'all' && !categoryOf(category).kinds.includes(next)) setCategory(null);
  };

  const header = (
    <View style={styles.header}>
      <MonthBar month={month} onChange={setMonth} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por descrição ou categoria"
        placeholderTextColor={colors.muted}
        style={styles.search}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <View style={styles.row}>
        {KIND_OPTIONS.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => changeKind(o.value)}
            style={[styles.chip, kind === o.value && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: kind === o.value }}>
            <Text style={[styles.chipText, kind === o.value && styles.chipTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable
          onPress={() => setCategory(null)}
          style={[styles.chip, category === null && styles.chipOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: category === null }}>
          <Text style={[styles.chipText, category === null && styles.chipTextOn]}>Todas</Text>
        </Pressable>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategory(category === c.id ? null : c.id)}
            style={[styles.chip, category === c.id && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: category === c.id }}>
            <Text style={[styles.chipText, category === c.id && styles.chipTextOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {filtering ? (
        <Text style={styles.count}>
          {visible.length} de {monthEntries.length} lançamento(s)
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EntryRow entry={item} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{section.title}</Text>
            <Text style={[styles.dayNet, section.net > 0 && { color: colors.income }]}>
              {section.net > 0 ? '+ ' : section.net < 0 ? '− ' : ''}
              {formatMoney(Math.abs(section.net))}
            </Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name={filtering ? 'search-outline' : 'receipt-outline'} size={36} color={colors.muted} />
            <Text style={styles.emptyText}>
              {filtering ? 'Nenhum lançamento com esses filtros.' : 'Nada por aqui ainda. Toque no + para começar.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          visible.length ? <Text style={styles.hint}>Toque para editar. Use a lixeira para excluir.</Text> : undefined
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      />
      <Fab />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 100, maxWidth: 560, width: '100%', alignSelf: 'center' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  dayTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  dayNet: { color: colors.muted, fontWeight: '700', fontSize: 13, fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', gap: 8, marginTop: 40 },
  emptyText: { color: colors.muted, textAlign: 'center' },
  header: { gap: 10, marginBottom: 8 },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  chipTextOn: { color: colors.background },
  count: { color: colors.muted, fontSize: 12 },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 16 },
}));
