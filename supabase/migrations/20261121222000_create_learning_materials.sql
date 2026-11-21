begin;

create table public.learning_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (btrim(slug) <> ''),
  title text not null check (btrim(title) <> '')
);

create table public.learning_videos (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.learning_packs(id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  position integer not null check (position > 0),
  storage_path text,
  unique (pack_id, position)
);

create table public.learning_codes (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.learning_packs(id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  check (redeemed_by is null or redeemed_at is not null)
);

create unique index learning_codes_one_pack_per_user
  on public.learning_codes (pack_id, redeemed_by)
  where redeemed_by is not null;

alter table public.learning_packs enable row level security;
alter table public.learning_videos enable row level security;
alter table public.learning_codes enable row level security;

revoke all on public.learning_packs, public.learning_videos, public.learning_codes
  from public, anon, authenticated;

commit;