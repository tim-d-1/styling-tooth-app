-- Migration 0017: Sync avatar_url in handle_new_user trigger and backfill existing profiles

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    email = coalesce(excluded.email, profiles.email),
    phone = coalesce(excluded.phone, profiles.phone),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$;

-- Backfill avatar_url for existing profiles where metadata contains picture or avatar_url
update public.profiles p
set avatar_url = coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
where p.id = u.id
  and p.avatar_url is null
  and (u.raw_user_meta_data ->> 'avatar_url' is not null or u.raw_user_meta_data ->> 'picture' is not null);
