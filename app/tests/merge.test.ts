import { assertEquals } from 'jsr:@std/assert@1';
import { docToUpsert, mergeCompany, mergeCounters, mergeDocs, rowToDoc } from '../src/lib/merge.ts';

const base = { kind: 'quote', title: 't', clientName: '', clientEmail: '', clientAddress: '', lines: [], status: 'draft', createdAt: '2026-10-01T00:00:00Z' } as const;
const doc = (id: string, updatedAt: string, extra = {}) => ({ ...base, id, number: 'D-' + id, updatedAt, ...extra }) as any;

Deno.test('local only -> pushed; remote only -> pulled', () => {
  const r = mergeDocs([doc('a', '2026-10-02T00:00:00Z')], [doc('b', '2026-10-02T00:00:00Z')]);
  assertEquals(r.docs.map((d) => d.id).sort(), ['a', 'b']);
  assertEquals(r.toPush.map((d) => d.id), ['a']);
});

Deno.test('newest wins, equal timestamps keep remote and push nothing', () => {
  const l = doc('a', '2026-10-03T00:00:00Z', { title: 'local' });
  const r = doc('a', '2026-10-02T00:00:00Z', { title: 'remote' });
  assertEquals(mergeDocs([l], [r]).docs[0].title, 'local');
  assertEquals(mergeDocs([l], [r]).toPush.length, 1);
  assertEquals(mergeDocs([r], [l]).docs[0].title, 'local');
  assertEquals(mergeDocs([r], [l]).toPush.length, 0);
  assertEquals(mergeDocs([r], [r]).toPush.length, 0);
});

Deno.test('signature always comes from server, even when local is newer', () => {
  const l = doc('a', '2026-10-05T00:00:00Z', { status: 'sent', signedAt: undefined });
  const r = doc('a', '2026-10-02T00:00:00Z', { status: 'sent', signedAt: '2026-10-04T00:00:00Z', signerName: 'Mme Martin', signature: 'data:x' });
  const m = mergeDocs([l], [r]).docs[0];
  assertEquals([m.signedAt, m.signerName, m.status], ['2026-10-04T00:00:00Z', 'Mme Martin', 'accepted']);
  // et un client ne peut pas "dé-signer" en envoyant une version locale signée inventée
  const fake = doc('a', '2026-10-09T00:00:00Z', { signedAt: '2026-10-09T00:00:00Z', signerName: 'faux' });
  assertEquals(mergeDocs([fake], [doc('a', '2026-10-02T00:00:00Z')]).docs[0].signedAt, undefined);
});

Deno.test('deletion tombstone propagates', () => {
  const l = doc('a', '2026-10-05T00:00:00Z', { deleted: true });
  const r = mergeDocs([l], [doc('a', '2026-10-02T00:00:00Z')]);
  assertEquals(r.toPush[0].deleted, true);
});

Deno.test('row <-> doc round trip never sends signature columns', () => {
  const d = doc('a', '2026-10-02T00:00:00Z', { shareToken: 'abc', signedAt: 'x', signerName: 'y', signature: 'z' });
  const up = docToUpsert(d);
  assertEquals(Object.keys(up).sort(), ['data', 'deleted', 'id', 'kind', 'number', 'share_token', 'updated_at']);
  assertEquals('signature' in up.data || 'signedAt' in up.data, false);
  const back = rowToDoc({ ...up, signed_at: null, signer_name: null, signature: null } as any);
  const { signedAt: _a, signerName: _b, signature: _c, ...unsigned } = d;
  assertEquals(back, unsigned);
});

Deno.test('counters never go backwards; company newest wins', () => {
  assertEquals(mergeCounters({ 'quote-2026': 3, 'invoice-2026': 1 }, { 'quote-2026': 5 }), { 'quote-2026': 5, 'invoice-2026': 1 });
  const local = { company: { name: 'A' } as any, updatedAt: '2026-10-02T00:00:00Z' };
  assertEquals(mergeCompany(local, { company: { name: 'B' }, updatedAt: '2026-10-03T00:00:00Z' }).company.name, 'B');
  assertEquals(mergeCompany(local, { company: { name: 'B' }, updatedAt: '2026-10-01T00:00:00Z' }), { ...local, push: true });
  assertEquals(mergeCompany(local, null).push, true);
});
