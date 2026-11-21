begin;

create policy "Creator avatars require admin"
  on storage.objects
  as restrictive
  for all to authenticated
  using (
    bucket_id <> 'creator-avatars'
    or (select public.is_creator_admin())
  )
  with check (
    bucket_id <> 'creator-avatars'
    or (select public.is_creator_admin())
  );

create policy "Creator avatars require sign in"
  on storage.objects
  as restrictive
  for all to anon
  using (bucket_id <> 'creator-avatars')
  with check (bucket_id <> 'creator-avatars');

create policy "Creator admins can read avatars"
  on storage.objects
  for select to authenticated
  using (bucket_id = 'creator-avatars');

create policy "Creator admins can upload avatars"
  on storage.objects
  for insert to authenticated
  with check (bucket_id = 'creator-avatars');

create policy "Creator admins can replace avatars"
  on storage.objects
  for update to authenticated
  using (bucket_id = 'creator-avatars')
  with check (bucket_id = 'creator-avatars');

commit;