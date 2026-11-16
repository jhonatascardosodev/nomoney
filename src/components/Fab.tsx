import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { makeStyles } from './theme';

/** Floating "new entry" button. Place it inside a screen wrapper with flex: 1. */
export function Fab() {
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => router.push('/novo')}
      accessibilityRole="button"
      accessibilityLabel="Novo lançamento"
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <Ionicons name="add" size={30} color="#FFFFFF" />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    boxShadow: '0 6px 16px rgba(15, 118, 110, 0.45)',
  },
  pressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },
}));
