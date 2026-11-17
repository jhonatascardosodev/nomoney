import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { makeStyles, useColors } from '@/components/theme';
import { maskMoneyInput, parseMoney } from '@/lib/money';
import { useApp } from '@/state/AppContext';
import { categoriesFor } from '@/state/types';

export default function Orcamentos() {
  const styles = useStyles();
  const colors = useColors();
  const { budgets, setBudget } = useApp();
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(budgets).map(([id, cents]) => [id, maskMoneyInput(String(cents))])),
  );

  const change = (id: string, raw: string) => {
    const masked = maskMoneyInput(raw);
    setTexts((cur) => ({ ...cur, [id]: masked }));
    setBudget(id, parseMoney(masked));
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.note}>
        Defina quanto quer gastar por mês em cada categoria. O Resumo mostra o quanto do limite já foi usado. Deixe em
        branco para não ter limite.
      </Text>
      {categoriesFor('expense').map((c) => (
        <View key={c.id} style={styles.row}>
          <View style={styles.title}>
            <Ionicons name={c.icon as ComponentProps<typeof Ionicons>['name']} size={18} color={colors.primary} />
            <Text style={styles.name}>{c.label}</Text>
          </View>
          <TextInput
            value={texts[c.id] ?? ''}
            onChangeText={(t) => change(c.id, t)}
            placeholder="Sem limite"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            inputMode="numeric"
            style={styles.input}
            accessibilityLabel={`Limite mensal de ${c.label}`}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 16, gap: 10, maxWidth: 560, width: '100%', alignSelf: 'center' },
  note: { color: colors.muted, fontSize: 13, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: colors.text, fontWeight: '600', fontSize: 15 },
  input: { minWidth: 130, textAlign: 'right', fontSize: 16, fontWeight: '700', color: colors.text, paddingVertical: 6 },
}));
