import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let currentToken: string | null = null;

/**
 * Enregistre le téléphone pour recevoir « Devis signé » et « Relance envoyée ».
 * `prompt` : demander l'autorisation si elle n'a pas encore été donnée. On ne la
 * demande qu'au moment utile (premier devis envoyé à signer), pas au lancement.
 * Ne lève jamais : Expo Go sur Android et les simulateurs ne reçoivent pas de push.
 */
export async function registerPush(prompt: boolean) {
  if (!supported || !supabase) return;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && prompt) status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Signatures et relances',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    if (!error) currentToken = token;
  } catch (e) {
    console.warn('Notifications indisponibles', e);
  }
}

/** À la déconnexion : ce téléphone ne doit plus recevoir les notifications du compte. */
export async function unregisterPush() {
  if (!supabase || !currentToken) return;
  await supabase.from('push_tokens').delete().eq('token', currentToken);
  currentToken = null;
}

export const notificationsSupported = supported;
