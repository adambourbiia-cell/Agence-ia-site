import type { Company, Line } from './types';

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export const formatEur = (amount: number) => eur.format(amount);

const round2 = (n: number) => Math.round(n * 100) / 100;

export function totals(lines: Line[], company: Company) {
  const ht = round2(lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));
  const vatRate = company.vatExempt ? 0 : company.vatRate;
  const vat = round2((ht * vatRate) / 100);
  return { ht, vatRate, vat, ttc: round2(ht + vat) };
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
