-- Dicta : comptes artisans, synchronisation des documents et signature en ligne.

-- Profil de l'artisan : infos entreprise et compteurs de numérotation.
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  company jsonb not null default '{}',
  counters jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Chacun gère son profil" on public.profiles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.profiles to authenticated;

-- Devis et factures. Le contenu (lignes, client…) est dans `data` ; l'app est
-- la source de vérité et synchronise en « dernière modification gagnante ».
create table public.documents (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('quote', 'invoice')),
  number text not null,
  data jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null,
  -- Lien de signature envoyé au client (jeton aléatoire, non devinable).
  share_token text unique,
  -- Signature du client : écrite uniquement par la fonction `sign`.
  signed_at timestamptz,
  signer_name text,
  signature text,
  signer_ip text,
  unique (user_id, number)
);

create index documents_user_updated on public.documents (user_id, updated_at);

alter table public.documents enable row level security;

create policy "Chacun gère ses documents" on public.documents
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- L'artisan ne peut pas écrire les colonnes de signature : elles font preuve.
grant select on public.documents to authenticated;
grant insert (id, user_id, kind, number, data, deleted, updated_at, share_token) on public.documents to authenticated;
grant update (id, kind, number, data, deleted, updated_at, share_token) on public.documents to authenticated;

-- Une fois le devis signé, les prestations ne peuvent plus changer.
create function public.protect_signed_lines() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.signed_at is not null and new.data -> 'lines' is distinct from old.data -> 'lines' then
    raise exception 'Devis signé : les prestations ne peuvent plus être modifiées';
  end if;
  return new;
end;
$$;

create trigger documents_protect_signed_lines
  before update on public.documents
  for each row execute function public.protect_signed_lines();
