// Traduction d'un événement webhook RevenueCat en état d'abonnement. Fichier pur, testé à part.

export const PRO_ENTITLEMENT = 'pro';

export type RevenueCatEvent = {
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
  product_id?: string;
  store?: string;
};

export type SubscriptionRow = {
  user_id: string;
  status: 'active' | 'expired';
  product_id: string | null;
  store: string | null;
  expires_at: string | null;
  last_event_ms: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** L'app appelle Purchases.logIn(<id Supabase>) : on retrouve l'utilisateur parmi les identifiants connus. */
export function userIdOf(event: RevenueCatEvent): string | null {
  const ids = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])];
  return ids.find((id): id is string => typeof id === 'string' && UUID.test(id)) ?? null;
}

/**
 * Nouvel état de l'abonnement, ou null s'il n'y a rien à faire (événement sans rapport
 * avec Pro, ou plus ancien que le dernier traité).
 * On ne coupe l'accès que sur EXPIRATION : une annulation laisse courir la période payée.
 */
export function applyEvent(current: SubscriptionRow | null, event: RevenueCatEvent): SubscriptionRow | null {
  const userId = userIdOf(event);
  if (!userId) return null;
  if (event.entitlement_ids && !event.entitlement_ids.includes(PRO_ENTITLEMENT)) return null;
  const ts = event.event_timestamp_ms ?? 0;
  if (current && ts < current.last_event_ms) return null;

  const handled = [
    'INITIAL_PURCHASE',
    'RENEWAL',
    'UNCANCELLATION',
    'PRODUCT_CHANGE',
    'NON_RENEWING_PURCHASE',
    'SUBSCRIPTION_EXTENDED',
    'TEMPORARY_ENTITLEMENT_GRANT',
    'CANCELLATION',
    'BILLING_ISSUE',
    'EXPIRATION',
  ];
  if (!handled.includes(event.type)) return null;

  const expires = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : (current?.expires_at ?? null);
  return {
    user_id: userId,
    status: event.type === 'EXPIRATION' ? 'expired' : 'active',
    product_id: event.product_id ?? current?.product_id ?? null,
    store: event.store ?? current?.store ?? null,
    expires_at: expires,
    last_event_ms: ts,
  };
}
