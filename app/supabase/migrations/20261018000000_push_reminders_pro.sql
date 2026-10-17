-- Notifications push, relances automatiques des impayés et abonnement Dicta Pro.

-- ───────────── Notifications push ─────────────
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

create policy "Chacun voit et retire ses appareils" on public.push_tokens
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, delete on public.push_tokens to authenticated;

-- Un téléphone peut changer de compte : on réattribue le jeton au compte connecté.
create function public.register_push_token(p_token text, p_platform text) returns void
language sql security definer set search_path = '' as $$
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (token) do update set user_id = auth.uid(), platform = excluded.platform, updated_at = now();
$$;

revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

-- ───────────── Relances des factures impayées ─────────────
-- Écrites uniquement par la fonction `remind` (pas de droit d'écriture pour l'app).
alter table public.documents
  add column reminders_sent smallint not null default 0,
  add column last_reminder_at timestamptz;

-- ───────────── Abonnement Dicta Pro ─────────────
-- Alimenté par le webhook RevenueCat (App Store / Google Play), lecture seule pour l'app.
create table public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  status text not null check (status in ('active', 'expired')),
  product_id text,
  store text,
  expires_at timestamptz,
  -- Les webhooks peuvent arriver dans le désordre : on ignore les événements plus anciens.
  last_event_ms bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Chacun voit son abonnement" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.subscriptions to authenticated;

create function public.is_pro(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid and s.status = 'active' and (s.expires_at is null or s.expires_at > now())
  );
$$;

revoke execute on function public.is_pro(uuid) from public, anon, authenticated;
grant execute on function public.is_pro(uuid) to service_role;

-- Dictées IA consommées (quota du plan gratuit), écrites par la fonction `parse-quote`.
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create index ai_usage_user_created on public.ai_usage (user_id, created_at);

alter table public.ai_usage enable row level security;

create policy "Chacun voit sa consommation" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.ai_usage to authenticated;

-- La signature en ligne est une fonction Pro : créer un lien exige un abonnement actif.
-- Les liens déjà envoyés restent valables si l'abonnement s'arrête.
create function public.require_pro_for_signature() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.share_token is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.share_token = new.share_token then
    return new;
  end if;
  -- Un upsert passe d'abord par ce trigger en INSERT, même si la ligne existe déjà.
  if tg_op = 'INSERT' and exists (
    select 1 from public.documents d where d.id = new.id and d.share_token = new.share_token
  ) then
    return new;
  end if;
  if not public.is_pro(new.user_id) then
    raise exception 'pro_required' using hint = 'La signature en ligne est réservée à Dicta Pro';
  end if;
  return new;
end;
$$;

create trigger documents_require_pro_for_signature
  before insert or update on public.documents
  for each row execute function public.require_pro_for_signature();
