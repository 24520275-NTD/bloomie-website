begin;

create table public.creator_collaborations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.creator_applications(id) on delete cascade,
  campaign_name text not null
    check (char_length(btrim(campaign_name)) between 1 and 200),
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'cancelled')),
  starts_on date,
  ends_on date,
  link_clicks integer check (link_clicks >= 0),
  order_count integer check (order_count >= 0),
  revenue_vnd bigint check (revenue_vnd >= 0),
  notes text not null default '' check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

create index creator_collaborations_application_created_idx
  on public.creator_collaborations (application_id, created_at desc);

alter table public.creator_collaborations enable row level security;

revoke all on public.creator_collaborations
  from public, anon, authenticated;

grant select, insert on public.creator_collaborations to authenticated;

grant update (
  campaign_name, status, starts_on, ends_on,
  link_clicks, order_count, revenue_vnd, notes
) on public.creator_collaborations to authenticated;

create policy creator_admin_read_collaborations
  on public.creator_collaborations
  for select to authenticated
  using ((select public.is_creator_admin()));

create policy creator_admin_create_collaborations
  on public.creator_collaborations
  for insert to authenticated
  with check ((select public.is_creator_admin()));

create policy creator_admin_update_collaborations
  on public.creator_collaborations
  for update to authenticated
  using ((select public.is_creator_admin()))
  with check ((select public.is_creator_admin()));

commit;