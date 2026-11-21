begin;

grant select (id, status, total_vnd), update (status)
  on table public.orders
  to service_role;

commit;