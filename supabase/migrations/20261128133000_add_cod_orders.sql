begin;

alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending_payment', 'pending_cod', 'paid', 'paid_simulated', 'cancelled'));

create or replace function public.create_order(
  p_request_id uuid,
  p_recipient_name text,
  p_recipient_phone text,
  p_shipping_address text,
  p_cart jsonb,
  p_payment_method text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_item_count integer;
  v_total_vnd bigint;
  v_items jsonb;
  v_initial_status text;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để đặt hàng.';
  end if;

  if p_request_id is null then
    raise exception 'Thiếu mã yêu cầu đặt hàng.';
  end if;

  if p_payment_method is null or p_payment_method not in ('wallet', 'cod') then
    raise exception 'Phương thức thanh toán không hợp lệ.';
  end if;

  v_initial_status := case when p_payment_method = 'cod' then 'pending_cod' else 'pending_payment' end;

  -- Serialize checkouts for the same customer, including requests from other tabs.
  perform pg_advisory_xact_lock(hashtextextended('bloomie:create_order:' || v_user_id::text, 0));

  select id into v_order_id
  from public.orders
  where user_id = v_user_id and request_id = p_request_id;

  if found then
    return v_order_id;
  end if;

  if coalesce(char_length(btrim(p_recipient_name)), 0) not between 1 and 120
    or coalesce(char_length(btrim(p_recipient_phone)), 0) not between 8 and 25
    or coalesce(char_length(btrim(p_shipping_address)), 0) not between 1 and 500
  then
    raise exception 'Hãy kiểm tra tên, số điện thoại và địa chỉ giao hàng.';
  end if;

  if jsonb_typeof(p_cart) is distinct from 'object' or p_cart = '{}'::jsonb then
    raise exception 'Giỏ hàng đang trống hoặc không hợp lệ.';
  end if;

  if exists (
    select 1
    from jsonb_each(p_cart) as item(product_id, quantity)
    where jsonb_typeof(item.quantity) <> 'number'
      or item.quantity::text !~ '^[1-9][0-9]?$'
  ) then
    raise exception 'Số lượng mỗi sản phẩm phải từ 1 đến 99.';
  end if;

  select
    count(*),
    sum(p.price_vnd::bigint * item.quantity::text::integer),
    jsonb_agg(jsonb_build_object(
      'product_id', p.id::text,
      'product_name', p.name,
      'quantity', item.quantity::text::integer,
      'unit_price_vnd', p.price_vnd
    ))
  into v_item_count, v_total_vnd, v_items
  from jsonb_each(p_cart) as item(product_id, quantity)
  join public.products as p on p.id::text = item.product_id
  where p.is_active = true and p.price_vnd >= 0;

  if v_item_count <> (select count(*) from jsonb_object_keys(p_cart)) then
    raise exception 'Giỏ hàng có sản phẩm đã ngừng bán hoặc chưa có giá.';
  end if;

  select o.id into v_order_id
  from public.orders as o
  where o.user_id = v_user_id
    and o.status = v_initial_status
    and o.recipient_name = btrim(p_recipient_name)
    and o.recipient_phone = btrim(p_recipient_phone)
    and o.shipping_address = btrim(p_shipping_address)
    and o.total_vnd = v_total_vnd
    and not exists (
      select 1 from public.payos_payments as payment where payment.order_id = o.id
    )
    and (
      select jsonb_object_agg(oi.product_id, jsonb_build_array(oi.quantity, oi.unit_price_vnd))
      from public.order_items as oi where oi.order_id = o.id
    ) = (
      select jsonb_object_agg(item.product_id, jsonb_build_array(item.quantity, item.unit_price_vnd))
      from jsonb_to_recordset(v_items) as item(product_id text, quantity integer, unit_price_vnd bigint)
    )
  order by o.created_at desc, o.id desc
  limit 1
  for update of o;

  if found then
    return v_order_id;
  end if;

  insert into public.orders (
    user_id, request_id, recipient_name, recipient_phone,
    shipping_address, total_vnd, status
  )
  values (
    v_user_id, p_request_id, btrim(p_recipient_name),
    btrim(p_recipient_phone), btrim(p_shipping_address), v_total_vnd, v_initial_status
  )
  on conflict (user_id, request_id) do nothing
  returning id into v_order_id;

  if not found then
    select id into strict v_order_id
    from public.orders
    where user_id = v_user_id and request_id = p_request_id;

    return v_order_id;
  end if;

  insert into public.order_items (
    order_id, product_id, product_name, quantity, unit_price_vnd
  )
  select
    v_order_id, item.product_id, item.product_name,
    item.quantity, item.unit_price_vnd
  from jsonb_to_recordset(v_items) as item(
    product_id text,
    product_name text,
    quantity integer,
    unit_price_vnd bigint
  );

  return v_order_id;
end;
$$;

revoke execute on function public.create_order(uuid, text, text, text, jsonb, text)
  from public, anon, authenticated;

grant execute on function public.create_order(uuid, text, text, text, jsonb, text)
  to authenticated;

-- Keep the existing wallet entry point for clients using the five-argument RPC.
create or replace function public.create_order(
  p_request_id uuid,
  p_recipient_name text,
  p_recipient_phone text,
  p_shipping_address text,
  p_cart jsonb
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select public.create_order(
    p_request_id, p_recipient_name, p_recipient_phone, p_shipping_address, p_cart, 'wallet'
  );
$$;

create or replace function public.cancel_pending_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để hủy đơn hàng.';
  end if;

  select status into v_status
  from public.orders
  where id = p_order_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Không tìm thấy đơn hàng trong tài khoản này.';
  end if;

  if v_status = 'cancelled' then
    return;
  end if;

  if v_status not in ('pending_payment', 'pending_cod') then
    raise exception 'Chỉ có thể hủy đơn đang chờ thanh toán hoặc đang chờ giao COD.';
  end if;

  if exists (select 1 from public.payos_payments where order_id = p_order_id) then
    raise exception 'Đơn có yêu cầu thanh toán payOS. Hãy liên hệ Bloomie để kiểm tra.';
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

revoke execute on function public.cancel_pending_order(uuid)
  from public, anon, authenticated;

grant execute on function public.cancel_pending_order(uuid) to authenticated;

commit;
