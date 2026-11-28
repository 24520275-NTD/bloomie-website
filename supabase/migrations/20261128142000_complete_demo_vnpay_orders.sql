begin;

alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in (
    'pending_payment', 'pending_cod', 'pending_vnpay_demo',
    'paid', 'paid_simulated', 'completed_vnpay_demo', 'cancelled'
  ));

create or replace function public.complete_demo_vnpay_order(p_order_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
  v_paid_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để hoàn tất đơn.';
  end if;

  select status, paid_at into v_status, v_paid_at
  from public.orders
  where id = p_order_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Không tìm thấy đơn hàng trong tài khoản này.';
  end if;

  if v_status = 'completed_vnpay_demo' then
    return v_paid_at;
  end if;

  if v_status <> 'pending_vnpay_demo' then
    raise exception 'Chỉ có thể hoàn tất đơn đang chờ thanh toán VNPay minh họa.';
  end if;

  update public.orders
  set status = 'completed_vnpay_demo', paid_at = clock_timestamp()
  where id = p_order_id and user_id = v_user_id
  returning paid_at into v_paid_at;

  return v_paid_at;
end;
$$;

revoke execute on function public.complete_demo_vnpay_order(uuid)
  from public, anon, authenticated;
grant execute on function public.complete_demo_vnpay_order(uuid)
  to authenticated;

commit;
