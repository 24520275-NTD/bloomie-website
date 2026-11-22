begin;

create table public.demo_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_vnd bigint not null default 0
    check (balance_vnd between 0 and 9007199254740991)
);

create table public.demo_wallet_credits (
  request_id uuid primary key,
  admin_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_vnd bigint not null check (amount_vnd > 0),
  created_at timestamptz not null default now()
);

alter table public.demo_wallets enable row level security;
alter table public.demo_wallet_credits enable row level security;

revoke all on public.demo_wallets, public.demo_wallet_credits
  from public, anon, authenticated;
grant select on public.demo_wallets to authenticated;

create policy "Read own demo wallet"
  on public.demo_wallets for select to authenticated
  using (user_id = (select auth.uid()));

alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending_payment', 'paid', 'paid_simulated', 'cancelled'));

create function public.admin_credit_demo_wallet(
  p_account text, p_amount bigint, p_request_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := auth.uid();
  v_user uuid;
  v_balance bigint;
begin
  if v_admin is null or public.is_creator_admin() is distinct from true then
    raise exception 'Tài khoản này chưa có quyền cộng số dư.';
  end if;

  if p_request_id is null or p_amount is null
    or p_amount not between 1 and 9007199254740991 then
    raise exception 'Hãy nhập số tiền nguyên lớn hơn 0.';
  end if;

  select id into v_user
  from auth.users
  where id::text = lower(btrim(p_account))
    or lower(email) = lower(btrim(p_account));

  if v_user is null then
    raise exception 'Không tìm thấy tài khoản theo email hoặc UUID.';
  end if;

  insert into public.demo_wallet_credits (request_id, admin_id, user_id, amount_vnd)
  values (p_request_id, v_admin, v_user, p_amount)
  on conflict (request_id) do nothing;

  if found then
    insert into public.demo_wallets as wallet (user_id, balance_vnd)
    values (v_user, p_amount)
    on conflict (user_id) do update
      set balance_vnd = wallet.balance_vnd + excluded.balance_vnd
    returning balance_vnd into v_balance;
  else
    if not exists (
      select 1 from public.demo_wallet_credits
      where request_id = p_request_id and admin_id = v_admin
        and user_id = v_user and amount_vnd = p_amount
    ) then
      raise exception 'Mã yêu cầu đã được dùng cho giao dịch khác.';
    end if;

    select balance_vnd into v_balance
    from public.demo_wallets where user_id = v_user;
  end if;

  return v_balance;
end;
$$;

create function public.pay_order_with_demo_wallet(p_order_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_status text;
  v_total bigint;
  v_balance bigint;
begin
  if v_user is null then
    raise exception 'Hãy đăng nhập để thanh toán.';
  end if;

  select status, total_vnd into v_status, v_total
  from public.orders
  where id = p_order_id and user_id = v_user
  for update;

  if not found then
    raise exception 'Không tìm thấy đơn hàng trong tài khoản này.';
  end if;

  if v_status = 'paid_simulated' then
    select balance_vnd into v_balance
    from public.demo_wallets where user_id = v_user;
    return coalesce(v_balance, 0);
  end if;

  if v_status <> 'pending_payment' then
    raise exception 'Đơn hàng này hiện không thể thanh toán.';
  end if;

  if exists (select 1 from public.payos_payments where order_id = p_order_id) then
    raise exception 'Đơn này đã có yêu cầu payOS. Hãy tạo đơn mới để dùng ví giả lập.';
  end if;

  insert into public.demo_wallets (user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  update public.demo_wallets
  set balance_vnd = balance_vnd - v_total
  where user_id = v_user and balance_vnd >= v_total
  returning balance_vnd into v_balance;

  if not found then
    raise exception 'Số dư giả lập không đủ. Hãy liên hệ quản trị viên.';
  end if;

  update public.orders set status = 'paid_simulated' where id = p_order_id;
  return v_balance;
end;
$$;

revoke execute on function public.admin_credit_demo_wallet(text, bigint, uuid)
  from public, anon, authenticated;
revoke execute on function public.pay_order_with_demo_wallet(uuid)
  from public, anon, authenticated;

grant execute on function public.admin_credit_demo_wallet(text, bigint, uuid)
  to authenticated;
grant execute on function public.pay_order_with_demo_wallet(uuid)
  to authenticated;

commit;