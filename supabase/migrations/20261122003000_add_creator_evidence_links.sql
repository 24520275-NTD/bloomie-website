begin;

create table public.creator_evidence_links (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.creator_applications(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  category text not null
    check (category in ('credential', 'portfolio', 'article', 'video', 'other')),
  url text not null
    check (char_length(url) <= 2000 and url ~ '^https://[^[:space:]]+$'),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index creator_evidence_links_application_idx
  on public.creator_evidence_links (application_id, created_at desc);

alter table public.creator_evidence_links enable row level security;

revoke all on public.creator_evidence_links from public, anon, authenticated;
grant select on public.creator_evidence_links to authenticated;
grant insert (application_id, title, category, url)
  on public.creator_evidence_links to authenticated;
grant update (verification_status)
  on public.creator_evidence_links to authenticated;

create policy creator_admin_read_evidence_links
  on public.creator_evidence_links for select to authenticated
  using ((select public.is_creator_admin()));

create policy creator_admin_add_evidence_links
  on public.creator_evidence_links for insert to authenticated
  with check ((select public.is_creator_admin()));

create policy creator_admin_verify_evidence_links
  on public.creator_evidence_links for update to authenticated
  using ((select public.is_creator_admin()))
  with check ((select public.is_creator_admin()));

commit;