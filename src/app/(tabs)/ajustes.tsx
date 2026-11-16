import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';

import { makeStyles, useColors, useTheme, type ThemePreference } from '@/components/theme';
import { makeBackup, parseBackup } from '@/lib/parseEntries';
import { useApp } from '@/state/AppContext';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

export default function Ajustes() {
  const styles = useStyles();
  const colors = useColors();
  const { preference, setPreference } = useTheme();
  const { entries, importEntries } = useApp();
  const [pasted, setPasted] = useState('');
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const exportBackup = async () => {
    const json = makeBackup(entries);
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `gastos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ text: `${entries.length} lançamento(s) exportado(s).` });
    } else {
      try {
        await Share.share({ message: json, title: 'Backup de gastos' });
      } catch {
        setMessage({ text: 'Não foi possível compartilhar o backup.', error: true });
      }
    }
  };

  const runImport = (raw: string) => {
    try {
      const { entries: list, skipped } = parseBackup(raw);
      const added = importEntries(list);
      const dup = list.length - added;
      setMessage({
        text:
          `${added} importado(s)` +
          (dup ? `, ${dup} já existia(m)` : '') +
          (skipped ? `, ${skipped} inválido(s) ignorado(s)` : '') +
          '.',
      });
      setPasted('');
    } catch {
      setMessage({ text: 'Backup inválido. Use um arquivo gerado por este app.', error: true });
    }
  };

  const pickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) runImport(await file.text());
    };
    input.click();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

      <Text style={[styles.section, styles.gap]}>Backup</Text>
      <View style={styles.row}>
        <Pressable onPress={exportBackup} style={styles.chip} accessibilityRole="button">
          <Text style={styles.chipText}>Exportar</Text>
        </Pressable>
        {Platform.OS === 'web' ? (
          <Pressable onPress={pickFile} style={styles.chip} accessibilityRole="button">
            <Text style={styles.chipText}>Importar arquivo</Text>
          </Pressable>
        ) : null}
      </View>
      {Platform.OS !== 'web' ? (
        <>
          <TextInput
            value={pasted}
            onChangeText={setPasted}
            placeholder="Cole aqui o conteúdo do backup para importar"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.paste}
          />
          <Pressable
            onPress={() => runImport(pasted)}
            disabled={!pasted.trim()}
            style={[styles.chip, styles.start, !pasted.trim() && styles.disabled]}
            accessibilityRole="button">
            <Text style={styles.chipText}>Importar</Text>
          </Pressable>
        </>
      ) : null}
      {message ? <Text style={[styles.note, message.error && { color: colors.error }]}>{message.text}</Text> : null}

      <Text style={styles.note}>
        Seus dados ficam salvos só neste aparelho. Exporte um backup de vez em quando. Importar não apaga nada: só
        adiciona o que ainda não existe.
      </Text>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 16, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  section: { fontSize: 16, fontWeight: '800', color: colors.text },
  gap: { marginTop: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  start: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.5 },
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
  paste: {
    minHeight: 90,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    color: colors.text,
    textAlignVertical: 'top',
  },
  note: { color: colors.muted, fontSize: 13, marginTop: 4 },
}));
