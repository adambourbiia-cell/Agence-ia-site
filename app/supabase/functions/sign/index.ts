// Fonction publique utilisée par la page de signature (dossier `sign/` à la racine du dépôt).
// GET  ?t=<jeton>                       -> le devis à afficher
// POST { t, name, signature, accept }   -> enregistre la signature du client
// Déployer sans vérification de JWT : `supabase functions deploy sign --no-verify-jwt`
import { admin, corsHeaders, json } from '../_shared/http.ts';
import { notifyUser } from '../_shared/push.ts';

const TOKEN = /^[a-f0-9]{32}$/;
const PNG = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
const MAX_SIGNATURE_LENGTH = 300_000;

async function findQuote(token: string) {
  const { data, error } = await admin
    .from('documents')
    .select('id, user_id, number, data, signed_at, signer_name')
    .eq('share_token', token)
    .eq('kind', 'quote')
    .eq('deleted', false)
    .maybeSingle();
  if (error) throw error;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (req.method === 'GET') {
      const token = new URL(req.url).searchParams.get('t') ?? '';
      if (!TOKEN.test(token)) return json({ error: 'Lien invalide' }, 400);
      const quote = await findQuote(token);
      if (!quote) return json({ error: 'Ce devis n’existe pas ou a été retiré.' }, 404);

      const { data: profile } = await admin.from('profiles').select('company').eq('user_id', quote.user_id).maybeSingle();
      const c = profile?.company ?? {};
      const d = quote.data;
      // On n'expose que ce que le client doit voir.
      return json({
        number: quote.number,
        title: d.title,
        clientName: d.clientName,
        clientAddress: d.clientAddress,
        createdAt: d.createdAt,
        lines: d.lines.map((l: Record<string, unknown>) => ({
          description: l.description,
          quantity: l.quantity,
          unit: l.unit,
          unitPrice: l.unitPrice,
        })),
        company: {
          name: c.name ?? '',
          address: c.address ?? '',
          siret: c.siret ?? '',
          email: c.email ?? '',
          phone: c.phone ?? '',
          vatRate: c.vatRate ?? 20,
          vatExempt: c.vatExempt ?? false,
        },
        signedAt: quote.signed_at,
        signerName: quote.signer_name,
      });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const token = String(body.t ?? '');
      const name = String(body.name ?? '').trim();
      const signature = String(body.signature ?? '');
      if (!TOKEN.test(token)) return json({ error: 'Lien invalide' }, 400);
      if (body.accept !== true) return json({ error: 'Merci de cocher « Bon pour accord ».' }, 400);
      if (name.length < 2 || name.length > 100) return json({ error: 'Indique ton nom complet.' }, 400);
      if (!PNG.test(signature) || signature.length > MAX_SIGNATURE_LENGTH) return json({ error: 'Signature invalide.' }, 400);

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null;
      // `signed_at is null` : une signature ne peut être ni écrasée ni rejouée.
      const { data, error } = await admin
        .from('documents')
        .update({ signed_at: new Date().toISOString(), signer_name: name, signature, signer_ip: ip })
        .eq('share_token', token)
        .eq('kind', 'quote')
        .eq('deleted', false)
        .is('signed_at', null)
        .select('id, user_id, number, signed_at')
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: 'Ce devis est déjà signé ou n’est plus disponible.' }, 409);
      await notifyUser(data.user_id, {
        title: 'Devis signé ✍️',
        body: `${name} a signé le devis ${data.number}. Tu peux lancer le chantier !`,
        data: { docId: data.id },
      });
      return json({ signedAt: data.signed_at });
    }

    return json({ error: 'Méthode non autorisée' }, 405);
  } catch (e) {
    console.error('sign error', e);
    return json({ error: 'Erreur serveur, réessaie dans un instant.' }, 500);
  }
});
