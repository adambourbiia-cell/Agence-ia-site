import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { formatDate, formatEur, totals } from './money';
import type { Company, Doc } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>');

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function renderDocHtml(doc: Doc, company: Company) {
  const t = totals(doc.lines, company);
  const isInvoice = doc.kind === 'invoice';
  const rows = doc.lines
    .map(
      (l) => `<tr>
        <td>${esc(l.description)}</td>
        <td class="n">${l.quantity.toLocaleString('fr-FR')} ${esc(l.unit)}</td>
        <td class="n">${formatEur(l.unitPrice)}</td>
        <td class="n">${formatEur(l.quantity * l.unitPrice)}</td>
      </tr>`,
    )
    .join('');

  const legal = isInvoice
    ? `<p>Échéance : ${formatDate(addDays(doc.createdAt, company.paymentTermsDays))}.
       En cas de retard, pénalités au taux de 3 fois le taux d'intérêt légal et indemnité forfaitaire
       pour frais de recouvrement de 40 € (art. L441-10 du Code de commerce).</p>`
    : doc.signedAt
      ? `<p>Bon pour accord, signé électroniquement par ${esc(doc.signerName ?? '')} le ${formatDate(doc.signedAt)}
         à ${new Date(doc.signedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.</p>
         ${doc.signature && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(doc.signature) ? `<img class="sig" src="${doc.signature}">` : ''}`
      : `<p>Devis valable 30 jours. Bon pour accord, date et signature du client :</p><div class="sign"></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 32px; font-size: 12px; }
    .head { display: flex; justify-content: space-between; margin-bottom: 32px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .muted { color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; border-bottom: 2px solid #111; padding: 6px 4px; }
    td { border-bottom: 1px solid #ddd; padding: 6px 4px; vertical-align: top; }
    .n { text-align: right; white-space: nowrap; }
    .totals { margin-left: auto; width: 260px; margin-top: 16px; }
    .totals td { border: none; }
    .ttc td { font-weight: bold; font-size: 14px; border-top: 2px solid #111; }
    .legal { margin-top: 32px; font-size: 10px; color: #444; }
    .sign { border: 1px solid #aaa; height: 70px; width: 260px; }
    .sig { height: 70px; }
  </style></head><body>
    <div class="head">
      <div>
        <strong>${esc(company.name || 'Votre entreprise')}</strong><br>
        ${esc(company.address)}<br>
        ${company.siret ? `SIRET ${esc(company.siret)}<br>` : ''}
        ${esc([company.email, company.phone].filter(Boolean).join(' · '))}
      </div>
      <div style="text-align:right">
        <h1>${isInvoice ? 'Facture' : 'Devis'} ${esc(doc.number)}</h1>
        <span class="muted">Date : ${formatDate(doc.createdAt)}</span><br><br>
        <strong>${esc(doc.clientName || 'Client')}</strong><br>
        ${esc(doc.clientAddress)}
      </div>
    </div>
    <strong>Objet : ${esc(doc.title)}</strong>
    <table>
      <thead><tr><th>Désignation</th><th class="n">Quantité</th><th class="n">PU HT</th><th class="n">Total HT</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="totals">
      <tr><td>Total HT</td><td class="n">${formatEur(t.ht)}</td></tr>
      ${company.vatExempt ? '' : `<tr><td>TVA ${t.vatRate} %</td><td class="n">${formatEur(t.vat)}</td></tr>`}
      <tr class="ttc"><td>Total TTC</td><td class="n">${formatEur(t.ttc)}</td></tr>
    </table>
    <div class="legal">
      ${company.vatExempt ? '<p>TVA non applicable, art. 293 B du CGI.</p>' : ''}
      ${legal}
    </div>
  </body></html>`;
}

export async function shareDocPdf(doc: Doc, company: Company) {
  const { uri } = await Print.printToFileAsync({ html: renderDocHtml(doc, company) });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `${doc.kind === 'invoice' ? 'Facture' : 'Devis'} ${doc.number}`,
  });
}
