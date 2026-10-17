import { newId } from './money';
import { UNITS, type Line, type Unit } from './types';

export type ParsedQuote = {
  title: string;
  clientName: string;
  lines: Line[];
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const aiConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

type RemoteLine = { description: string; quantity: number; unit: string; unit_price: number; price_estimated: boolean };
type RemoteQuote = { title: string; client_name: string; lines: RemoteLine[] };

/**
 * Transforme une description dictée en lignes de devis.
 * La clé Claude reste côté serveur (fonction Supabase `parse-quote`) ;
 * sans backend configuré, on crée une ligne unique à compléter à la main.
 */
export async function parseDictation(text: string): Promise<ParsedQuote> {
  if (!aiConfigured) {
    return {
      title: text.slice(0, 60),
      clientName: '',
      lines: [{ id: newId(), description: text, quantity: 1, unit: 'forfait', unitPrice: 0, estimated: true }],
    };
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/parse-quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Erreur serveur (${res.status})`);
  }
  const data = (await res.json()) as RemoteQuote;
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
