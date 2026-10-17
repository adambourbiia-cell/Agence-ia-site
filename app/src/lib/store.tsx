import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { newId } from './money';
import type { Company, Doc, DocKind, State } from './types';

const STORAGE_KEY = 'dicta:v1';

const defaultCompany: Company = {
  name: '',
  address: '',
  siret: '',
  email: '',
  phone: '',
  vatRate: 20,
  vatExempt: false,
  paymentTermsDays: 30,
};

const initialState: State = { docs: [], company: defaultCompany, counters: {} };

type NewDoc = Omit<Doc, 'id' | 'number' | 'createdAt' | 'kind' | 'status'>;

type Store = State & {
  ready: boolean;
  createQuote: (doc: NewDoc) => Doc;
  updateDoc: (id: string, patch: Partial<Doc>) => void;
  deleteDoc: (id: string) => void;
  convertToInvoice: (quoteId: string) => Doc;
  updateCompany: (patch: Partial<Company>) => void;
};

const StoreContext = createContext<Store | null>(null);

/** Numérotation continue par année, exigée pour les factures. */
function nextNumber(state: State, kind: DocKind): [string, Record<string, number>] {
  const year = new Date().getFullYear();
  const key = `${kind}-${year}`;
  const n = (state.counters[key] ?? 0) + 1;
  const prefix = kind === 'quote' ? 'D' : 'F';
  return [`${prefix}-${year}-${String(n).padStart(3, '0')}`, { ...state.counters, [key]: n }];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as State;
        setState({ ...initialState, ...saved, company: { ...defaultCompany, ...saved.company } });
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  // Les créations calculent le nouvel état de façon synchrone pour pouvoir
  // renvoyer le document (et naviguer vers lui) tout de suite.
  const createQuote = useCallback(
    (input: NewDoc) => {
      const [number, counters] = nextNumber(state, 'quote');
      const doc: Doc = { ...input, id: newId(), number, kind: 'quote', status: 'draft', createdAt: new Date().toISOString() };
      setState({ ...state, docs: [doc, ...state.docs], counters });
      return doc;
    },
    [state],
  );

  const convertToInvoice = useCallback(
    (quoteId: string) => {
      const quote = state.docs.find((d) => d.id === quoteId);
      if (!quote) throw new Error('Devis introuvable');
      const existing = state.docs.find((d) => d.sourceQuoteId === quoteId);
      if (existing) return existing;
      const [number, counters] = nextNumber(state, 'invoice');
      const invoice: Doc = {
        ...quote,
        id: newId(),
        number,
        kind: 'invoice',
        status: 'sent',
        createdAt: new Date().toISOString(),
        sourceQuoteId: quoteId,
        lines: quote.lines.map((l) => ({ ...l, estimated: false })),
      };
      const docs = state.docs.map((d) => (d.id === quoteId ? { ...d, status: 'accepted' as const } : d));
      setState({ ...state, docs: [invoice, ...docs], counters });
      return invoice;
    },
    [state],
  );

  const updateDoc = useCallback((id: string, patch: Partial<Doc>) => {
    setState((s) => ({ ...s, docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  }, []);

  const deleteDoc = useCallback((id: string) => {
    // Une facture émise ne se supprime pas (obligation légale) : seuls les devis.
    setState((s) => ({ ...s, docs: s.docs.filter((d) => d.id !== id || d.kind === 'invoice') }));
  }, []);

  const updateCompany = useCallback((patch: Partial<Company>) => {
    setState((s) => ({ ...s, company: { ...s.company, ...patch } }));
  }, []);

  const value = useMemo(
    () => ({ ...state, ready, createQuote, updateDoc, deleteDoc, convertToInvoice, updateCompany }),
    [state, ready, createQuote, updateDoc, deleteDoc, convertToInvoice, updateCompany],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore doit être utilisé dans <StoreProvider>');
  return store;
}
