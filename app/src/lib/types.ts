export type Unit = 'u' | 'h' | 'jour' | 'm²' | 'm³' | 'ml' | 'kg' | 'forfait';

export const UNITS: Unit[] = ['u', 'h', 'jour', 'm²', 'm³', 'ml', 'kg', 'forfait'];

export type Line = {
  id: string;
  description: string;
  quantity: number;
  unit: Unit;
  /** Prix unitaire HT, en euros. */
  unitPrice: number;
  /** Prix proposé par l'IA (pas dicté) : l'artisan doit le vérifier. */
  estimated?: boolean;
};

export type DocKind = 'quote' | 'invoice';

export type DocStatus = 'draft' | 'sent' | 'accepted' | 'paid';

export type Doc = {
  id: string;
  kind: DocKind;
  /** D-2026-001 pour un devis, F-2026-001 pour une facture. */
  number: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  lines: Line[];
  status: DocStatus;
  createdAt: string;
  /** Pour une facture : le devis d'origine. */
  sourceQuoteId?: string;
  /** Texte dicté d'origine, gardé pour pouvoir régénérer. */
  dictation?: string;
};

export type Company = {
  name: string;
  address: string;
  siret: string;
  email: string;
  phone: string;
  /** Taux de TVA en %, ignoré si vatExempt. */
  vatRate: number;
  /** Micro-entreprise en franchise de TVA (art. 293 B du CGI). */
  vatExempt: boolean;
  /** Délai de paiement des factures, en jours. */
  paymentTermsDays: number;
};

export type State = {
  docs: Doc[];
  company: Company;
  /** Derniers numéros attribués, par type et par année : { "quote-2026": 3 }. */
  counters: Record<string, number>;
};
