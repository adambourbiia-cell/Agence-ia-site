import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { docToUpsert, mergeCompany, mergeCounters, mergeDocs, rowToDoc, type DocumentRow } from './merge';
import { newId } from './money';
import { SIGN_URL, supabase } from './supabase';
import type { Company, Doc, DocKind, State } from './types';

const STORAGE_KEY = 'dicta:v1';
const EPOCH = new Date(0).toISOString();
const DOC_COLUMNS = 'id, kind, number, data, deleted, updated_at, share_token, signed_at, signer_name, signature';

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

const initialState: State = { docs: [], company: defaultCompany, companyUpdatedAt: EPOCH, counters: {} };

type NewDoc = Pick<Doc, 'title' | 'clientName' | 'clientEmail' | 'clientAddress' | 'lines' | 'dictation'>;

export type SyncStatus = { state: 'off' | 'idle' | 'syncing' | 'error'; error?: string; lastAt?: string };

type Store = Omit<State, 'companyUpdatedAt'> & {
  ready: boolean;
  session: Session | null;
  sync: SyncStatus;
  createQuote: (doc: NewDoc) => Doc;
  updateDoc: (id: string, patch: Partial<Doc>) => void;
  deleteDoc: (id: string) => void;
  convertToInvoice: (quoteId: string) => Doc;
  updateCompany: (patch: Partial<Company>) => void;
  syncNow: () => Promise<void>;
  /** Publie le devis et renvoie le lien de signature à envoyer au client. */
  requestSignature: (id: string) => Promise<string>;
  signOut: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

const now = () => new Date().toISOString();

/** Numérotation continue par année, exigée pour les factures. */
function nextNumber(state: State, kind: DocKind): [string, Record<string, number>] {
  const year = new Date().getFullYear();
  const key = `${kind}-${year}`;
  const n = (state.counters[key] ?? 0) + 1;
  const prefix = kind === 'quote' ? 'D' : 'F';
  return [`${prefix}-${year}-${String(n).padStart(3, '0')}`, { ...state.counters, [key]: n }];
}

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String(e.message) : String(e);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sync, setSync] = useState<SyncStatus>({ state: 'off' });

  // stateRef est toujours à jour : les actions calculent le nouvel état de façon
  // synchrone (pour renvoyer un document créé) et la synchro relit l'état courant.
  const stateRef = useRef(state);
  const dirty = useRef(false);
  const running = useRef<Promise<void> | null>(null);

  const commit = useCallback((next: State, markDirty = true) => {
    stateRef.current = next;
    setState(next);
    if (markDirty) dirty.current = true;
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<State>;
        commit(
          {
            ...initialState,
            ...saved,
            company: { ...defaultCompany, ...saved.company },
            // Données de la v0 : pas encore de date de modification.
            docs: (saved.docs ?? []).map((d) => ({ ...d, updatedAt: d.updatedAt ?? d.createdAt })),
          },
          false,
        );
      })
      .finally(() => setReady(true));
  }, [commit]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  const syncNow = useCallback(async () => {
    if (!supabase || !userId) return;
    if (running.current) return running.current;
    const db = supabase;
    const run = (async () => {
      dirty.current = false;
      setSync((s) => ({ ...s, state: 'syncing' }));
      try {
        const [docsRes, profileRes] = await Promise.all([
          db.from('documents').select(DOC_COLUMNS),
          db.from('profiles').select('company, counters, updated_at').maybeSingle(),
        ]);
        if (docsRes.error) throw docsRes.error;
        if (profileRes.error) throw profileRes.error;
        const remote = (docsRes.data as DocumentRow[]).map(rowToDoc);
        const profile = profileRes.data;
        const remoteCompany = profile ? { company: profile.company as Partial<Company>, updatedAt: profile.updated_at as string } : null;
        const remoteCounters = (profile?.counters ?? {}) as Record<string, number>;

        const local = stateRef.current;
        const { toPush } = mergeDocs(local.docs, remote);
        const company = mergeCompany({ company: local.company, updatedAt: local.companyUpdatedAt }, remoteCompany);
        const counters = mergeCounters(local.counters, remoteCounters);

        if (toPush.length) {
          const { error } = await db.from('documents').upsert(toPush.map(docToUpsert));
          if (error) throw error;
        }
        if (company.push || JSON.stringify(counters) !== JSON.stringify(remoteCounters)) {
          const { error } = await db
            .from('profiles')
            .upsert({ user_id: userId, company: company.company, counters, updated_at: company.updatedAt });
          if (error) throw error;
        }

        // On refusionne avec l'état courant : les modifs faites pendant la synchro sont gardées.
        const latest = stateRef.current;
        const merged = mergeCompany({ company: latest.company, updatedAt: latest.companyUpdatedAt }, remoteCompany);
        commit(
          {
            docs: mergeDocs(latest.docs, remote).docs,
            company: merged.company,
            companyUpdatedAt: merged.updatedAt,
            counters: mergeCounters(latest.counters, counters),
          },
          false,
        );
        setSync({ state: 'idle', lastAt: now() });
      } catch (e) {
        setSync({ state: 'error', error: errorMessage(e) });
      } finally {
        running.current = null;
      }
    })();
    running.current = run;
    return run;
  }, [userId, commit]);

  // Synchro à la connexion, au retour dans l'app (signatures reçues) et après chaque modification.
  useEffect(() => {
    if (!ready || !userId) {
      setSync({ state: 'off' });
      return;
    }
    syncNow();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && syncNow());
    return () => sub.remove();
  }, [ready, userId, syncNow]);

  useEffect(() => {
    if (!ready || !userId || !dirty.current) return;
    const timer = setTimeout(syncNow, 1500);
    return () => clearTimeout(timer);
  }, [state, ready, userId, syncNow]);

  const replaceDoc = useCallback(
    (doc: Doc) => {
      const s = stateRef.current;
      commit({ ...s, docs: s.docs.map((d) => (d.id === doc.id ? doc : d)) });
    },
    [commit],
  );

  const createQuote = useCallback(
    (input: NewDoc) => {
      const s = stateRef.current;
      const [number, counters] = nextNumber(s, 'quote');
      const t = now();
      const doc: Doc = { ...input, id: newId(), number, kind: 'quote', status: 'draft', createdAt: t, updatedAt: t };
      commit({ ...s, docs: [doc, ...s.docs], counters });
      return doc;
    },
    [commit],
  );

  const convertToInvoice = useCallback(
    (quoteId: string) => {
      const s = stateRef.current;
      const quote = s.docs.find((d) => d.id === quoteId);
      if (!quote) throw new Error('Devis introuvable');
      const existing = s.docs.find((d) => d.sourceQuoteId === quoteId && !d.deleted);
      if (existing) return existing;
      const [number, counters] = nextNumber(s, 'invoice');
      const t = now();
      const invoice: Doc = {
        id: newId(),
        kind: 'invoice',
        number,
        title: quote.title,
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        clientAddress: quote.clientAddress,
        lines: quote.lines.map((l) => ({ ...l, estimated: false })),
        status: 'sent',
        createdAt: t,
        updatedAt: t,
        sourceQuoteId: quoteId,
      };
      const docs = s.docs.map((d) => (d.id === quoteId ? { ...d, status: 'accepted' as const, updatedAt: t } : d));
      commit({ ...s, docs: [invoice, ...docs], counters });
      return invoice;
    },
    [commit],
  );

  const updateDoc = useCallback(
    (id: string, patch: Partial<Doc>) => {
      const doc = stateRef.current.docs.find((d) => d.id === id);
      if (doc) replaceDoc({ ...doc, ...patch, updatedAt: now() });
    },
    [replaceDoc],
  );

  const deleteDoc = useCallback(
    (id: string) => {
      const doc = stateRef.current.docs.find((d) => d.id === id);
      // Une facture émise ne se supprime pas (obligation légale) : seuls les devis.
      if (doc && doc.kind === 'quote') replaceDoc({ ...doc, deleted: true, shareToken: undefined, updatedAt: now() });
    },
    [replaceDoc],
  );

  const updateCompany = useCallback(
    (patch: Partial<Company>) => {
      const s = stateRef.current;
      commit({ ...s, company: { ...s.company, ...patch }, companyUpdatedAt: now() });
    },
    [commit],
  );

  const requestSignature = useCallback(
    async (id: string) => {
      if (!supabase || !userId) throw new Error('Connecte-toi pour envoyer un devis à signer.');
      if (!SIGN_URL) throw new Error('Page de signature non configurée (EXPO_PUBLIC_SIGN_URL).');
      let doc = stateRef.current.docs.find((d) => d.id === id);
      if (!doc) throw new Error('Devis introuvable');
      if (!doc.shareToken) {
        doc = {
          ...doc,
          shareToken: Crypto.randomUUID().replace(/-/g, ''),
          status: doc.status === 'draft' ? 'sent' : doc.status,
          updatedAt: now(),
        };
        replaceDoc(doc);
      }
      // Le client doit voir la dernière version : on publie ce devis tout de suite.
      const { error } = await supabase.from('documents').upsert(docToUpsert(doc));
      if (error) throw new Error(errorMessage(error));
      return `${SIGN_URL}?t=${doc.shareToken}`;
    },
    [userId, replaceDoc],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await syncNow();
    if (dirty.current) throw new Error('Des modifications ne sont pas encore sauvegardées. Réessaie avec du réseau.');
    // Les données appartiennent au compte : on vide le téléphone avant de fermer la session.
    commit(initialState, false);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    await supabase.auth.signOut();
  }, [syncNow, commit]);

  const visibleDocs = useMemo(() => state.docs.filter((d) => !d.deleted), [state.docs]);

  const value = useMemo(
    () => ({
      docs: visibleDocs,
      company: state.company,
      counters: state.counters,
      ready,
      session,
      sync,
      createQuote,
      updateDoc,
      deleteDoc,
      convertToInvoice,
      updateCompany,
      syncNow,
      requestSignature,
      signOut,
    }),
    [visibleDocs, state.company, state.counters, ready, session, sync, createQuote, updateDoc, deleteDoc, convertToInvoice, updateCompany, syncNow, requestSignature, signOut],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore doit être utilisé dans <StoreProvider>');
  return store;
}
