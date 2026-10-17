import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
// Bouchon minimal de l'environnement Supabase
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  insert into auth.users values ('${A}'), ('${B}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role authenticated nologin; create role service_role nologin bypassrls;
  grant usage on schema public, auth to authenticated, service_role;
  grant execute on function auth.uid() to authenticated;
`);
await db.exec(readFileSync(new URL('../supabase/migrations/20261017000000_init.sql', import.meta.url), 'utf8'));
await db.exec(`grant all on all tables in schema public to service_role;`);

let pass = 0, failures = 0;
const as = async (user, sql) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ''}', false); set role ${user ? 'authenticated' : 'service_role'};`);
  return db.query(sql);
};
const ok = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failures++; console.log('FAIL', name, '-', e.message); } };
const rejects = async (name, fn, match) => ok(name, async () => {
  try { await fn(); } catch (e) { if (match && !e.message.includes(match)) throw new Error('mauvaise erreur: ' + e.message); return; }
  throw new Error('aurait dû échouer');
});
const upsert = (id, number, data, extra = '') => `
  insert into documents (id, kind, number, data, deleted, updated_at, share_token)
  values ('${id}', 'quote', '${number}', '${JSON.stringify(data)}', false, now(), ${extra || 'null'})
  on conflict (id) do update set id = excluded.id, kind = excluded.kind, number = excluded.number, data = excluded.data,
    deleted = excluded.deleted, updated_at = excluded.updated_at, share_token = excluded.share_token`;

const lines = [{ description: 'Faïence', quantity: 6, unit: 'm²', unitPrice: 45 }];

await ok('A crée un devis (user_id rempli automatiquement)', async () => {
  await as(A, upsert('d1', 'D-2026-001', { status: 'sent', lines }, "'tok1'"));
  const r = await as(A, `select user_id from documents where id = 'd1'`);
  if (r.rows[0].user_id !== A) throw new Error('user_id ' + r.rows[0].user_id);
});
await ok('A met à jour son devis via upsert', () => as(A, upsert('d1', 'D-2026-001', { status: 'sent', lines, title: 'v2' }, "'tok1'")));
await ok('B ne voit pas les devis de A', async () => {
  const r = await as(B, `select * from documents`);
  if (r.rows.length) throw new Error('B voit ' + r.rows.length);
});
await rejects('B ne peut pas écraser le devis de A (même id)', () => as(B, upsert('d1', 'D-2026-001', { lines: [] })), 'row-level security');
await ok('B peut avoir son propre D-2026-001', () => as(B, upsert('d2', 'D-2026-001', { lines })));
await rejects('A ne peut pas réutiliser un numéro', () => as(A, upsert('d3', 'D-2026-001', { lines })), 'unique');
await rejects('A ne peut pas se signer lui-même', () => as(A, `update documents set signed_at = now(), signer_name = 'x' where id = 'd1'`), 'permission denied');
await rejects('A ne peut pas insérer un devis déjà signé', () => as(A, `insert into documents (id, kind, number, data, updated_at, signed_at) values ('d4','quote','D-2026-009','{}', now(), now())`), 'permission denied');
await ok('la fonction sign (service_role) signe via le jeton', async () => {
  const r = await as(null, `update documents set signed_at = now(), signer_name = 'Mme Martin' where share_token = 'tok1' and signed_at is null returning id`);
  if (r.rows.length !== 1) throw new Error('rows ' + r.rows.length);
});
await ok('une signature ne se rejoue pas', async () => {
  const r = await as(null, `update documents set signer_name = 'pirate' where share_token = 'tok1' and signed_at is null returning id`);
  if (r.rows.length !== 0) throw new Error('rejouée');
});
await rejects('après signature, A ne peut plus changer les prestations', () => as(A, upsert('d1', 'D-2026-001', { status: 'sent', lines: [{ ...lines[0], unitPrice: 99 }] }, "'tok1'")), 'Devis signé');
await ok('après signature, A peut encore changer le statut', () => as(A, upsert('d1', 'D-2026-001', { status: 'accepted', lines, title: 'v2' }, "'tok1'")));
await ok('profil : A crée et met à jour le sien', async () => {
  await as(A, `insert into profiles (user_id, company, counters, updated_at) values ('${A}', '{"name":"Dupont"}', '{}', now())
    on conflict (user_id) do update set company = excluded.company, counters = excluded.counters, updated_at = excluded.updated_at`);
  await as(A, `insert into profiles (user_id, company, counters, updated_at) values ('${A}', '{"name":"Dupont SARL"}', '{"quote-2026":1}', now())
    on conflict (user_id) do update set company = excluded.company, counters = excluded.counters, updated_at = excluded.updated_at`);
});
await rejects('profil : A ne peut pas écrire celui de B', () => as(A, `insert into profiles (user_id, company) values ('${B}', '{}')`), 'row-level security');
await ok('profil : B ne lit pas celui de A', async () => {
  const r = await as(B, `select * from profiles`);
  if (r.rows.length) throw new Error('fuite');
});
console.log(`\n${pass} ok, ${failures} échec(s)`);
process.exit(failures ? 1 : 0);
