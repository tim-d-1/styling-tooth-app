create or replace function public.storage_pet_owner_access(object_name text, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1
    from public.pets p
    where (
      p.id = public.try_cast_uuid((storage.foldername(object_name))[1])
      or p.id = public.try_cast_uuid((storage.foldername(object_name))[2])
    )
    and p.owner_id = user_id
  );
$$;

grant execute on function public.storage_pet_owner_access(text, uuid) to authenticated;

do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists pet_media_storage_read on storage.objects;
    create policy pet_media_storage_read on storage.objects
      for select to authenticated using (
        bucket_id = 'pet-media' and (
          public.is_staff()
          or public.storage_pet_owner_access(name, auth.uid())
        )
      );

    drop policy if exists pet_media_storage_insert on storage.objects;
    create policy pet_media_storage_insert on storage.objects
      for insert to authenticated with check (
        bucket_id = 'pet-media' and (
          public.is_staff()
          or public.storage_pet_owner_access(name, auth.uid())
        )
      );

    drop policy if exists pet_media_storage_delete on storage.objects;
    create policy pet_media_storage_delete on storage.objects
      for delete to authenticated using (
        bucket_id = 'pet-media' and (
          public.is_staff()
          or public.storage_pet_owner_access(name, auth.uid())
        )
      );
  end if;
end $$;
