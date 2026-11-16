import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { formatDay, formatMoney } from '@/lib/money';
import { useApp } from '@/state/AppContext';
import { categoryOf, type Entry } from '@/state/types';
import { makeStyles, useColors } from './theme';

export function EntryRow({ entry }: { entry: Entry }) {
  const colors = useColors();
  const styles = useStyles();
  const { removeEntry } = useApp();
  const cat = categoryOf(entry.category);
  const income = entry.kind === 'income';

  const confirmRemove = () => {
    const title = 'Excluir lançamento?';
    const message = `${cat.label} · ${formatMoney(entry.amount)}`;
    // Alert.alert com botões não funciona no react-native-web.
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n${message}`)) removeEntry(entry.id);
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => removeEntry(entry.id) },
    ]);
  };

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/novo', params: { id: entry.id } })}
      onLongPress={confirmRemove}
      style={styles.row}
      accessibilityHint="Toque para editar, segure para excluir">
      <View style={styles.icon}>
        <Ionicons name={cat.icon as ComponentProps<typeof Ionicons>['name']} size={20} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{entry.note || cat.label}</Text>
        <Text style={styles.sub}>
          {cat.label} · {formatDay(entry.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: income ? colors.income : colors.expense }]}>
        {income ? '+' : '-'} {formatMoney(entry.amount)}
      </Text>
      <Pressable onPress={confirmRemove} hitSlop={10} accessibilityRole="button" accessibilityLabel="Excluir lançamento">
        <Ionicons name="trash-outline" size={20} color={colors.muted} />
      </Pressable>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
}));
