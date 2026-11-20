begin;

create table if not exists public.creator_evaluations (
  application_id uuid primary key references public.creator_applications(id) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  constraint creator_evaluations_scores_valid check (
    jsonb_typeof(scores) = 'object'
    and scores - array['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2','F1','F2','G1','G2'] = '{}'::jsonb
    and not jsonb_path_exists(scores, '$.* ? (@.type() != "number" || (@ != 0 && @ != 1 && @ != 2 && @ != 3 && @ != 4))')
  )
);

alter table public.creator_evaluations enable row level security;

revoke all on table public.creator_evaluations from anon, authenticated;
grant select, insert, update on table public.creator_evaluations to authenticated;

drop policy if exists creator_admin_evaluations on public.creator_evaluations;
create policy creator_admin_evaluations on public.creator_evaluations
  for all to authenticated
  using ((select public.is_creator_admin()))
  with check ((select public.is_creator_admin()));

commit;
