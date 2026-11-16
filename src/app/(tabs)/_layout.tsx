import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useColors } from '@/components/theme';

export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerTitleStyle: { color: colors.text, fontWeight: '800' },
        headerStyle: { backgroundColor: colors.card },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Resumo', tabBarIcon: tabIcon('pie-chart') }} />
      <Tabs.Screen name="lancamentos" options={{ title: 'Lançamentos', tabBarIcon: tabIcon('list') }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: tabIcon('settings') }} />
    </Tabs>
  );
}

function tabIcon(name: ComponentProps<typeof Ionicons>['name']) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };
}
