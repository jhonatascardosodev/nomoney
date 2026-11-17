import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { makeStyles, useColors } from '@/components/theme';
import { formatMoney, maskMoneyInput, parseMoney } from '@/lib/money';
import { useApp } from '@/state/AppContext';
import { categoriesFor, categoryOf, type Kind } from '@/state/types';

export default function Recorrentes() {
  const styles = useStyles();
  const colors = useColors();
  const { recurring, addRecurring, removeRecurring } = useApp();
  const [kind, setKind] = useState<Kind>('expense');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState('moradia');
  const [dayText, setDayText] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const changeKind = (next: Kind) => {
    setKind(next);
    if (!categoriesFor(next).some((c) => c.id === category)) setCategory(categoriesFor(next)[0].id);
  };

  const add = () => {
    const amount = parseMoney(amountText);
    const day = Number(dayText);
    if (!amount) return setError('Informe um valor maior que zero.');
    if (!Number.isInteger(day) || day < 1 || day > 31) return setError('Informe o dia do mês, de 1 a 31.');
    addRecurring({ kind, amount, category, note: note.trim(), day });
    setAmountText('');
    setDayText('');
    setNote('');
    setError('');
  };

  const confirmRemove = (id: string, label: string) => {
    const message = 'Os lançamentos já criados continuam; só deixam de ser criados novos.';
    if (Platform.OS === 'web') {
      if (window.confirm(`Remover "${label}"?\n${message}`)) removeRecurring(id);
      return;
    }
    Alert.alert(`Remover "${label}"?`, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeRecurring(id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.note}>
        Lançamentos que se repetem todo mês (aluguel, salário, assinaturas). Eles são criados sozinhos no dia combinado,
        na próxima vez que você abrir o app.
      </Text>

      {recurring.map((r) => {
        const label = r.note || categoryOf(r.category).label;
        return (
          <View key={r.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{label}</Text>
              <Text style={styles.itemSub}>
                Todo dia {r.day} · {categoryOf(r.category).label}
              </Text>
            </View>
            <Text style={[styles.itemValue, { color: r.kind === 'income' ? colors.income : colors.expense }]}>
              {r.kind === 'income' ? '+' : '-'} {formatMoney(r.amount)}
            </Text>
            <Pressable
              onPress={() => confirmRemove(r.id, label)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${label}`}>
              <Ionicons name="trash-outline" size={20} color={colors.muted} />
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.section}>Nova recorrência</Text>
      <View style={styles.wrap}>
        {(['expense', 'income'] as const).map((k) => (
          <Pressable key={k} onPress={() => changeKind(k)} style={[styles.seg, kind === k && styles.segOn]}>
            <Text style={[styles.segText, kind === k && styles.segTextOn]}>{k === 'expense' ? 'Gasto' : 'Entrada'}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={amountText}
        onChangeText={(t) => {
          setAmountText(maskMoneyInput(t));
          setError('');
        }}
        placeholder="Valor 0,00"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        inputMode="numeric"
        style={styles.input}
      />
      <View style={styles.wrap}>
        {categoriesFor(kind).map((c) => (
          <Pressable key={c.id} onPress={() => setCategory(c.id)} style={[styles.chip, category === c.id && styles.chipOn]}>
            <Ionicons
              name={c.icon as ComponentProps<typeof Ionicons>['name']}
              size={16}
              color={category === c.id ? colors.background : colors.primary}
            />
            <Text style={[styles.chipText, category === c.id && styles.chipTextOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={dayText}
        onChangeText={(t) => {
          setDayText(t.replace(/\D/g, '').slice(0, 2));
          setError('');
        }}
        placeholder="Dia do mês (1 a 31)"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        inputMode="numeric"
        style={styles.input}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Descrição (ex.: Aluguel)"
        placeholderTextColor={colors.muted}
        style={styles.input}
        maxLength={60}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={add} style={styles.save} accessibilityRole="button">
        <Text style={styles.saveText}>Adicionar</Text>
      </Pressable>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 16, gap: 10, maxWidth: 560, width: '100%', alignSelf: 'center' },
  note: { color: colors.muted, fontSize: 13 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  itemTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  itemSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  itemValue: { fontWeight: '800', fontSize: 14, fontVariant: ['tabular-nums'] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  save: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveText: { color: colors.background, fontSize: 16, fontWeight: '800' },
}));
