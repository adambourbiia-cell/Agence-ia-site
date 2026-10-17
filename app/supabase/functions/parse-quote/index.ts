// Fonction Supabase : transforme une description de chantier dictée en lignes de devis.
// La clé ANTHROPIC_API_KEY reste ici, côté serveur : `supabase secrets set ANTHROPIC_API_KEY=...`
import Anthropic from 'npm:@anthropic-ai/sdk@^0.135.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@^0.135.0/helpers/zod';
import { z } from 'npm:zod@^4.6.0';

import { admin, corsHeaders, json } from '../_shared/http.ts';

const QuoteSchema = z.object({
  title: z.string().describe('Objet court du devis, ex. « Rénovation salle de bain »'),
  client_name: z.string().describe('Nom du client si mentionné, sinon chaîne vide'),
  lines: z.array(
    z.object({
      description: z.string().describe('Désignation claire et professionnelle de la prestation'),
      quantity: z.number(),
      unit: z.enum(['u', 'h', 'jour', 'm²', 'm³', 'ml', 'kg', 'forfait']),
      unit_price: z.number().describe('Prix unitaire HT en euros'),
      price_estimated: z.boolean().describe('true si le prix n’a pas été dicté et a été estimé'),
    }),
  ),
});

const SYSTEM = `Tu aides des artisans et indépendants français à rédiger leurs devis.
On te donne la transcription d'une description de chantier dictée à l'oral (avec des fautes de reconnaissance vocale possibles).
Produis les lignes du devis :
- une ligne par prestation ou fourniture distincte, avec une désignation professionnelle ;
- garde exactement les quantités et prix dictés ; un prix dicté est HT sauf mention contraire (convertis un prix TTC en HT à 20 %) ;
- si un prix n'est pas donné, estime un prix HT réaliste du marché français actuel et mets price_estimated à true ;
- la main d'œuvre en jours ou en heures va dans une ligne à part ;
- n'invente pas de prestations qui n'ont pas été mentionnées.`;

const anthropic = new Anthropic();

/** Plan gratuit : dictées IA par mois calendaire. Dicta Pro : illimité. */
const FREE_MONTHLY_DICTATIONS = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Réservé aux comptes connectés : la clé publique seule ne suffit pas.
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
  const { data: auth } = await admin.auth.getUser(jwt);
  if (!auth.user) return json({ error: 'Connecte-toi pour utiliser l’IA.' }, 401);

  const { data: pro } = await admin.rpc('is_pro', { uid: auth.user.id });
  if (!pro) {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count } = await admin
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.user.id)
      .gte('created_at', monthStart.toISOString());
    if ((count ?? 0) >= FREE_MONTHLY_DICTATIONS) {
      return json({ error: `Tu as utilisé tes ${FREE_MONTHLY_DICTATIONS} dictées IA gratuites ce mois-ci.`, code: 'quota' }, 402);
    }
  }

  const { text } = await req.json().catch(() => ({ text: '' }));
  if (typeof text !== 'string' || !text.trim()) return json({ error: 'Texte manquant' }, 400);
  if (text.length > 8000) return json({ error: 'Description trop longue' }, 400);

  try {
    const response = await anthropic.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'low', format: zodOutputFormat(QuoteSchema) },
      system: SYSTEM,
      messages: [{ role: 'user', content: text }],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return json({ error: 'L’IA n’a pas pu analyser cette description. Reformule ou saisis le devis à la main.' }, 422);
    }
    await admin.from('ai_usage').insert({ user_id: auth.user.id });
    return json(response.parsed_output);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'Trop de demandes, réessaie dans un instant.' }, 429);
    if (e instanceof Anthropic.APIError) {
      console.error('Anthropic API error', e.status, e.message);
      return json({ error: 'Le service IA est indisponible.' }, 502);
    }
    throw e;
  }
});
