// Webhook RevenueCat : tient à jour l'abonnement Pro (App Store / Google Play).
// Dans RevenueCat, mettre l'en-tête Authorization à la valeur du secret REVENUECAT_WEBHOOK_AUTH.
// Déployer avec : `supabase functions deploy revenuecat-webhook --no-verify-jwt`
import { admin, json } from '../_shared/http.ts';
import { applyEvent, userIdOf, type RevenueCatEvent, type SubscriptionRow } from '../_shared/revenuecat.ts';

Deno.serve(async (req) => {
  const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!expected || req.headers.get('Authorization') !== expected) return json({ error: 'Non autorisé' }, 401);

  const body = await req.json().catch(() => null);
  const event = body?.event as RevenueCatEvent | undefined;
  if (!event?.type) return json({ error: 'Événement invalide' }, 400);

  const userId = userIdOf(event);
  // 200 même quand on ignore l'événement, sinon RevenueCat le renvoie en boucle.
  if (!userId) return json({ ignored: 'utilisateur inconnu' });

  const { data: current, error } = await admin.from('subscriptions').select('*').eq('user_id', userId).maybeSingle();
  if (error) return json({ error: error.message }, 500);

  const next = applyEvent(current as SubscriptionRow | null, event);
  if (!next) return json({ ignored: event.type });

  const { error: upsertError } = await admin.from('subscriptions').upsert({ ...next, updated_at: new Date().toISOString() });
  // 500 : RevenueCat réessaiera plus tard.
  if (upsertError) return json({ error: upsertError.message }, 500);
  return json({ ok: true, status: next.status });
});
