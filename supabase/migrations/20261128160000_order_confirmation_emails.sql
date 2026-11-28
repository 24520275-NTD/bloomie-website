begin;

create schema if not exists bloomie_private;

create table bloomie_private.order_confirmation_emails (
  order_id uuid primary key references public.orders(id) on delete cascade,
  recipient_email text not null,
  placed_status text not null,
  next_attempt_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  attempts integer not null default 0,
  sent_at timestamptz,
  provider_email_id text
);

alter table bloomie_private.order_confirmation_emails enable row level security;
revoke all on bloomie_private.order_confirmation_emails from public, anon, authenticated;

create index order_confirmation_emails_due_idx
  on bloomie_private.order_confirmation_emails (next_attempt_at, order_id)
  where sent_at is null;

create function bloomie_private.enqueue_order_confirmation_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into bloomie_private.order_confirmation_emails (order_id, recipient_email, placed_status)
  select new.id, account.email, new.status
  from auth.users as account
  where account.id = new.user_id
    and account.email_confirmed_at is not null
    and nullif(btrim(account.email), '') is not null;

  return new;
end;
$$;

revoke execute on function bloomie_private.enqueue_order_confirmation_email()
  from public, anon, authenticated;

create trigger enqueue_order_confirmation_email
after insert on public.orders
for each row execute function bloomie_private.enqueue_order_confirmation_email();

create function public.claim_order_confirmation_emails()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with due as (
    select job.order_id
    from bloomie_private.order_confirmation_emails as job
    where job.sent_at is null
      and job.next_attempt_at <= now()
      and (job.first_attempt_at is null or job.first_attempt_at > now() - interval '23 hours')
    order by job.next_attempt_at, job.order_id
    limit 5
    for update skip locked
  ),
  claimed as (
    update bloomie_private.order_confirmation_emails as job
    set attempts = job.attempts + 1,
        first_attempt_at = coalesce(job.first_attempt_at, now()),
        next_attempt_at = now() + make_interval(mins => least(60, 1 << least(job.attempts + 1, 6)))
    from due
    where job.order_id = due.order_id
    returning job.order_id, job.recipient_email, job.placed_status, job.attempts
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'orderId', claimed.order_id,
    'email', claimed.recipient_email,
    'status', claimed.placed_status,
    'attempt', claimed.attempts,
    'recipient', orders.recipient_name,
    'placedAt', orders.created_at,
    'total', orders.total_vnd,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', item.product_name,
        'quantity', item.quantity,
        'unitPrice', item.unit_price_vnd
      ) order by item.product_id), '[]'::jsonb)
      from public.order_items as item
      where item.order_id = claimed.order_id
    )
  ) order by claimed.order_id), '[]'::jsonb)
  from claimed
  join public.orders as orders on orders.id = claimed.order_id;
$$;

create function public.mark_order_confirmation_email_sent(
  p_order_id uuid,
  p_attempt integer,
  p_provider_email_id text
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with marked as (
    update bloomie_private.order_confirmation_emails
    set sent_at = now(), provider_email_id = p_provider_email_id, recipient_email = ''
    where order_id = p_order_id and attempts = p_attempt and sent_at is null
    returning order_id
  )
  select exists (select 1 from marked);
$$;

revoke execute on function public.claim_order_confirmation_emails(),
  public.mark_order_confirmation_email_sent(uuid, integer, text)
  from public, anon, authenticated;

grant execute on function public.claim_order_confirmation_emails(),
  public.mark_order_confirmation_email_sent(uuid, integer, text)
  to service_role;

commit;
