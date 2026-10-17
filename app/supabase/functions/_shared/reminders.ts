// Relances des factures impayées : calendrier et contenu des e-mails. Fichier pur, testé à part.

export type InvoiceLine = { description: string; quantity: number; unitPrice: number };
export type InvoiceData = {
  number: string;
  title: string;
  clientName: string;
  clientEmail: string;
  createdAt: string;
  lines: InvoiceLine[];
  status: string;
  autoRemind?: boolean;
};
export type CompanyData = {
  name?: string;
  email?: string;
  phone?: string;
  vatRate?: number;
  vatExempt?: boolean;
  paymentTermsDays?: number;
};

const DAY = 24 * 60 * 60 * 1000;

/** Jours après l'échéance où partent les relances n°1, 2 et 3. */
export const REMINDER_OFFSETS_DAYS = [1, 8, 15];

export function dueDate(invoice: Pick<InvoiceData, 'createdAt'>, company: CompanyData) {
  return new Date(new Date(invoice.createdAt).getTime() + (company.paymentTermsDays ?? 30) * DAY);
}

/** Numéro de la relance à envoyer maintenant (1 à 3), ou null. */
export function reminderToSend(
  invoice: InvoiceData,
  company: CompanyData,
  remindersSent: number,
  lastReminderAt: string | null,
  now: Date,
): number | null {
  if (invoice.status === 'paid' || invoice.autoRemind === false || !invoice.clientEmail) return null;
  if (remindersSent >= REMINDER_OFFSETS_DAYS.length) return null;
  const sendAt = dueDate(invoice, company).getTime() + REMINDER_OFFSETS_DAYS[remindersSent] * DAY;
  if (now.getTime() < sendAt) return null;
  // Garde-fou si le cron a pris du retard : au moins 5 jours entre deux relances.
  if (lastReminderAt && now.getTime() - new Date(lastReminderAt).getTime() < 5 * DAY) return null;
  return remindersSent + 1;
}

export function invoiceTotal(lines: InvoiceLine[], company: CompanyData) {
  const ht = Math.round(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 100) / 100;
  const rate = company.vatExempt ? 0 : (company.vatRate ?? 20);
  return Math.round((ht + (ht * rate) / 100) * 100) / 100;
}

const eur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const day = (d: Date | string) => new Date(d).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function reminderEmail(invoice: InvoiceData, company: CompanyData, n: number) {
  const total = eur(invoiceTotal(invoice.lines, company));
  const subject = [
    `Facture ${invoice.number} : rappel d’échéance`,
    `Relance : facture ${invoice.number} en attente de règlement`,
    `Dernière relance : facture ${invoice.number}`,
  ][n - 1];
  const paragraphs = [
    `Bonjour${invoice.clientName ? ' ' + invoice.clientName : ''},`,
    `Sauf erreur de notre part, la facture ${invoice.number} du ${day(invoice.createdAt)} ` +
      `(« ${invoice.title} »), d’un montant de ${total} TTC, arrivée à échéance le ${day(dueDate(invoice, company))}, ` +
      `n’a pas encore été réglée.`,
    n === 3
      ? 'Sans règlement de votre part, des pénalités de retard et l’indemnité forfaitaire de 40 € pour frais de ' +
        'recouvrement pourront être appliquées (art. L441-10 du Code de commerce).'
      : 'Merci de bien vouloir procéder à son règlement dès que possible.',
    'Si vous avez déjà effectué le paiement, merci de ne pas tenir compte de ce message.',
    'Cordialement,',
    [company.name, company.phone, company.email].filter(Boolean).join('\n'),
  ];
  return {
    subject,
    text: paragraphs.join('\n\n'),
    html:
      paragraphs.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('') +
      '<p style="color:#94a3b8;font-size:12px">Envoyé avec Dicta</p>',
  };
}
