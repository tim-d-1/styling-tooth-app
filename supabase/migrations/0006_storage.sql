do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'pet-media', 'pet-media', false, 10485760,
      array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    )
    on conflict (id) do nothing;
  end if;

  if to_regclass('storage.objects') is not null then
    drop policy if exists pet_media_storage_read on storage.objects;
    create policy pet_media_storage_read on storage.objects
      for select to authenticated using (
        bucket_id = 'pet-media' and (
          public.is_staff()
          or exists (
            select 1 from public.pets p
            where p.id = (storage.foldername(name))[1]::uuid
              and p.owner_id = auth.uid()
          )
        )
      );

    drop policy if exists pet_media_storage_insert on storage.objects;
    create policy pet_media_storage_insert on storage.objects
      for insert to authenticated with check (
        bucket_id = 'pet-media' and (
          public.is_staff()
          or exists (
            select 1 from public.pets p
            where p.id = (storage.foldername(name))[1]::uuid
              and p.owner_id = auth.uid()
          )
        )
      );

    drop policy if exists pet_media_storage_delete on storage.objects;
    create policy pet_media_storage_delete on storage.objects
      for delete to authenticated using (
        bucket_id = 'pet-media' and (
          public.is_staff()
          or exists (
            select 1 from public.pets p
            where p.id = (storage.foldername(name))[1]::uuid
              and p.owner_id = auth.uid()
          )
        )
      );
  else
    raise notice 'Relation storage.objects does not exist, skipping storage policy creation';
  end if;
end $$;

