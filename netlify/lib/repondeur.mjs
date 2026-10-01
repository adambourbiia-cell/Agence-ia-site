/* AI Répondeur — logique partagée : configuration de l'assistant vocal (Vapi),
   notifications SMS (Twilio) et utilitaires. Aucune dépendance externe. */

export const env = (k, d = '') => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k] ?? d);

export const SITE = 'https://vortex-agence.fr';
export const WEBHOOK_PATH = '/.netlify/functions/repondeur-webhook';
export const TOOL_NAME = 'enregistrer_demande';

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/* Compare deux secrets sans fuite de temps */
export const sameSecret = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

/* +33 6 12 34 56 78 → +33612345678 ; 06 12… → +33612… */
export const e164 = (p) => {
  let d = String(p || '').replace(/[^\d+]/g, '');
  if (d.startsWith('00')) d = '+' + d.slice(2);
  if (/^0\d{9}$/.test(d)) d = '+33' + d.slice(1);
  if (/^\d{11,15}$/.test(d)) d = '+' + d;
  return /^\+\d{10,15}$/.test(d) ? d : '';
};

/* 0612345678 lisible : 06 12 34 56 78 */
export const pretty = (p) => {
  const n = e164(p);
  if (n.startsWith('+33') && n.length === 12) return ('0' + n.slice(3)).replace(/(\d{2})(?=\d)/g, '$1 ');
  return n || String(p || '');
};

const clean = (s, max = 600) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/* ---------- Prompt de l'assistant ---------- */
export function buildPrompt(c) {
  const lines = [
    `Tu es l'assistante téléphonique virtuelle de « ${clean(c.biz, 120)} »${c.job ? `, ${clean(c.job, 120)}` : ''}${c.city ? ` à ${clean(c.city, 120)}` : ''}.`,
    `Tu réponds quand ${clean(c.owner, 60) || 'le gérant'} ne peut pas décrocher. Tu parles français, avec des phrases courtes, chaleureuses et naturelles, comme une secrétaire expérimentée. Une seule question à la fois.`,
    '',
    'TA MISSION',
    '1. Comprendre la raison de l\'appel.',
    '2. Recueillir : le nom de la personne, un numéro où la rappeler (propose celui qui appelle et fais-le confirmer), la commune ou l\'adresse d\'intervention si c\'est utile, le besoin précis, le degré d\'urgence et le meilleur moment pour rappeler.',
    `3. Dès que tu as ces informations, appelle l'outil ${TOOL_NAME} (une seule fois), puis confirme que le message est transmis et que ${clean(c.owner, 60) || 'l\'équipe'} rappelle ${clean(c.callback, 80) || 'au plus vite'}.`,
    '4. Demande s\'il y a autre chose, puis termine poliment l\'appel.',
    '',
    'RÈGLES',
    '- Tu es une assistante virtuelle : si on te le demande, dis-le simplement.',
    '- N\'invente jamais un prix, un délai, une disponibilité ou une information absente ci-dessous. Si tu ne sais pas, dis que le gérant précisera en rappelant.',
    '- Ne prends pas de rendez-vous ferme : note la préférence du client, le gérant confirmera.',
    '- Ne demande jamais de coordonnées bancaires ni d\'informations sensibles.',
    '- Si la personne démarche commercialement, note simplement son nom, sa société et son numéro, sans t\'engager.',
    '- Si c\'est une urgence vitale (incendie, fuite de gaz, malaise…), dis d\'appeler immédiatement le 112 ou le 18.',
    '- Les numéros de téléphone se lisent chiffre par chiffre, par paires.',
    '',
    'INFORMATIONS SUR L\'ENTREPRISE',
  ];
  const info = [
    ['Activité', c.job], ['Services', c.services], ['Zone d\'intervention', c.zone],
    ['Horaires', c.hours], ['Tarifs indicatifs (à ne donner que s\'ils figurent ici)', c.prices],
    ['Urgences', c.urgency], ['Adresse', c.address], ['Site internet', c.website],
    ['Autres informations utiles', c.faq],
  ];
  for (const [k, v] of info) if (clean(v)) lines.push(`- ${k} : ${clean(v, 1200)}`);
  return lines.join('\n');
}

export function firstMessage(c) {
  const owner = clean(c.owner, 60);
  return clean(c.greeting, 300) ||
    `Bonjour, vous êtes bien chez ${clean(c.biz, 120)}. Je suis l'assistante virtuelle : ${owner || 'l\'équipe'} n'est pas disponible pour le moment, mais je prends votre message et on vous rappelle rapidement. C'est à quel sujet ?`;
}

export const toolDefinition = (serverUrl, secret) => ({
  type: 'function',
  function: {
    name: TOOL_NAME,
    description: 'Transmet immédiatement au gérant, par SMS, la demande du client une fois les informations recueillies.',
    parameters: {
      type: 'object',
      properties: {
        nom: { type: 'string', description: 'Nom (et prénom si donné) de l\'appelant' },
        telephone: { type: 'string', description: 'Numéro de rappel confirmé par l\'appelant' },
        besoin: { type: 'string', description: 'Description courte et précise de la demande' },
        urgence: { type: 'string', enum: ['urgent', 'normal', 'pas pressé'], description: 'Degré d\'urgence' },
        adresse: { type: 'string', description: 'Commune ou adresse d\'intervention, si donnée' },
        rappel: { type: 'string', description: 'Meilleur moment pour rappeler, si donné' },
      },
      required: ['nom', 'besoin'],
    },
  },
  server: { url: serverUrl, headers: { 'x-vortex-secret': secret } },
});

/* Configuration complète envoyée à Vapi (POST /assistant ou PATCH /assistant/:id) */
export function buildAssistant(c, { serverUrl, secret, voice, model } = {}) {
  const v = voice || { provider: 'azure', voiceId: 'fr-FR-DeniseNeural' };
  return {
    name: `Vortex · ${clean(c.biz, 30)}`.slice(0, 40),
    firstMessage: firstMessage(c),
    firstMessageMode: 'assistant-speaks-first',
    transcriber: { provider: 'deepgram', model: 'nova-2', language: 'fr' },
    voice: v,
    model: {
      provider: model?.provider || 'openai',
      model: model?.model || 'gpt-4o-mini',
      temperature: 0.4,
      messages: [{ role: 'system', content: buildPrompt(c) }],
      tools: [toolDefinition(serverUrl, secret), { type: 'endCall' }],
    },
    endCallMessage: 'Merci pour votre appel, bonne journée !',
    maxDurationSeconds: 420,
    silenceTimeoutSeconds: 25,
    artifactPlan: { recordingEnabled: false },
    server: { url: serverUrl, headers: { 'x-vortex-secret': secret } },
    serverMessages: ['end-of-call-report'],
    metadata: {
      vortex: 'repondeur',
      biz: clean(c.biz, 120),
      notify: e164(c.notify),
      email: clean(c.email, 120),
      owner: clean(c.owner, 60),
      client: JSON.stringify(c).slice(0, 4000),
    },
  };
}

/* ---------- Lecture des appels d'outil (formats Vapi « toolCallList » et OpenAI) ---------- */
export function readToolCalls(message) {
  const list = message?.toolCallList || message?.toolCalls || [];
  return list.map((t) => {
    let args = t.parameters ?? t.arguments ?? t.function?.arguments ?? {};
    if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = {}; } }
    return { id: t.id, name: t.name || t.function?.name, args };
  });
}

/* Le message a-t-il déjà été transmis pendant l'appel ? */
export function toolWasCalled(message) {
  const msgs = message?.artifact?.messages || message?.messages || [];
  return msgs.some((m) => {
    const calls = m.toolCalls || m.tool_calls || [];
    return calls.some((t) => (t.function?.name || t.name) === TOOL_NAME) || m.name === TOOL_NAME;
  });
}

/* ---------- Textes des SMS ---------- */
export function smsForRequest(meta, a, callerNumber) {
  const tel = pretty(a.telephone) || pretty(callerNumber) || 'non communiqué';
  const urg = a.urgence === 'urgent' ? '🔴 URGENT' : a.urgence === 'pas pressé' ? 'Pas pressé' : 'Normal';
  return [
    `📞 Nouveau message — ${meta.biz || 'AI Répondeur'}`,
    `👤 ${clean(a.nom, 80) || 'Nom non donné'}`,
    `☎️ ${tel}`,
    `📝 ${clean(a.besoin, 300) || '—'}`,
    a.adresse ? `📍 ${clean(a.adresse, 120)}` : '',
    `⏱ ${urg}${a.rappel ? ` · rappeler : ${clean(a.rappel, 80)}` : ''}`,
    '— Vortex AI Répondeur',
  ].filter(Boolean).join('\n');
}

export function smsForMissed(meta, callerNumber, message) {
  const tel = pretty(callerNumber) || 'numéro masqué';
  const said = (message?.artifact?.messages || message?.messages || [])
    .filter((m) => m.role === 'user' && (m.message || m.content))
    .map((m) => m.message || m.content).join(' ');
  const summary = clean(message?.analysis?.summary || message?.summary || said, 280);
  return [
    `📞 Appel de ${tel} — ${meta.biz || 'AI Répondeur'}`,
    summary ? `📝 ${summary}` : '📝 Aucun message laissé (l\'appelant a raccroché).',
    callerNumber ? 'Pensez à rappeler 🙂' : '',
    '— Vortex AI Répondeur',
  ].filter(Boolean).join('\n');
}

/* ---------- Envoi SMS (Twilio) ---------- */
export async function sendSms(to, body, fetchImpl = fetch) {
  const sid = env('TWILIO_ACCOUNT_SID'), token = env('TWILIO_AUTH_TOKEN');
  const from = env('TWILIO_SMS_FROM', 'Vortex'), service = env('TWILIO_MESSAGING_SERVICE_SID');
  const dest = e164(to);
  if (!sid || !token) return { ok: false, error: 'Twilio non configuré (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)' };
  if (!dest) return { ok: false, error: 'Numéro de destination invalide' };
  const form = new URLSearchParams({ To: dest, Body: body.slice(0, 1500) });
  if (service) form.set('MessagingServiceSid', service); else form.set('From', from);
  const r = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const data = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, sid: data.sid } : { ok: false, error: data.message || `Twilio ${r.status}` };
}

/* ---------- API Vapi ---------- */
export async function vapi(path, { method = 'GET', body } = {}, fetchImpl = fetch) {
  const key = env('VAPI_API_KEY');
  if (!key) return { ok: false, status: 500, data: { message: 'VAPI_API_KEY manquante' } };
  const r = await fetchImpl(`https://api.vapi.ai${path}`, {
    method,
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}
