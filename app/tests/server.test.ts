import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';

import { invoiceTotal, reminderEmail, reminderToSend, type InvoiceData } from '../supabase/functions/_shared/reminders.ts';
import { applyEvent, type SubscriptionRow } from '../supabase/functions/_shared/revenuecat.ts';

const invoice: InvoiceData = {
  number: 'F-2026-001',
  title: 'Rénovation salle de bain',
  clientName: 'Mme Martin',
  clientEmail: 'martin@example.fr',
  createdAt: '2026-09-01T10:00:00Z',
  lines: [
    { description: 'Faïence', quantity: 6, unitPrice: 45 },
    { description: 'Main <b>d’œuvre</b>', quantity: 2, unitPrice: 380 },
  ],
  status: 'sent',
};
const company = { name: 'Dupont Rénovation', email: 'dupont@example.fr', phone: '06 12 34 56 78', vatRate: 10, paymentTermsDays: 30 };
// Échéance : 1er octobre 2026 à 10 h.
const at = (iso: string) => new Date(iso);

Deno.test('relances : rien avant J+1 après l’échéance', () => {
  assertEquals(reminderToSend(invoice, company, 0, null, at('2026-10-01T12:00:00Z')), null);
  assertEquals(reminderToSend(invoice, company, 0, null, at('2026-10-02T10:00:00Z')), 1);
});

Deno.test('relances : n°2 à J+8, n°3 à J+15, puis plus rien', () => {
  assertEquals(reminderToSend(invoice, company, 1, '2026-10-02T10:00:00Z', at('2026-10-08T10:00:00Z')), null);
  assertEquals(reminderToSend(invoice, company, 1, '2026-10-02T10:00:00Z', at('2026-10-09T10:00:00Z')), 2);
  assertEquals(reminderToSend(invoice, company, 2, '2026-10-09T10:00:00Z', at('2026-10-16T10:00:00Z')), 3);
  assertEquals(reminderToSend(invoice, company, 3, '2026-10-16T10:00:00Z', at('2026-12-01T10:00:00Z')), null);
});

Deno.test('relances : cron en retard, pas de rafale', () => {
  // Rien envoyé depuis des semaines : une seule relance, puis 5 jours d'écart minimum.
  assertEquals(reminderToSend(invoice, company, 0, null, at('2026-11-20T10:00:00Z')), 1);
  assertEquals(reminderToSend(invoice, company, 1, '2026-11-20T10:00:00Z', at('2026-11-21T10:00:00Z')), null);
  assertEquals(reminderToSend(invoice, company, 1, '2026-11-20T10:00:00Z', at('2026-11-25T10:00:00Z')), 2);
});

Deno.test('relances : jamais si payée, désactivée ou sans e-mail', () => {
  const late = at('2026-10-20T10:00:00Z');
  assertEquals(reminderToSend({ ...invoice, status: 'paid' }, company, 0, null, late), null);
  assertEquals(reminderToSend({ ...invoice, autoRemind: false }, company, 0, null, late), null);
  assertEquals(reminderToSend({ ...invoice, clientEmail: '' }, company, 0, null, late), null);
});

Deno.test('relances : montant TTC, franchise de TVA', () => {
  assertEquals(invoiceTotal(invoice.lines, company), 1133); // 1030 HT + 10 %
  assertEquals(invoiceTotal(invoice.lines, { ...company, vatExempt: true }), 1030);
});

Deno.test('e-mail de relance : contenu et échappement HTML', () => {
  const m1 = reminderEmail(invoice, company, 1);
  assertEquals(m1.subject, 'Facture F-2026-001 : rappel d’échéance');
  assertStringIncludes(m1.text.replace(/\s/g, ' '), '1 133,00 € TTC');
  assertStringIncludes(m1.text, 'arrivée à échéance le 01/10/2026');
  assertStringIncludes(m1.text, 'Dupont Rénovation\n06 12 34 56 78');
  const m3 = reminderEmail({ ...invoice, title: '<script>x</script>' }, company, 3);
  assertStringIncludes(m3.subject, 'Dernière relance');
  assertStringIncludes(m3.text, 'L441-10');
  assertEquals(m3.html.includes('<script>'), false);
});

const USER = '6f1c2b1e-1111-4222-8333-444455556666';
const ev = (type: string, ts: number, extra = {}) => ({
  type,
  app_user_id: USER,
  entitlement_ids: ['pro'],
  event_timestamp_ms: ts,
  expiration_at_ms: Date.UTC(2026, 10, 18),
  product_id: 'dicta_pro_monthly',
  store: 'APP_STORE',
  ...extra,
});

Deno.test('abonnement : achat, annulation (accès conservé), expiration', () => {
  const bought = applyEvent(null, ev('INITIAL_PURCHASE', 1))!;
  assertEquals([bought.user_id, bought.status, bought.expires_at], [USER, 'active', '2026-11-18T00:00:00.000Z']);
  const cancelled = applyEvent(bought, ev('CANCELLATION', 2))!;
  assertEquals(cancelled.status, 'active');
  assertEquals(applyEvent(cancelled, ev('EXPIRATION', 3))!.status, 'expired');
});

Deno.test('abonnement : événement en retard ignoré', () => {
  const expired: SubscriptionRow = { ...applyEvent(null, ev('EXPIRATION', 10))! };
  assertEquals(applyEvent(expired, ev('RENEWAL', 5)), null);
});

Deno.test('abonnement : utilisateur anonyme RevenueCat retrouvé via les alias', () => {
  const e = ev('INITIAL_PURCHASE', 1, { app_user_id: '$RCAnonymousID:abc', aliases: ['$RCAnonymousID:abc', USER] });
  assertEquals(applyEvent(null, e)?.user_id, USER);
  assertEquals(applyEvent(null, ev('INITIAL_PURCHASE', 1, { app_user_id: '$RCAnonymousID:abc' })), null);
});

Deno.test('abonnement : autres droits et événements ignorés', () => {
  assertEquals(applyEvent(null, ev('INITIAL_PURCHASE', 1, { entitlement_ids: ['autre'] })), null);
  assertEquals(applyEvent(null, ev('TEST', 1)), null);
});
