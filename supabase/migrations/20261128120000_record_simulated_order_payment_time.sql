begin;

alter table public.orders add column paid_at timestamptz;

create function public.set_simulated_order_paid_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.paid_at := clock_timestamp();
  return new;
end;
$$;

create trigger set_simulated_order_paid_at
before update of status on public.orders
for each row
when (old.status is distinct from new.status and new.status = 'paid_simulated')
execute function public.set_simulated_order_paid_at();

commit;
