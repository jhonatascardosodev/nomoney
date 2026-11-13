import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { monthLabel, shiftMonth } from '@/lib/money';
import { makeStyles, useColors } from './theme';

export function MonthBar({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Pressable onPress={() => onChange(shiftMonth(month, -1))} hitSlop={12} accessibilityLabel="Mês anterior">
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </Pressable>
      <Text style={styles.label}>{monthLabel(month)}</Text>
      <Pressable onPress={() => onChange(shiftMonth(month, 1))} hitSlop={12} accessibilityLabel="Próximo mês">
        <Ionicons name="chevron-forward" size={24} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontSize: 18, fontWeight: '700', color: colors.text },
}));
