begin;

alter table public.creator_applications
  alter column user_id drop not null;

create or replace function public.create_creator_application_as_admin(
  p_application jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application record;
  v_id uuid;
begin
  if auth.uid() is null or public.is_creator_admin() is distinct from true then
    raise exception using
      errcode = '42501',
      message = 'Tài khoản này không có quyền nhập hồ sơ Creator.';
  end if;

  if jsonb_typeof(p_application) is distinct from 'object' then
    raise exception 'Thông tin hồ sơ không hợp lệ.';
  end if;

  select
    btrim(full_name) as full_name,
    btrim(channel_name) as channel_name,
    btrim(contact_email) as contact_email,
    btrim(phone) as phone,
    btrim(platform) as platform,
    btrim(channel_url) as channel_url,
    btrim(content_field) as content_field,
    followers,
    btrim(coalesce(introduction, '')) as introduction,
    btrim(coalesce(professional_background, '')) as professional_background
  into v_application
  from jsonb_to_record(p_application) as input(
    full_name text,
    channel_name text,
    contact_email text,
    phone text,
    platform text,
    channel_url text,
    content_field text,
    followers bigint,
    introduction text,
    professional_background text
  );

  if coalesce(char_length(v_application.full_name), 0) not between 2 and 100
    or coalesce(char_length(v_application.channel_name), 0) not between 1 and 150
    or coalesce(char_length(v_application.contact_email), 0) not between 3 and 254
    or coalesce(v_application.contact_email, '') !~
      '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or coalesce(char_length(v_application.phone), 0) not between 8 and 25
    or coalesce(v_application.platform, '') not in (
      'TikTok', 'Facebook', 'YouTube', 'Instagram'
    )
    or coalesce(v_application.channel_url, '') !~ '^https://[^[:space:]]+$'
    or char_length(v_application.channel_url) > 1000
    or coalesce(char_length(v_application.content_field), 0) not between 1 and 300
    or coalesce(v_application.followers, -1) not between 0 and 9007199254740991
    or char_length(v_application.introduction) > 3000
    or char_length(v_application.professional_background) > 5000
  then
    raise exception 'Hãy kiểm tra lại thông tin hồ sơ Creator.';
  end if;

  insert into public.creator_applications (
    user_id, full_name, channel_name, contact_email, phone,
    platform, channel_url, content_field, followers,
    introduction, professional_background, status
  )
  values (
    null, v_application.full_name, v_application.channel_name,
    v_application.contact_email, v_application.phone, v_application.platform,
    v_application.channel_url, v_application.content_field,
    v_application.followers, v_application.introduction,
    v_application.professional_background, 'pending'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.create_creator_application_as_admin(jsonb)
  from public, anon, authenticated;

grant execute on function public.create_creator_application_as_admin(jsonb)
  to authenticated;

commit;