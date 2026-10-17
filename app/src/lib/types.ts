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
  /** Dernière modification, sert à la synchro (la plus récente gagne). */
  updatedAt: string;
  /** Suppression synchronisée (on garde une trace côté serveur). */
  deleted?: boolean;
  /** Jeton du lien de signature envoyé au client. */
  shareToken?: string;
  /** Signature du client, écrite uniquement par le serveur. */
  signedAt?: string;
  signerName?: string;
  /** Image PNG de la signature (data URL). */
  signature?: string;
  /** Facture : relances automatiques par e-mail (Pro), activées par défaut. */
  autoRemind?: boolean;
  /** Relances envoyées par le serveur. */
  remindersSent?: number;
  lastReminderAt?: string;
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
  companyUpdatedAt: string;
  /** Derniers numéros attribués, par type et par année : { "quote-2026": 3 }. */
  counters: Record<string, number>;
};
