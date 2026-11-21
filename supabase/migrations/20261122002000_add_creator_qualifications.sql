begin;

create table public.creator_qualifications (
  application_id uuid primary key
    references public.creator_applications(id) on delete cascade,
  education_level text check (char_length(education_level) <= 200),
  field_of_study text check (char_length(field_of_study) <= 200),
  certifications text check (char_length(certifications) <= 1000),
  training_institution text check (char_length(training_institution) <= 300),
  work_experience text check (char_length(work_experience) <= 2000),
  teaching_experience text check (char_length(teaching_experience) <= 2000),
  professional_projects text check (char_length(professional_projects) <= 2000)
);

alter table public.creator_qualifications enable row level security;

revoke all on public.creator_qualifications from public, anon, authenticated;
grant select, insert, update on public.creator_qualifications to authenticated;

create policy creator_admin_manage_qualifications
  on public.creator_qualifications
  for all to authenticated
  using ((select public.is_creator_admin()))
  with check ((select public.is_creator_admin()));

commit;