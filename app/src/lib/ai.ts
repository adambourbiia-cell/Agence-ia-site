import { newId } from './money';
import { supabase } from './supabase';
import { UNITS, type Line, type Unit } from './types';

/** Quota de dictées IA du plan gratuit atteint : proposer Dicta Pro. */
export class QuotaError extends Error {}

export type ParsedQuote = {
  title: string;
  clientName: string;
  lines: Line[];
};

type RemoteLine = { description: string; quantity: number; unit: string; unit_price: number; price_estimated: boolean };
type RemoteQuote = { title: string; client_name: string; lines: RemoteLine[] };

/**
 * Transforme une description dictée en lignes de devis.
 * La clé Claude reste côté serveur (fonction Supabase `parse-quote`), réservée
 * aux comptes connectés ; sinon on crée une ligne unique à compléter à la main.
 */
export async function parseDictation(text: string, signedIn: boolean): Promise<ParsedQuote> {
  if (!supabase || !signedIn) {
    return {
      title: text.slice(0, 60),
      clientName: '',
      lines: [{ id: newId(), description: text, quantity: 1, unit: 'forfait', unitPrice: 0, estimated: true }],
    };
  }

  // invoke() ajoute le jeton de session de l'utilisateur connecté.
  const { data, error } = await supabase.functions.invoke<RemoteQuote>('parse-quote', { body: { text } });
  if (error || !data) {
    const body = error && 'context' in error ? await (error.context as Response).json().catch(() => null) : null;
    if (body?.code === 'quota') throw new QuotaError(body.error);
    throw new Error(body?.error ?? 'Le service IA est indisponible.');
  }
  return {
    title: data.title,
    clientName: data.client_name,
    lines: data.lines.map((l) => ({
      id: newId(),
      description: l.description,
      quantity: l.quantity,
      unit: (UNITS as string[]).includes(l.unit) ? (l.unit as Unit) : 'u',
      unitPrice: l.unit_price,
      estimated: l.price_estimated,
    })),
  };
}
