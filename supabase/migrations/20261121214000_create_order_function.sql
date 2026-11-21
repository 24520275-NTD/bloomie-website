begin;

create function public.create_order(
  p_request_id uuid,
  p_recipient_name text,
  p_recipient_phone text,
  p_shipping_address text,
  p_cart jsonb
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
begin
  if v_user_id is null then
    raise exception 'Bạn cần đăng nhập để đặt hàng.';
  end if;

  if p_request_id is null then
    raise exception 'Thiếu mã yêu cầu đặt hàng.';
  end if;

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

  insert into public.orders (
    user_id, request_id, recipient_name, recipient_phone,
    shipping_address, total_vnd
  )
  values (
    v_user_id, p_request_id, btrim(p_recipient_name),
    btrim(p_recipient_phone), btrim(p_shipping_address), v_total_vnd
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

revoke execute on function public.create_order(uuid, text, text, text, jsonb)
  from public, anon, authenticated;

grant execute on function public.create_order(uuid, text, text, text, jsonb)
  to authenticated;

commit;