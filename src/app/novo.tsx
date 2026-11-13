import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { makeStyles, useColors } from '@/components/theme';
import { parseMoney } from '@/lib/money';
import { useApp } from '@/state/AppContext';
import { CATEGORIES, type Kind } from '@/state/types';

export default function Novo() {
  const colors = useColors();
  const styles = useStyles();
  const { addEntry } = useApp();
  const [kind, setKind] = useState<Kind>('expense');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState('comida');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    const amount = parseMoney(amountText);
    if (!amount) {
      setError('Informe um valor maior que zero.');
      return;
    }
    addEntry({ kind, amount, category, note: note.trim(), date: new Date().toISOString() });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.row}>
        {(['expense', 'income'] as const).map((k) => (
          <Pressable key={k} onPress={() => setKind(k)} style={[styles.seg, kind === k && styles.segOn]}>
            <Text style={[styles.segText, kind === k && styles.segTextOn]}>
              {k === 'expense' ? 'Gasto' : 'Entrada'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Valor</Text>
      <TextInput
        value={amountText}
        onChangeText={(t) => {
          setAmountText(t);
          setError('');
        }}
        placeholder="0,00"
        placeholderTextColor={colors.muted}
        keyboardType="decimal-pad"
        style={[styles.input, styles.amount]}
        autoFocus
      />

      <Text style={styles.label}>Categoria</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategory(c.id)}
            style={[styles.chip, category === c.id && styles.chipOn]}>
            <Ionicons
              name={c.icon as ComponentProps<typeof Ionicons>['name']}
              size={16}
              color={category === c.id ? colors.background : colors.primary}
            />
            <Text style={[styles.chipText, category === c.id && styles.chipTextOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Descrição (opcional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Ex.: almoço"
        placeholderTextColor={colors.muted}
        style={styles.input}
        maxLength={60}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={save} style={styles.save} accessibilityRole="button">
        <Text style={styles.saveText}>Salvar</Text>
      </Pressable>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 16, gap: 8, maxWidth: 560, width: '100%', alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  seg: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  segOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { color: colors.text, fontWeight: '700' },
  segTextOn: { color: colors.background },
  label: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 8 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  amount: { fontSize: 28, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600' },
  chipTextOn: { color: colors.background },
  error: { color: colors.error, fontWeight: '600' },
  save: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveText: { color: colors.background, fontSize: 16, fontWeight: '800' },
}));
