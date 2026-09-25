-- Migration 0014: Fix Database Bugs, Security Hardening, Timezone Support, and Availability Seeds

-- 1. Ensure 'no_show' exists in appointment_status enum
alter type public.appointment_status add value if not exists 'no_show';

-- 2. State Machine: handle 'late' and 'no_show' transitions properly
create or replace function public.validate_appointment_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- If status is not changing, allow the update
  if old.status = new.status then
    return new;
  end if;

  -- 1. Client Role Restrictions: non-staff can ONLY change status to 'cancelled'
  if not public.is_staff() then
    if new.status <> 'cancelled' then
      raise exception 'Clients are only permitted to cancel appointments';
    end if;

    if old.status not in ('new', 'confirmed') then
      raise exception 'Cannot cancel appointment with status %', old.status;
    end if;
  end if;

  -- 2. State Machine Transitions Matrix
  case old.status
    when 'new' then
      if new.status not in ('confirmed', 'in_progress', 'cancelled') then
        raise exception 'Invalid status transition from new to %', new.status;
      end if;

    when 'confirmed' then
      if new.status not in ('in_progress', 'cancelled', 'late', 'no_show') then
        raise exception 'Invalid status transition from confirmed to %', new.status;
      end if;

    when 'late' then
      if new.status not in ('in_progress', 'cancelled', 'no_show', 'completed') then
        raise exception 'Invalid status transition from late to %', new.status;
      end if;

    when 'in_progress' then
      if new.status not in ('completed', 'cancelled') then
        raise exception 'Invalid status transition from in_progress to %', new.status;
      end if;

    when 'completed' then
      raise exception 'Cannot change status of a completed appointment';

    when 'cancelled' then
      raise exception 'Cannot change status of a cancelled appointment';

    when 'no_show' then
      raise exception 'Cannot change status of a no_show appointment';

    else
      raise exception 'Unknown appointment status: %', old.status;
  end case;

  return new;
end;
$$;

drop trigger if exists trg_validate_appointment_status on public.appointments;
create trigger trg_validate_appointment_status
  before update on public.appointments
  for each row execute function public.validate_appointment_status_transition();

-- 3. Trigger Fix: enforce role escalation guard on profiles
drop trigger if exists trg_profiles_guard_role on public.profiles;
create trigger trg_profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_role_change();

-- 4. Monobank Webhook Security: Revoke public/anon execution, grant to service_role only
revoke execute on function public.handle_monobank_webhook_event(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.handle_monobank_webhook_event(text, text, jsonb) to service_role;

-- 5. Appointment RLS and Integrity Guards
-- Disallow direct INSERT on appointments by non-staff; bookings must go through create_appointment() RPCs
drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
  for insert with check (public.is_staff());

-- Guard updates on appointments: non-staff clients cannot tamper with core booking details
create or replace function public.guard_appointment_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_staff() then
    if new.price is distinct from old.price
       or new.starts_at is distinct from old.starts_at
       or new.ends_at is distinct from old.ends_at
       or new.master_id is distinct from old.master_id
       or new.pet_id is distinct from old.pet_id
       or new.service_id is distinct from old.service_id
       or new.payment_id is distinct from old.payment_id
       or new.client_id is distinct from old.client_id then
      raise exception 'Clients cannot modify core appointment details';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_appointment_update on public.appointments;
create trigger trg_guard_appointment_update
  before update on public.appointments
  for each row execute function public.guard_appointment_update();

-- Add UPDATE and DELETE policies on appointment_services for staff
drop policy if exists appointment_services_update on public.appointment_services;
create policy appointment_services_update on public.appointment_services
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists appointment_services_delete on public.appointment_services;
create policy appointment_services_delete on public.appointment_services
  for delete using (public.is_staff());

-- 6. Safe Storage RLS: safe uuid parsing to prevent fatal type-cast errors on non-uuid folders
create or replace function public.try_cast_uuid(p_val text)
returns uuid
language plpgsql immutable
as $$
begin
  return p_val::uuid;
exception when others then
  return null;
end;
$$;

do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists pet_media_storage_read on storage.objects;
    create policy pet_media_storage_read on storage.objects
      for select to authenticated using (
        bucket_id = 'pet-media' and (
          public.is_staff()
          or exists (
            select 1 from public.pets p
            where p.id = public.try_cast_uuid((storage.foldername(name))[1])
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
            where p.id = public.try_cast_uuid((storage.foldername(name))[1])
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
            where p.id = public.try_cast_uuid((storage.foldername(name))[1])
              and p.owner_id = auth.uid()
          )
        )
      );
  end if;
end $$;

-- 7. Timezone Handling: Explicit 'Europe/Kyiv' timezone conversions for slot availability
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
  v_local_start timestamp := p_starts_at at time zone 'Europe/Kyiv';
  v_local_end   timestamp := p_ends_at   at time zone 'Europe/Kyiv';
  v_dow         smallint  := extract(dow from v_local_start)::smallint;
  v_start       time      := v_local_start::time;
  v_end         time      := v_local_end::time;
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
      (p_date + b.start_time) at time zone 'Europe/Kyiv',
      ((p_date + b.end_time) at time zone 'Europe/Kyiv') - make_interval(mins => v_duration),
      make_interval(mins => v_step)
    ) as gs
  )
  select c.s, c.s + make_interval(mins => v_duration)
  from candidates c
  where public.is_master_available(p_master_id, c.s, c.s + make_interval(mins => v_duration))
  order by c.s;
end;
$$;

create or replace function public.get_available_slots_multi_service(
  p_master_id   uuid,
  p_service_ids uuid[],
  p_date        date,
  p_step_min    int default null
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_total_dur int;
  v_step      int;
  v_dow       smallint := extract(dow from p_date)::smallint;
begin
  select total_duration_min into v_total_dur
  from public.resolve_multi_services(p_master_id, p_service_ids);

  if v_total_dur is null or v_total_dur <= 0 then
    return;
  end if;
  v_step := coalesce(p_step_min, 15);

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
      (p_date + b.start_time) at time zone 'Europe/Kyiv',
      ((p_date + b.end_time) at time zone 'Europe/Kyiv') - make_interval(mins => v_total_dur),
      make_interval(mins => v_step)
    ) as gs
  )
  select c.s, c.s + make_interval(mins => v_total_dur)
  from candidates c
  where public.is_master_available(p_master_id, c.s, c.s + make_interval(mins => v_total_dur))
  order by c.s;
end;
$$;

-- 8. Seed Default Active Masters and Weekly Working Schedules
do $$
declare
  v_m1 uuid := '11111111-1111-1111-1111-111111111111';
  v_m2 uuid := '22222222-2222-2222-2222-222222222222';
  v_srv record;
  v_w int;
begin
  insert into public.masters (id, display_name, specialization, bio, calendar_color, is_active, sort_order)
  values
    (v_m1, 'Олена Ковальчук', 'Комплексний грумінг собак', 'Досвід понад 7 років. Сертифікований фахівець зі стрижок та гігієни.', '#96B3E2', true, 1),
    (v_m2, 'Михайло Шевченко', 'СПА-догляд та коти', 'Спеціалізується на делікатному догляді за котами та спа-процедурах.', '#EC643A', true, 2)
  on conflict (id) do update set
    display_name = excluded.display_name,
    specialization = excluded.specialization,
    bio = excluded.bio,
    is_active = true;

  for v_srv in select id from public.services loop
    insert into public.master_services (master_id, service_id)
    values (v_m1, v_srv.id), (v_m2, v_srv.id)
    on conflict do nothing;
  end loop;

  for v_w in 1..6 loop
    insert into public.master_schedules (master_id, weekday, start_time, end_time)
    values
      (v_m1, v_w, '09:00:00', '18:00:00'),
      (v_m2, v_w, '09:00:00', '18:00:00')
    on conflict (master_id, weekday, start_time) do nothing;
  end loop;
end $$;
