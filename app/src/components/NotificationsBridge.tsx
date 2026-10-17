import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { notificationsSupported } from '@/lib/notifications';
import { useStore } from '@/lib/store';

/**
 * Notification reçue (« Devis signé », « Relance envoyée ») : on resynchronise pour l'afficher tout de suite.
 * Notification touchée : on ouvre le document concerné.
 */
/** Notifications déjà ouvertes : l'effet se relance à la connexion, on n'ouvre pas deux fois. */
const handled = new Set<string>();

export function NotificationsBridge() {
  const { syncNow } = useStore();

  useEffect(() => {
    if (!notificationsSupported) return;
    const received = Notifications.addNotificationReceivedListener(() => syncNow());
    const open = (response: Notifications.NotificationResponse | null) => {
      const id = response?.notification.request.identifier;
      const docId = response?.notification.request.content.data?.docId;
      if (id && !handled.has(id) && typeof docId === 'string') {
        handled.add(id);
        syncNow();
        router.push(`/doc/${docId}`);
      }
    };
    // App lancée en touchant la notification : on attend que la navigation soit montée.
    const initial = setTimeout(() => open(Notifications.getLastNotificationResponse()), 0);
    const tapped = Notifications.addNotificationResponseReceivedListener(open);
    return () => {
      clearTimeout(initial);
      received.remove();
      tapped.remove();
    };
  }, [syncNow]);

  return null;
}
