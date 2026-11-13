import { Pressable, Text, View } from 'react-native';

import { makeStyles, useTheme, type ThemePreference } from '@/components/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

export default function Ajustes() {
  const styles = useStyles();
  const { preference, setPreference } = useTheme();
  return (
    <View style={styles.content}>
      <Text style={styles.section}>Aparência</Text>
      <View style={styles.row}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => setPreference(o.value)}
            style={[styles.chip, preference === o.value && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: preference === o.value }}>
            <Text style={[styles.chipText, preference === o.value && styles.chipTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.note}>Seus dados ficam salvos só neste aparelho.</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 16, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  section: { fontSize: 16, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600' },
  chipTextOn: { color: colors.background },
  note: { color: colors.muted, fontSize: 13, marginTop: 8 },
}));
