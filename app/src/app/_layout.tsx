import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/components/ui';
import { StoreProvider } from '@/lib/store';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Dicta' }} />
        <Stack.Screen name="new" options={{ title: 'Nouveau devis', presentation: 'modal' }} />
        <Stack.Screen name="doc/[id]" options={{ title: '' }} />
        <Stack.Screen name="settings" options={{ title: 'Mon entreprise' }} />
        <Stack.Screen name="account" options={{ title: 'Compte', presentation: 'modal' }} />
      </Stack>
    </StoreProvider>
  );
}
