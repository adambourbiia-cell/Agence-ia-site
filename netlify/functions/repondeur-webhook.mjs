/* AI Répondeur — reçoit les événements de Vapi pendant et après chaque appel :
   - « tool-calls » : l'assistante a recueilli la demande → SMS immédiat au gérant ;
   - « end-of-call-report » : appel terminé sans message transmis → SMS « appel manqué ». */
import { env, json, sameSecret, readToolCalls, toolWasCalled, smsForRequest, smsForMissed, sendSms, vapi, TOOL_NAME } from '../lib/repondeur.mjs';

async function metaFor(message, fetchImpl) {
  const m = message?.assistant?.metadata || message?.call?.assistant?.metadata;
  if (m?.notify) return m;
  const id = message?.call?.assistantId || message?.assistant?.id;
  if (!id) return m || {};
  const r = await vapi(`/assistant/${encodeURIComponent(id)}`, {}, fetchImpl);
  return r.ok ? r.data.metadata || {} : m || {};
}

export async function handle(req, fetchImpl = fetch) {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);
  if (!sameSecret(req.headers.get('x-vortex-secret') || '', env('REPONDEUR_WEBHOOK_SECRET'))) return json({ error: 'Non autorisé' }, 401);

  let payload;
  try { payload = await req.json(); } catch { return json({ error: 'JSON invalide' }, 400); }
  const message = payload?.message || {};
  const caller = message?.call?.customer?.number || message?.customer?.number || '';

  if (message.type === 'tool-calls') {
    const calls = readToolCalls(message);
    const meta = await metaFor(message, fetchImpl);
    const results = [];
    for (const t of calls) {
      if (t.name !== TOOL_NAME) { results.push({ name: t.name, toolCallId: t.id, result: 'Outil inconnu.' }); continue; }
      const sms = await sendSms(meta.notify, smsForRequest(meta, t.args, caller), fetchImpl);
      if (!sms.ok) console.error('SMS non envoyé :', sms.error);
      results.push({ name: t.name, toolCallId: t.id, result: sms.ok ? 'Message transmis au gérant par SMS.' : 'Message enregistré ; le gérant sera prévenu.' });
    }
    return json({ results });
  }

  if (message.type === 'end-of-call-report') {
    if (toolWasCalled(message)) return json({ ok: true, skipped: 'déjà transmis' });
    const meta = await metaFor(message, fetchImpl);
    if (!meta.notify) return json({ ok: false, error: 'aucun numéro de notification' });
    const sms = await sendSms(meta.notify, smsForMissed(meta, caller, message), fetchImpl);
    if (!sms.ok) console.error('SMS non envoyé :', sms.error);
    return json({ ok: sms.ok });
  }

  return json({ ok: true, ignored: message.type || 'inconnu' });
}

export default (req) => handle(req);
