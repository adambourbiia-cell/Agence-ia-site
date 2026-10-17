import type { State } from './types';

/** Exemples affichés au premier lancement de la version web de démonstration. */
export function demoState(base: State): State {
  const now = new Date();
  const year = now.getFullYear();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();
  return {
    ...base,
    counters: { [`quote-${year}`]: 2, [`invoice-${year}`]: 1 },
    docs: [
      {
        id: 'exemple-devis-1',
        kind: 'quote',
        number: `D-${year}-002`,
        title: 'Rénovation salle de bain (exemple)',
        clientName: 'Mme Martin',
        clientEmail: '',
        clientAddress: '12 rue des Lilas\n69003 Lyon',
        status: 'sent',
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
        lines: [
          { id: 'l1', description: 'Dépose de la baignoire existante et évacuation', quantity: 1, unit: 'forfait', unitPrice: 350 },
          { id: 'l2', description: 'Fourniture et pose receveur de douche 90×120', quantity: 1, unit: 'u', unitPrice: 680, estimated: true },
          { id: 'l3', description: 'Fourniture et pose de faïence murale', quantity: 6, unit: 'm²', unitPrice: 45 },
          { id: 'l4', description: 'Main d’œuvre plomberie', quantity: 2, unit: 'jour', unitPrice: 380 },
        ],
      },
      {
        id: 'exemple-facture-1',
        kind: 'invoice',
        number: `F-${year}-001`,
        title: 'Remplacement chauffe-eau 200 L (exemple)',
        clientName: 'M. Bernard',
        clientEmail: '',
        clientAddress: '4 place Bellecour\n69002 Lyon',
        status: 'sent',
        createdAt: daysAgo(12),
        updatedAt: daysAgo(12),
        sourceQuoteId: 'exemple-devis-0',
        lines: [
          { id: 'l5', description: 'Chauffe-eau électrique 200 L', quantity: 1, unit: 'u', unitPrice: 590 },
          { id: 'l6', description: 'Dépose, pose et mise en service', quantity: 4, unit: 'h', unitPrice: 55 },
        ],
      },
      {
        id: 'exemple-devis-0',
        kind: 'quote',
        number: `D-${year}-001`,
        title: 'Remplacement chauffe-eau 200 L (exemple)',
        clientName: 'M. Bernard',
        clientEmail: '',
        clientAddress: '4 place Bellecour\n69002 Lyon',
        status: 'accepted',
        createdAt: daysAgo(15),
        updatedAt: daysAgo(12),
        lines: [
          { id: 'l7', description: 'Chauffe-eau électrique 200 L', quantity: 1, unit: 'u', unitPrice: 590 },
          { id: 'l8', description: 'Dépose, pose et mise en service', quantity: 4, unit: 'h', unitPrice: 55 },
        ],
      },
    ],
  };
}
