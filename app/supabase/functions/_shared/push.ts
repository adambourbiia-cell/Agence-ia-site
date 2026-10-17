import { admin } from './http.ts';

type Push = { title: string; body: string; data?: Record<string, unknown> };

/**
 * Envoie une notification à tous les téléphones de l'artisan (service Expo Push).
 * Ne lève jamais : une notification ratée ne doit pas faire échouer l'action principale.
 */
export async function notifyUser(userId: string, push: Push) {
  try {
    const { data: tokens } = await admin.from('push_tokens').select('token').eq('user_id', userId);
    if (!tokens?.length) return;
    const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(tokens.map(({ token }) => ({ to: token, sound: 'default', ...push }))),
    });
    const { data: tickets } = await res.json();
    // Appareil désinstallé ou jeton expiré : on fait le ménage.
    const dead = tokens.filter((_, i) => tickets?.[i]?.details?.error === 'DeviceNotRegistered').map((t) => t.token);
    if (dead.length) await admin.from('push_tokens').delete().in('token', dead);
  } catch (e) {
    console.error('push error', e);
  }
}
