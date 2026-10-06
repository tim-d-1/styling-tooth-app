-- Trigger to automatically synchronize public.profiles.email_confirmed when auth.users.email_confirmed_at is set or updated

create or replace function public.sync_email_confirmed_on_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null then
    update public.profiles
    set email_confirmed = true,
        updated_at = now()
    where id = new.id
      and email_confirmed = false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_email_confirmed on auth.users;
create trigger trg_sync_email_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row
  execute function public.sync_email_confirmed_on_auth_user();

-- Backfill any existing accounts where auth.users.email_confirmed_at is not null
update public.profiles p
set email_confirmed = true,
    updated_at = now()
from auth.users u
where p.id = u.id
  and u.email_confirmed_at is not null
  and p.email_confirmed = false;
