// Fusion téléphone <-> cloud. Fichier pur (aucun import React Native) pour être testable seul.
import type { Company, Doc } from './types';

/** Ligne de la table `documents` telle que renvoyée par Supabase. */
export type DocumentRow = {
  id: string;
  kind: Doc['kind'];
  number: string;
  data: Omit<Doc, 'signedAt' | 'signerName' | 'signature'>;
  deleted: boolean;
  updated_at: string;
  share_token: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signature: string | null;
};

/** Ce que l'app a le droit d'écrire : jamais les colonnes de signature. */
export type DocumentUpsert = Pick<DocumentRow, 'id' | 'kind' | 'number' | 'data' | 'deleted' | 'updated_at' | 'share_token'>;

export function rowToDoc(row: DocumentRow): Doc {
  const doc: Doc = { ...row.data, id: row.id, kind: row.kind, number: row.number, updatedAt: row.updated_at };
  if (row.deleted) doc.deleted = true;
  if (row.share_token) doc.shareToken = row.share_token;
  if (row.signed_at) {
    doc.signedAt = row.signed_at;
    doc.signerName = row.signer_name ?? '';
    doc.signature = row.signature ?? undefined;
  }
  return doc;
}

export function docToUpsert(doc: Doc): DocumentUpsert {
  const { signedAt: _s, signerName: _n, signature: _sig, ...data } = doc;
  return {
    id: doc.id,
    kind: doc.kind,
    number: doc.number,
    data,
    deleted: doc.deleted ?? false,
    updated_at: doc.updatedAt,
    share_token: doc.shareToken ?? null,
  };
}

const time = (iso: string) => new Date(iso).getTime();

/**
 * Fusionne les documents locaux et distants : pour chaque document, la version
 * modifiée le plus récemment gagne. La signature vient toujours du serveur.
 * Renvoie aussi les documents locaux à envoyer au cloud.
 */
export function mergeDocs(local: Doc[], remote: Doc[]): { docs: Doc[]; toPush: Doc[] } {
  const remoteById = new Map(remote.map((d) => [d.id, d]));
  const localIds = new Set(local.map((d) => d.id));
  const toPush: Doc[] = [];

  const merged = local.map((l) => {
    const r = remoteById.get(l.id);
    if (!r) {
      toPush.push(l);
      return l;
    }
    const localNewer = time(l.updatedAt) > time(r.updatedAt);
    const winner = localNewer ? l : r;
    if (localNewer) toPush.push(l);
    return {
      ...winner,
      signedAt: r.signedAt,
      signerName: r.signerName,
      signature: r.signature,
      // Un devis signé est forcément accepté.
      status: r.signedAt && (winner.status === 'draft' || winner.status === 'sent') ? 'accepted' : winner.status,
    } satisfies Doc;
  });

  for (const r of remote) {
    if (!localIds.has(r.id)) merged.push(r.signedAt && r.status !== 'paid' ? { ...r, status: 'accepted' } : r);
  }

  merged.sort((a, b) => time(b.createdAt) - time(a.createdAt));
  return { docs: merged, toPush };
}

/** Garde le compteur le plus haut de chaque côté : un numéro n'est jamais réattribué. */
export function mergeCounters(a: Record<string, number>, b: Record<string, number>) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

export function mergeCompany(
  local: { company: Company; updatedAt: string },
  remote: { company: Partial<Company>; updatedAt: string } | null,
): { company: Company; updatedAt: string; push: boolean } {
  if (!remote) return { ...local, push: true };
  if (time(local.updatedAt) > time(remote.updatedAt)) return { ...local, push: true };
  return { company: { ...local.company, ...remote.company }, updatedAt: remote.updatedAt, push: false };
}
