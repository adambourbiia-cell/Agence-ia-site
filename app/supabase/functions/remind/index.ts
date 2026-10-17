// Relances automatiques des factures impayées, lancée une fois par jour par un cron Supabase.
// Appel protégé par l'en-tête `x-cron-secret` (secret CRON_SECRET).
// Déployer avec : `supabase functions deploy remind --no-verify-jwt`
import { admin, json } from '../_shared/http.ts';
import { notifyUser } from '../_shared/push.ts';
import { invoiceTotal, reminderEmail, reminderToSend, type CompanyData, type InvoiceData } from '../_shared/reminders.ts';

const eur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

async function sendEmail(to: string, replyTo: string | undefined, mail: ReturnType<typeof reminderEmail>, idempotencyKey: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
      // Si la fonction est relancée, Resend n'envoie pas deux fois le même e-mail.
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from: Deno.env.get('REMINDER_FROM'),
      to: [to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'Non autorisé' }, 401);

  const now = new Date();
  const { data: subs, error: subsError } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')
    .gt('expires_at', now.toISOString());
  if (subsError) return json({ error: subsError.message }, 500);
  const proUsers = subs.map((s) => s.user_id);
  if (!proUsers.length) return json({ checked: 0, sent: 0, failed: 0 });

  const { data: invoices, error } = await admin
    .from('documents')
    .select('id, user_id, number, data, reminders_sent, last_reminder_at')
    .eq('kind', 'invoice')
    .eq('deleted', false)
    .neq('data->>status', 'paid')
    .lt('reminders_sent', 3)
    .in('user_id', proUsers);
  if (error) return json({ error: error.message }, 500);

  const { data: profiles } = await admin.from('profiles').select('user_id, company').in('user_id', proUsers);
  const companies = new Map((profiles ?? []).map((p) => [p.user_id, p.company as CompanyData]));

  let sent = 0;
  let failed = 0;
  for (const doc of invoices) {
    const invoice = { ...doc.data, number: doc.number } as InvoiceData;
    const company = companies.get(doc.user_id) ?? {};
    const n = reminderToSend(invoice, company, doc.reminders_sent, doc.last_reminder_at, now);
    if (!n) continue;
    try {
      await sendEmail(invoice.clientEmail, company.email, reminderEmail(invoice, company, n), `${doc.id}-${n}`);
      await admin
        .from('documents')
        .update({ reminders_sent: n, last_reminder_at: now.toISOString() })
        .eq('id', doc.id)
        .eq('reminders_sent', doc.reminders_sent);
      await notifyUser(doc.user_id, {
        title: `Relance ${n}/3 envoyée`,
        body: `${invoice.clientName || 'Client'} · ${doc.number} · ${eur(invoiceTotal(invoice.lines, company))}`,
        data: { docId: doc.id },
      });
      sent++;
    } catch (e) {
      console.error('reminder failed', doc.id, e);
      failed++;
    }
  }
  return json({ checked: invoices.length, sent, failed });
});
