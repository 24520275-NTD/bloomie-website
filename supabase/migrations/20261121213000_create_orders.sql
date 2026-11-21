begin;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  request_id uuid not null,
  recipient_name text not null check (btrim(recipient_name) <> ''),
  recipient_phone text not null check (btrim(recipient_phone) <> ''),
  shipping_address text not null check (btrim(shipping_address) <> ''),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'cancelled')),
  total_vnd bigint not null check (total_vnd >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, request_id)
);

create table public.order_items (
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price_vnd bigint not null check (unit_price_vnd >= 0),
  primary key (order_id, product_id)
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on public.orders, public.order_items from public, anon, authenticated;
grant select on public.orders, public.order_items to authenticated;

create policy "Customers can read their own orders"
  on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Customers can read their own order items"
  on public.order_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = (select auth.uid())
    )
  );

commit;