begin;

alter table public.orders add column if not exists completed_at timestamptz;
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in (
    'pending_payment', 'pending_cod', 'pending_vnpay_demo', 'paid',
    'paid_simulated', 'completed_vnpay_demo', 'completed_cod', 'cancelled'
  ));

create or replace function public.complete_cod_order(p_order_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
  v_completed_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để hoàn tất đơn.';
  end if;

  select status, completed_at into v_status, v_completed_at
  from public.orders
  where id = p_order_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Không tìm thấy đơn hàng trong tài khoản này.';
  end if;

  if v_status = 'completed_cod' then
    return v_completed_at;
  end if;

  if v_status <> 'pending_cod' then
    raise exception 'Chỉ có thể hoàn tất đơn COD đang chờ giao hàng.';
  end if;

  update public.orders
  set status = 'completed_cod', completed_at = clock_timestamp()
  where id = p_order_id and user_id = v_user_id
  returning completed_at into v_completed_at;

  return v_completed_at;
end;
$$;

revoke execute on function public.complete_cod_order(uuid) from public, anon, authenticated;
grant execute on function public.complete_cod_order(uuid) to authenticated;

commit;
