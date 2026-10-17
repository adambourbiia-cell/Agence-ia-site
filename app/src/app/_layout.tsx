import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { NotificationsBridge } from '@/components/NotificationsBridge';
import { colors, DialogHost } from '@/components/ui';
import { StoreProvider } from '@/lib/store';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <NotificationsBridge />
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
        <Stack.Screen name="pro" options={{ title: '', presentation: 'modal' }} />
      </Stack>
      <DialogHost />
    </StoreProvider>
  );
}
