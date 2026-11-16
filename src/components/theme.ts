import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { kvStorage } from '@/lib/storage';

const light = {
  background: '#F3F8F7',
  card: '#FFFFFF',
  primary: '#0F766E',
  primarySoft: '#D5EEEA',
  text: '#0F1F1D',
  muted: '#5B7370',
  border: '#D8E5E3',
  income: '#15803D',
  expense: '#C0182B',
  error: '#C0182B',
};

export type Colors = typeof light;

const dark: Colors = {
  background: '#0A1211',
  card: '#121D1C',
  primary: '#2DD4BF',
  primarySoft: '#173532',
  text: '#E8F3F1',
  muted: '#8FAAA6',
  border: '#243533',
  income: '#4ADE80',
  expense: '#FF5D70',
  error: '#FF5D70',
};

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };

/** Soft elevation for cards (works on native new-arch and web). */
export const cardShadow = '0 1px 3px rgba(15, 31, 29, 0.06), 0 6px 16px rgba(15, 31, 29, 0.05)';

export type ThemePreference = 'system' | 'light' | 'dark';
type Scheme = 'light' | 'dark';

type ThemeState = {
  colors: Colors;
  scheme: Scheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = 'gastos.theme';

const ThemeContext = createContext<ThemeState>({
  colors: light,
  scheme: 'light',
  preference: 'system',
  setPreference: () => {},
});

function readPreference(): ThemePreference {
  try {
    const saved = kvStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

/** Follows the device theme unless the user picked one, and remembers that choice. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const scheme: Scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeState>(
    () => ({
      colors: scheme === 'dark' ? dark : light,
      scheme,
      preference,
      setPreference: (next) => {
        setPreferenceState(next);
        try {
          kvStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Not saved; the choice still applies until the app closes.
        }
      },
    }),
    [scheme, preference],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}

type Styles = Parameters<typeof StyleSheet.create>[0];

/** Builds a hook returning styles for the current theme (one StyleSheet per palette). */
export function makeStyles<S extends Styles>(factory: (colors: Colors) => S & Styles) {
  const cache = new Map<Colors, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const colors = useColors();
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(factory(colors));
      cache.set(colors, styles);
    }
    return styles;
  };
}
