-- Migration 0025: Sanitize user metadata to keep JWT sizes within gateway limits and add storage update policy

-- 1. Ensure any large data URLs in auth.users.raw_user_meta_data are moved to profiles and stripped from auth.users
-- This prevents bloated JWT access tokens exceeding gateway header limits (16KB) that lead to 400 Bad Request
do $$
begin
  -- Backfill profiles.avatar_url if missing before stripping from auth.users
  update public.profiles p
  set avatar_url = u.raw_user_meta_data ->> 'avatar_url'
  from auth.users u
  where p.id = u.id
    and (p.avatar_url is null or p.avatar_url = '')
    and u.raw_user_meta_data ->> 'avatar_url' like 'data:%';

  -- Strip data URLs from raw_user_meta_data across all users
  update auth.users
  set raw_user_meta_data = raw_user_meta_data - 'avatar_url'
  where raw_user_meta_data ->> 'avatar_url' like 'data:%';
end $$;

-- 2. Update handle_new_user() trigger to always sanitize raw_user_meta_data
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, email, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case when new.email like '%@phone.stylingtooth.app' then null else new.email end,
    coalesce(new.raw_user_meta_data ->> 'phone', new.phone),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    email = case when excluded.email like '%@phone.stylingtooth.app' then profiles.email else coalesce(excluded.email, profiles.email) end,
    phone = coalesce(excluded.phone, profiles.phone),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);

  -- Sanitize raw_user_meta_data to prevent oversized JWT access tokens (Cloudflare/Nginx header limit)
  if new.raw_user_meta_data ? 'avatar_url' and (new.raw_user_meta_data ->> 'avatar_url') like 'data:%' then
    update auth.users
    set raw_user_meta_data = raw_user_meta_data - 'avatar_url'
    where id = new.id;
  end if;

  return new;
end;
$$;

-- 3. Add storage update policy for pet-media to support upsert operations
do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists pet_media_storage_update on storage.objects;
    create policy pet_media_storage_update on storage.objects
      for update to authenticated using (
        bucket_id = 'pet-media' and (
          public.is_staff()
          or public.storage_pet_owner_access(name, auth.uid())
        )
      ) with check (
        bucket_id = 'pet-media' and (
          public.is_staff()
          or public.storage_pet_owner_access(name, auth.uid())
        )
      );
  end if;
end $$;
