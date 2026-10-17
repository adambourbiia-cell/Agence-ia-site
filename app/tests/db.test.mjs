import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
// Bouchon minimal de l'environnement Supabase
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  insert into auth.users values ('${A}'), ('${B}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role authenticated nologin; create role service_role nologin bypassrls;
  create role anon nologin;
  grant usage on schema public, auth to authenticated, service_role;
  grant execute on function auth.uid() to authenticated;
`);
const dir = new URL('../supabase/migrations/', import.meta.url);
for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) await db.exec(readFileSync(new URL(f, dir), 'utf8'));
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

await rejects('sans abonnement, A ne peut pas créer de lien de signature', () => as(A, upsert('d0', 'D-2026-000', { lines }, "'tok0'")), 'pro_required');
await ok('A peut créer un devis sans lien', () => as(A, upsert('d0', 'D-2026-000', { lines })));
await ok('le webhook (service_role) active Pro pour A', () =>
  as(null, `insert into subscriptions (user_id, status, expires_at) values ('${A}', 'active', now() + interval '30 days')`));
await rejects('A ne peut pas se donner Pro lui-même', () => as(A, `insert into subscriptions (user_id, status) values ('${A}', 'active')`), 'permission denied');
await rejects('is_pro n’est pas appelable depuis l’app', () => as(A, `select public.is_pro('${A}')`), 'permission denied');
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
await ok('A voit son abonnement, B ne le voit pas', async () => {
  if ((await as(A, `select * from subscriptions`)).rows.length !== 1) throw new Error('A');
  if ((await as(B, `select * from subscriptions`)).rows.length !== 0) throw new Error('B');
});
await ok('abonnement expiré : les liens existants restent valides', async () => {
  await as(null, `update subscriptions set expires_at = now() - interval '1 day' where user_id = '${A}'`);
  await as(A, upsert('d1', 'D-2026-001', { status: 'accepted', lines, title: 'v3' }, "'tok1'"));
});
await rejects('abonnement expiré : plus de nouveau lien', () => as(A, upsert('d0', 'D-2026-000', { lines }, "'tok9'")), 'pro_required');
await rejects('A ne peut pas trafiquer le compteur de relances', () => as(A, `update documents set reminders_sent = 3 where id = 'd1'`), 'permission denied');
await ok('la fonction remind (service_role) met à jour les relances', () => as(null, `update documents set reminders_sent = 1, last_reminder_at = now() where id = 'd1'`));
await ok('jeton push : A l’enregistre', async () => {
  await as(A, `select public.register_push_token('ExponentPushToken[x]', 'ios')`);
  if ((await as(A, `select * from push_tokens`)).rows.length !== 1) throw new Error('absent');
});
await ok('jeton push : le téléphone passe au compte B', async () => {
  await as(B, `select public.register_push_token('ExponentPushToken[x]', 'ios')`);
  if ((await as(A, `select * from push_tokens`)).rows.length !== 0) throw new Error('A le voit encore');
  if ((await as(B, `select * from push_tokens`)).rows.length !== 1) throw new Error('B ne le voit pas');
});
await rejects('jeton push : impossible d’en insérer un pour un autre compte', () => as(A, `insert into push_tokens (token, user_id) values ('t2', '${B}')`), 'permission denied');
await ok('quota IA : chacun ne voit que sa consommation', async () => {
  await as(null, `insert into ai_usage (user_id) values ('${A}'), ('${A}'), ('${B}')`);
  if ((await as(A, `select count(*)::int as n from ai_usage`)).rows[0].n !== 2) throw new Error('A');
});
await rejects('quota IA : A ne peut pas effacer sa consommation', () => as(A, `delete from ai_usage`), 'permission denied');
console.log(`\n${pass} ok, ${failures} échec(s)`);
process.exit(failures ? 1 : 0);
