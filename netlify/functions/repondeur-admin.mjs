/* AI Répondeur — actions d'administration (protégées par REPONDEUR_ADMIN_KEY) :
   status, list, create, update, delete, import-number, test-sms, preview. */
import { env, json, sameSecret, buildAssistant, buildPrompt, firstMessage, sendSms, vapi, e164, SITE, WEBHOOK_PATH } from '../lib/repondeur.mjs';

const VOICES = {
  denise: { provider: 'azure', voiceId: 'fr-FR-DeniseNeural' },
  henri: { provider: 'azure', voiceId: 'fr-FR-HenriNeural' },
  nova: { provider: 'openai', voiceId: 'nova' },
  onyx: { provider: 'openai', voiceId: 'onyx' },
};

const required = (c) => ['biz', 'notify'].filter((k) => !String(c?.[k] || '').trim());

export async function handle(req, fetchImpl = fetch) {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);
  const adminKey = env('REPONDEUR_ADMIN_KEY');
  if (!adminKey) return json({ error: 'REPONDEUR_ADMIN_KEY n\'est pas configurée sur Netlify.' }, 500);
  if (!sameSecret(req.headers.get('x-admin-key') || '', adminKey)) return json({ error: 'Clé admin incorrecte.' }, 401);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'JSON invalide' }, 400); }
  const { action, client = {}, id } = body;
  const serverUrl = env('REPONDEUR_PUBLIC_URL', SITE) + WEBHOOK_PATH;
  const secret = env('REPONDEUR_WEBHOOK_SECRET');
  const opts = { serverUrl, secret, voice: VOICES[body.voice] || VOICES.denise, model: body.model };

  switch (action) {
    case 'status':
      return json({
        vapi: !!env('VAPI_API_KEY'), twilio: !!(env('TWILIO_ACCOUNT_SID') && env('TWILIO_AUTH_TOKEN')),
        webhookSecret: !!secret, smsFrom: env('TWILIO_MESSAGING_SERVICE_SID') ? 'Messaging Service' : env('TWILIO_SMS_FROM', 'Vortex'), webhook: serverUrl,
      });

    case 'preview': {
      const miss = required(client);
      if (miss.length) return json({ error: `Champs manquants : ${miss.join(', ')}` }, 400);
      return json({ firstMessage: firstMessage(client), prompt: buildPrompt(client) });
    }

    case 'list': {
      const r = await vapi('/assistant?limit=100', {}, fetchImpl);
      if (!r.ok) return json({ error: r.data.message || 'Erreur Vapi' }, r.status);
      const ph = await vapi('/phone-number?limit=100', {}, fetchImpl);
      const numbers = ph.ok ? ph.data : [];
      const list = (Array.isArray(r.data) ? r.data : []).filter((a) => a.metadata?.vortex === 'repondeur').map((a) => ({
        id: a.id, biz: a.metadata.biz, notify: a.metadata.notify, createdAt: a.createdAt,
        numbers: numbers.filter((n) => n.assistantId === a.id).map((n) => n.number),
        client: (() => { try { return JSON.parse(a.metadata.client || '{}'); } catch { return {}; } })(),
      }));
      return json({ list });
    }

    case 'create':
    case 'update': {
      const miss = required(client);
      if (miss.length) return json({ error: `Champs manquants : ${miss.join(', ')}` }, 400);
      if (!e164(client.notify)) return json({ error: 'Numéro de notification invalide.' }, 400);
      if (!secret) return json({ error: 'REPONDEUR_WEBHOOK_SECRET n\'est pas configurée.' }, 500);
      const cfg = buildAssistant(client, opts);
      const r = action === 'create'
        ? await vapi('/assistant', { method: 'POST', body: cfg }, fetchImpl)
        : await vapi(`/assistant/${encodeURIComponent(id)}`, { method: 'PATCH', body: cfg }, fetchImpl);
      if (!r.ok) return json({ error: r.data.message ? [].concat(r.data.message).join(' · ') : `Erreur Vapi ${r.status}` }, r.status);
      return json({ ok: true, id: r.data.id });
    }

    case 'delete': {
      const r = await vapi(`/assistant/${encodeURIComponent(id)}`, { method: 'DELETE' }, fetchImpl);
      return r.ok ? json({ ok: true }) : json({ error: r.data.message || 'Erreur Vapi' }, r.status);
    }

    case 'import-number': {
      const number = e164(body.number);
      if (!number || !id) return json({ error: 'Numéro ou assistant manquant.' }, 400);
      const sid = env('TWILIO_ACCOUNT_SID'), token = env('TWILIO_AUTH_TOKEN');
      if (!sid || !token) return json({ error: 'Twilio n\'est pas configuré.' }, 500);
      const r = await vapi('/phone-number', { method: 'POST', body: { provider: 'twilio', number, twilioAccountSid: sid, twilioAuthToken: token, assistantId: id, name: String(body.label || number).slice(0, 40) } }, fetchImpl);
      if (!r.ok) return json({ error: r.data.message ? [].concat(r.data.message).join(' · ') : `Erreur Vapi ${r.status}` }, r.status);
      return json({ ok: true, phoneNumberId: r.data.id, number });
    }

    case 'test-sms': {
      const r = await sendSms(body.to, '✅ Test Vortex AI Répondeur : les messages de vos clients arriveront ici.', fetchImpl);
      return r.ok ? json({ ok: true }) : json({ error: r.error }, 400);
    }

    default:
      return json({ error: 'Action inconnue' }, 400);
  }
}

export default (req) => handle(req);
