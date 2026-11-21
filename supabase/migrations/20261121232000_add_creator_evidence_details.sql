begin;

create or replace function public.list_creator_evidence_details(
  p_application_id uuid
)
returns table (
  object_id uuid,
  file_type text,
  uploaded_at timestamptz,
  uploaded_by text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_creator_admin() is distinct from true then
    raise exception using errcode = '42501', message = 'Không có quyền xem minh chứng.';
  end if;

  return query
  select
    evidence.id,
    case lower(split_part(evidence.name, '.', -1))
      when 'pdf' then 'PDF'
      when 'jpg' then 'JPG'
      when 'jpeg' then 'JPG'
      when 'png' then 'PNG'
      else 'Tệp đính kèm'
    end,
    evidence.created_at,
    evidence.owner_id::text
  from public.creator_applications as application
  join storage.objects as evidence
    on split_part(evidence.name, '/', 1) = application.user_id::text
  where application.id = p_application_id
    and evidence.bucket_id = 'creator-evidence'
  order by evidence.created_at desc
  limit 100;
end;
$$;

revoke execute on function public.list_creator_evidence_details(uuid)
  from public, anon, authenticated;

grant execute on function public.list_creator_evidence_details(uuid)
  to authenticated;

commit; 