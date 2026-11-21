begin;

create or replace function public.list_my_learning_packs()
returns table (pack_id uuid, title text, videos jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.title,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', v.id,
          'title', v.title,
          'storage_path', v.storage_path
        )
        order by v.position
      ) filter (where v.id is not null),
      '[]'::jsonb
    )
  from public.learning_codes as c
  join public.learning_packs as p on p.id = c.pack_id
  left join public.learning_videos as v on v.pack_id = p.id
  where c.redeemed_by = (select auth.uid())
    and c.redeemed_at is not null
  group by p.id, p.title
  order by p.title, p.id;
$$;

create or replace function public.can_watch_learning_video(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.learning_videos as v
    join public.learning_codes as c on c.pack_id = v.pack_id
    where v.storage_path = p_path
      and c.redeemed_by = (select auth.uid())
      and c.redeemed_at is not null
  );
$$;

revoke execute on function public.list_my_learning_packs(),
  public.can_watch_learning_video(text) from public, anon, authenticated;

grant execute on function public.list_my_learning_packs(),
  public.can_watch_learning_video(text) to authenticated;

create policy "Learning video bucket read"
  on storage.objects
  for select to authenticated
  using (bucket_id = 'learning-videos');

create policy "Learning videos require activation"
  on storage.objects
  as restrictive
  for select to authenticated
  using (
    bucket_id <> 'learning-videos'
    or public.can_watch_learning_video(name)
  );

create policy "Learning videos require sign in"
  on storage.objects
  as restrictive
  for select to anon
  using (bucket_id <> 'learning-videos');

commit;