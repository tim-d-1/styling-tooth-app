create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'receptionist')
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'receptionist', 'master')
  );
$$;

create or replace function public.current_master_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.masters where profile_id = auth.uid();
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Prevent non-admins from escalating their own role
create or replace function public.guard_role_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins may change a profile role';
  end if;
  return new;
end;
$$;

-- Resolve effective price + duration for a (master, service) pair
create or replace function public.resolve_service(
  p_master_id uuid,
  p_service_id uuid,
  out price numeric,
  out duration_min int
)
language sql stable security definer set search_path = public
as $$
  select
    coalesce(ms.price_override, s.price),
    coalesce(ms.duration_override, s.duration_min)
  from public.services s
  left join public.master_services ms
    on ms.service_id = s.id and ms.master_id = p_master_id
  where s.id = p_service_id;
$$;

create or replace function public.is_master_available(
  p_master_id uuid,
  p_starts_at timestamptz,
  p_ends_at   timestamptz,
  p_ignore_appointment_id uuid default null
)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  v_dow  smallint := extract(dow from p_starts_at)::smallint;
  v_start time    := p_starts_at::time;
  v_end   time    := p_ends_at::time;
begin
  if not exists (select 1 from public.masters where id = p_master_id and is_active) then
    return false;
  end if;

  if not exists (
    select 1 from public.master_schedules sch
    where sch.master_id = p_master_id
      and sch.weekday = v_dow
      and sch.start_time <= v_start
      and sch.end_time   >= v_end
  ) then
    return false;
  end if;

  -- 3) no time-off overlap
  if exists (
    select 1 from public.master_time_off t
    where t.master_id = p_master_id
      and tstzrange(t.starts_at, t.ends_at) && tstzrange(p_starts_at, p_ends_at)
  ) then
    return false;
  end if;

  if exists (
    select 1 from public.appointments a
    where a.master_id = p_master_id
      and a.status <> 'cancelled'
      and (p_ignore_appointment_id is null or a.id <> p_ignore_appointment_id)
      and tstzrange(a.starts_at, a.ends_at) && tstzrange(p_starts_at, p_ends_at)
  ) then
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.get_available_slots(
  p_master_id uuid,
  p_service_id uuid,
  p_date date,
  p_step_min int default null
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_duration int;
  v_step     int;
  v_dow      smallint := extract(dow from p_date)::smallint;
begin
  select duration_min into v_duration
  from public.resolve_service(p_master_id, p_service_id);
  if v_duration is null then
    return;
  end if;
  v_step := coalesce(p_step_min, v_duration);

  return query
  with blocks as (
    select sch.start_time, sch.end_time
    from public.master_schedules sch
    where sch.master_id = p_master_id and sch.weekday = v_dow
  ),
  candidates as (
    select gs as s
    from blocks b,
    lateral generate_series(
      (p_date + b.start_time)::timestamptz,
      (p_date + b.end_time)::timestamptz - make_interval(mins => v_duration),
      make_interval(mins => v_step)
    ) as gs
  )
  select c.s, c.s + make_interval(mins => v_duration)
  from candidates c
  where public.is_master_available(p_master_id, c.s, c.s + make_interval(mins => v_duration))
  order by c.s;
end;
$$;

create or replace function public.create_appointment(
  p_pet_id     uuid,
  p_master_id  uuid,
  p_service_id uuid,
  p_starts_at  timestamptz,
  p_client_note text default null,
  p_source     public.booking_source default 'mobile'
)
returns public.appointments
language plpgsql security definer set search_path = public
as $$
declare
  v_client_id uuid := auth.uid();
  v_price     numeric;
  v_duration  int;
  v_ends_at   timestamptz;
  v_row       public.appointments;
begin
  if v_client_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_staff()
     and not exists (select 1 from public.pets where id = p_pet_id and owner_id = v_client_id) then
    raise exception 'Pet does not belong to the current user';
  end if;

  select price, duration_min into v_price, v_duration
  from public.resolve_service(p_master_id, p_service_id);
  if v_duration is null then
    raise exception 'Service not found';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration);

  if not public.is_master_available(p_master_id, p_starts_at, v_ends_at) then
    raise exception 'Selected slot is not available';
  end if;

  insert into public.appointments
    (client_id, pet_id, master_id, service_id, status,
     starts_at, ends_at, price, client_note, source, created_by)
  values
    (coalesce((select owner_id from public.pets where id = p_pet_id), v_client_id),
     p_pet_id, p_master_id, p_service_id, 'new',
     p_starts_at, v_ends_at, v_price, p_client_note, p_source, v_client_id)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace view public.client_stats as
select
  p.id as client_id,
  count(a.id) filter (where a.status = 'completed')                as completed_visits,
  coalesce(avg(a.price) filter (where a.status = 'completed'), 0)  as average_check,
  coalesce(sum(a.price) filter (where a.status = 'completed'), 0)  as lifetime_value,
  max(a.starts_at)                                                 as last_visit_at
from public.profiles p
left join public.appointments a on a.client_id = p.id
group by p.id;
