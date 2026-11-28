begin;

alter table bloomie_private.order_confirmation_emails
  add column email_event text not null default 'placed' check (email_event in ('placed', 'completed')),
  add column completed_at timestamptz,
  drop constraint order_confirmation_emails_pkey,
  add primary key (order_id, email_event);

create or replace function bloomie_private.enqueue_order_confirmation_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into bloomie_private.order_confirmation_emails
    (order_id, recipient_email, placed_status, email_event, completed_at)
  select new.id, account.email, new.status,
    case when tg_op = 'UPDATE' then 'completed' else 'placed' end,
    case when tg_op = 'UPDATE' then coalesce(new.completed_at, new.paid_at, clock_timestamp()) end
  from auth.users as account
  where account.id = new.user_id
    and account.email_confirmed_at is not null
    and nullif(btrim(account.email), '') is not null
  on conflict (order_id, email_event) do nothing;

  return new;
end;
$$;

create trigger enqueue_order_completion_email
after update of status on public.orders
for each row
when (old.status is distinct from new.status
  and new.status in ('completed_cod', 'completed_vnpay_demo', 'paid_simulated'))
execute function bloomie_private.enqueue_order_confirmation_email();

create or replace function public.claim_order_confirmation_emails()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with due as (
    select job.order_id, job.email_event
    from bloomie_private.order_confirmation_emails as job
    where job.sent_at is null
      and job.next_attempt_at <= now()
      and (job.first_attempt_at is null or job.first_attempt_at > now() - interval '23 hours')
    order by job.next_attempt_at, job.order_id, job.email_event desc
    limit 5
    for update skip locked
  ),
  claimed as (
    update bloomie_private.order_confirmation_emails as job
    set attempts = job.attempts + 1,
        first_attempt_at = coalesce(job.first_attempt_at, now()),
        next_attempt_at = now() + make_interval(mins => least(60, 1 << least(job.attempts + 1, 6)))
    from due
    where job.order_id = due.order_id and job.email_event = due.email_event
    returning job.order_id, job.email_event, job.completed_at, job.recipient_email, job.placed_status, job.attempts
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'orderId', claimed.order_id,
    'event', claimed.email_event,
    'completedAt', claimed.completed_at,
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
  ) order by claimed.order_id, claimed.email_event desc), '[]'::jsonb)
  from claimed
  join public.orders as orders on orders.id = claimed.order_id;
$$;

create function public.mark_order_confirmation_email_sent(
  p_order_id uuid,
  p_attempt integer,
  p_provider_email_id text,
  p_email_event text
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with marked as (
    update bloomie_private.order_confirmation_emails
    set sent_at = now(), provider_email_id = p_provider_email_id, recipient_email = ''
    where order_id = p_order_id and email_event = p_email_event and attempts = p_attempt and sent_at is null
    returning order_id
  )
  select exists (select 1 from marked);
$$;

revoke execute on function public.mark_order_confirmation_email_sent(uuid, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.mark_order_confirmation_email_sent(uuid, integer, text, text)
  to service_role;

create or replace function public.mark_order_confirmation_email_sent(
  p_order_id uuid,
  p_attempt integer,
  p_provider_email_id text
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select public.mark_order_confirmation_email_sent(p_order_id, p_attempt, p_provider_email_id, 'placed');
$$;

commit;
