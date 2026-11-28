begin;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  product_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 500),
  masked_name text not null,
  hidden boolean not null default false,
  reply text not null default '' check (char_length(reply) <= 500),
  created_at timestamptz not null default now(),
  unique (order_id, product_id),
  foreign key (order_id, product_id) references public.order_items(order_id, product_id) on delete cascade
);
create table public.review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  position smallint not null check (position between 1 and 3),
  path text not null unique,
  unique (review_id, position)
);
create table public.review_helpful (
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (review_id, user_id)
);
create index reviews_product_recent_idx on public.reviews(product_id, created_at desc, id desc);
create index reviews_author_idx on public.reviews(user_id);
create index review_helpful_user_idx on public.review_helpful(user_id);

alter table public.reviews enable row level security;
alter table public.review_images enable row level security;
alter table public.review_helpful enable row level security;
revoke all on public.reviews, public.review_images, public.review_helpful from public, anon, authenticated;
-- Browser roles use the restricted RPCs below. Storage writes go through the validated upload route.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('review-images','review-images',false,5242880,array['image/jpeg','image/png']);

create function public.review_orders(p_product text)
returns table (order_id uuid, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select o.id, o.created_at
  from public.orders o join public.order_items i on i.order_id = o.id
  where o.user_id = auth.uid() and i.product_id = p_product
    and o.status in ('paid','paid_simulated','completed_vnpay_demo','completed_cod')
    and not exists (select 1 from public.reviews r where r.order_id = o.id and r.product_id = p_product)
  order by o.created_at desc, o.id;
$$;

create function public.list_reviews(p_product text, p_filter text, p_sort text, p_page integer)
returns jsonb language sql stable security definer set search_path = ''
as $$
  with candidates as (
    select r.id, r.stars, r.comment, r.masked_name, r.reply, r.created_at, r.hidden,
      coalesce(r.user_id = auth.uid(), false) is_mine,
      coalesce((select jsonb_agg(i.id order by i.position) from public.review_images i where i.review_id = r.id), '[]') images,
      (select count(*) from public.review_helpful h where h.review_id = r.id) helpful,
      exists(select 1 from public.review_helpful h where h.review_id = r.id and h.user_id = auth.uid()) voted
    from public.reviews r
    where r.product_id = p_product and (not r.hidden or r.user_id = auth.uid() or public.is_creator_admin())
  ), visible as (
    select * from candidates where not hidden
  ), filtered as (
    select * from candidates
    where case p_filter
      when 'comment' then comment <> ''
      when 'images' then images <> '[]'::jsonb
      when 'all' then true
      else stars::text = p_filter
    end
  ), page as (
    select * from filtered
    order by case when p_sort = 'helpful' then helpful end desc nulls last, created_at desc, id desc
    limit 5 offset ((greatest(1,least(coalesce(p_page,1),100000)) - 1)*5)
  )
  select jsonb_build_object(
    'average', (select coalesce(avg(stars),0) from visible),
    'counts', (select jsonb_build_object(
      'all', count(*), '1', count(*) filter(where stars=1), '2', count(*) filter(where stars=2),
      '3', count(*) filter(where stars=3), '4', count(*) filter(where stars=4), '5', count(*) filter(where stars=5),
      'comment', count(*) filter(where comment<>''), 'images', count(*) filter(where images<>'[]'::jsonb)
    ) from visible),
    'total', (select count(*) from filtered),
    'items', (select coalesce(jsonb_agg(to_jsonb(page) order by case when p_sort='helpful' then helpful end desc nulls last, created_at desc, id desc),'[]') from page),
    'has_reviewed', exists (select 1 from candidates where is_mine),
    'admin', public.is_creator_admin()
  );
$$;

create function public.set_review_helpful(p_review uuid, p_helpful boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.reviews r where r.id=p_review and not r.hidden and r.user_id<>auth.uid()) then
    raise exception 'Không thể bình chọn đánh giá này.';
  end if;
  if p_helpful then
    insert into public.review_helpful values(p_review,auth.uid()) on conflict do nothing;
  else
    delete from public.review_helpful where review_id=p_review and user_id=auth.uid();
  end if;
end;
$$;

create function public.moderate_review(p_review uuid, p_hidden boolean, p_reply text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not coalesce(public.is_creator_admin(),false) then
    raise exception 'Bạn không có quyền quản trị.';
  end if;
  update public.reviews set hidden=coalesce(p_hidden,hidden),
    reply=coalesce(btrim(regexp_replace(p_reply,'[<>]','','g')),reply) where id=p_review;
end;
$$;

create function public.save_product_review(
  p_actor uuid, p_product text, p_order uuid, p_review uuid, p_stars smallint,
  p_comment text, p_keep uuid[], p_paths text[]
)
returns text[] language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_name text;
  v_removed text[];
begin
  if p_stars is null or p_stars not between 1 and 5 or char_length(coalesce(p_comment,'')) > 500 then
    raise exception 'Hãy chọn từ 1 đến 5 sao và nhập tối đa 500 ký tự.';
  end if;
  if p_keep is null or p_paths is null or cardinality(p_keep) + cardinality(p_paths) > 3 then
    raise exception 'Chỉ được đính kèm tối đa 3 ảnh.';
  end if;
  if p_review is null then
    select regexp_replace(o.recipient_name,'[^[:alpha:]]','','g') into v_name
    from public.orders o join public.order_items i on i.order_id=o.id
    where o.id=p_order and o.user_id=p_actor and i.product_id=p_product
      and o.status in ('paid','paid_simulated','completed_vnpay_demo','completed_cod');
    if not found then raise exception 'Chỉ khách đã mua sản phẩm này mới có thể đánh giá.'; end if;
    insert into public.reviews(order_id,product_id,user_id,stars,comment,masked_name)
    values (p_order,p_product,p_actor,p_stars,btrim(regexp_replace(coalesce(p_comment,''),'[<>]','','g')),
      coalesce(nullif(upper(left(v_name,1)),''),'K')||'***')
    on conflict (order_id,product_id) do nothing returning id into v_id;
    if v_id is null then raise exception 'Bạn đã đánh giá sản phẩm trong đơn này.'; end if;
  else
    update public.reviews set stars=p_stars,comment=btrim(regexp_replace(coalesce(p_comment,''),'[<>]','','g'))
    where id=p_review and user_id=p_actor and product_id=p_product returning id into v_id;
    if v_id is null then raise exception 'Không tìm thấy đánh giá của bạn.'; end if;
  end if;
  select coalesce(array_agg(path),'{}') into v_removed
  from public.review_images where review_id=v_id and not (id=any(p_keep));
  -- Preserve IDs for retained images and keep new images within the three available slots.
  delete from public.review_images where review_id=v_id and not (id=any(p_keep));
  insert into public.review_images(review_id,position,path)
  select v_id, slots.position, paths.path
  from unnest(p_paths) with ordinality paths(path,n)
  join (
    select s.position, row_number() over(order by s.position) n
    from generate_series(1,3) s(position)
    where not exists (select 1 from public.review_images i where i.review_id=v_id and i.position=s.position)
  ) slots on slots.n=paths.n;
  return v_removed;
end;
$$;

create function public.delete_product_review(p_actor uuid, p_review uuid)
returns text[] language plpgsql security definer set search_path = ''
as $$
declare v_paths text[];
begin
  perform 1 from public.reviews where id=p_review and user_id=p_actor for update;
  if not found then raise exception 'Không tìm thấy đánh giá của bạn.'; end if;
  select coalesce(array_agg(path),'{}') into v_paths from public.review_images where review_id=p_review;
  delete from public.reviews where id=p_review;
  return v_paths;
end;
$$;

create function public.review_image_path(p_image uuid)
returns text language sql stable security definer set search_path = ''
as $$
  select i.path from public.review_images i join public.reviews r on r.id=i.review_id
  where i.id=p_image and (not r.hidden or r.user_id=auth.uid() or public.is_creator_admin());
$$;

revoke execute on function public.list_reviews(text,text,text,integer), public.review_image_path(uuid),
  public.review_orders(text), public.set_review_helpful(uuid,boolean), public.moderate_review(uuid,boolean,text),
  public.save_product_review(uuid,text,uuid,uuid,smallint,text,uuid[],text[]), public.delete_product_review(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.list_reviews(text,text,text,integer), public.review_image_path(uuid) to anon,authenticated;
grant execute on function public.review_orders(text), public.set_review_helpful(uuid,boolean), public.moderate_review(uuid,boolean,text) to authenticated;
grant execute on function public.save_product_review(uuid,text,uuid,uuid,smallint,text,uuid[],text[]), public.delete_product_review(uuid,uuid) to service_role;

commit;
