begin;

create table public.creator_internal_notes (
  application_id uuid primary key
    references public.creator_applications(id) on delete cascade,
  note text not null default '' check (char_length(note) <= 5000)
);

create table public.creator_evidence_reviews (
  application_id uuid not null
    references public.creator_applications(id) on delete cascade,
  object_id uuid not null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  primary key (application_id, object_id)
);

alter table public.creator_internal_notes enable row level security;
alter table public.creator_evidence_reviews enable row level security;

revoke all on public.creator_internal_notes, public.creator_evidence_reviews
  from public, anon, authenticated;

grant select, insert, update
  on public.creator_internal_notes, public.creator_evidence_reviews
  to authenticated;

create policy creator_admin_internal_notes
  on public.creator_internal_notes
  for all to authenticated
  using ((select public.is_creator_admin()))
  with check ((select public.is_creator_admin()));

create policy creator_admin_evidence_reviews
  on public.creator_evidence_reviews
  for all to authenticated
  using ((select public.is_creator_admin()))
  with check (
    (select public.is_creator_admin())
    and exists (
      select 1
      from storage.objects as evidence
      join public.creator_applications as application
        on application.user_id::text = split_part(evidence.name, '/', 1)
      where evidence.bucket_id = 'creator-evidence'
        and evidence.id = creator_evidence_reviews.object_id
        and application.id = creator_evidence_reviews.application_id
    )
  );

commit;