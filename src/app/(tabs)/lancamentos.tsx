import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { EntryRow } from '@/components/EntryRow';
import { MonthBar } from '@/components/MonthBar';
import { makeStyles, useColors } from '@/components/theme';
import { monthKey } from '@/lib/money';
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
    <FlatList
      data={visible}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => <EntryRow entry={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text style={styles.empty}>{filtering ? 'Nenhum lançamento com esses filtros.' : 'Nada por aqui ainda.'}</Text>
      }
      ListFooterComponent={visible.length ? <Text style={styles.hint}>Toque para editar. Use a lixeira para excluir.</Text> : undefined}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
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
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 16 },
}));
