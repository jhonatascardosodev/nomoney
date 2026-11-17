import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, type ReactNode } from 'react';

import { ThemeProvider as AppThemeProvider, useTheme } from '@/components/theme';
import { AppProvider } from '@/state/AppContext';

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AppProvider>
        <ThemedStatusBar />
        <NavigationTheme>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="novo"
              options={{ headerShown: true, title: 'Novo lançamento', presentation: 'modal' }}
            />
            <Stack.Screen name="orcamentos" options={{ headerShown: true, title: 'Orçamento mensal' }} />
            <Stack.Screen name="recorrentes" options={{ headerShown: true, title: 'Lançamentos recorrentes' }} />
          </Stack>
        </NavigationTheme>
      </AppProvider>
    </AppThemeProvider>
  );
}

function ThemedStatusBar() {
  return <StatusBar style={useTheme().scheme === 'dark' ? 'light' : 'dark'} />;
}

/** Gives the navigator (headers, tab bar, screen backgrounds) the app's palette. */
function NavigationTheme({ children }: { children: ReactNode }) {
  const { colors, scheme } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = useMemo(
    () => ({
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    }),
    [base, colors],
  );
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}
