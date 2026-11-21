begin;

create or replace function public.redeem_learning_code(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text;
  v_entry public.learning_codes%rowtype;
  v_title text;
begin
  if v_user_id is null then
    raise exception using
      errcode = '28000',
      message = 'Hãy đăng nhập để kích hoạt học liệu.';
  end if;

  if p_code is null or char_length(p_code) > 100 then
    raise exception 'Mã học liệu không hợp lệ.';
  end if;

  v_code := upper(regexp_replace(p_code, '[[:space:]-]', '', 'g'));

  if v_code !~ '^[0-9A-F]{32}$' then
    raise exception 'Mã học liệu không hợp lệ.';
  end if;

  select c.* into v_entry
  from public.learning_codes as c
  where c.code_hash = encode(sha256(convert_to(v_code, 'UTF8')), 'hex')
  for update;

  if not found then
    raise exception 'Mã học liệu không hợp lệ hoặc đã được sử dụng.';
  end if;

  if v_entry.redeemed_at is not null
     and v_entry.redeemed_by is distinct from v_user_id then
    raise exception 'Mã học liệu không hợp lệ hoặc đã được sử dụng.';
  end if;

  select p.title into strict v_title
  from public.learning_packs as p
  where p.id = v_entry.pack_id;

  if v_entry.redeemed_by = v_user_id or exists (
    select 1
    from public.learning_codes as c
    where c.pack_id = v_entry.pack_id and c.redeemed_by = v_user_id
  ) then
    return v_title;
  end if;

  begin
    update public.learning_codes
    set redeemed_by = v_user_id, redeemed_at = now()
    where id = v_entry.id;
  exception
    when unique_violation then
      if not exists (
        select 1
        from public.learning_codes as c
        where c.pack_id = v_entry.pack_id and c.redeemed_by = v_user_id
      ) then
        raise;
      end if;
  end;

  return v_title;
end;
$$;

revoke execute on function public.redeem_learning_code(text)
  from public, anon, authenticated;

grant execute on function public.redeem_learning_code(text)
  to authenticated;

commit;