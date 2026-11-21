begin;

create table public.payos_payments (
  order_id uuid primary key references public.orders(id) on delete cascade,
  order_code bigint generated always as identity
    (start with 100000 maxvalue 9007199254740991) unique,
  payment_link_id text unique,
  checkout_url text,
  created_at timestamptz not null default now()
);

alter table public.payos_payments enable row level security;

revoke all on public.payos_payments from public, anon, authenticated;
grant select, insert, update on public.payos_payments to service_role;
grant usage on sequence public.payos_payments_order_code_seq to service_role;

commit;