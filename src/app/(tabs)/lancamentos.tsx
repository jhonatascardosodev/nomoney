import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { EntryRow } from '@/components/EntryRow';
import { MonthBar } from '@/components/MonthBar';
import { makeStyles } from '@/components/theme';
import { monthKey } from '@/lib/money';
import { useApp } from '@/state/AppContext';

export default function Lancamentos() {
  const styles = useStyles();
  const { entries } = useApp();
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const visible = entries.filter((e) => monthKey(new Date(e.date)) === month);

  return (
    <FlatList
      data={visible}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => <EntryRow entry={item} />}
      ListHeaderComponent={<MonthBar month={month} onChange={setMonth} />}
      ListEmptyComponent={<Text style={styles.empty}>Nada por aqui ainda.</Text>}
      ListFooterComponent={visible.length ? <Text style={styles.hint}>Toque na lixeira para excluir.</Text> : undefined}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      contentContainerStyle={styles.content}
    />
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 16 },
}));
