-- Add exclusion constraint to appointments to prevent the same pet from being double-booked
-- Cancelled visits are excluded
alter table public.appointments
  add constraint appointments_pet_no_overlap exclude using gist (
    pet_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled');

-- Helper function to check pet availability
create or replace function public.is_pet_available(
  p_pet_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_ignore_appointment_id uuid default null
)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.appointments a
    where a.pet_id = p_pet_id
      and a.status <> 'cancelled'
      and (p_ignore_appointment_id is null or a.id <> p_ignore_appointment_id)
      and tstzrange(a.starts_at, a.ends_at) && tstzrange(p_starts_at, p_ends_at)
  ) then
    return false;
  end if;

  return true;
end;
$$;

-- Update create_appointment to check pet availability
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
    raise exception 'Selected slot is not available for this master';
  end if;

  if not public.is_pet_available(p_pet_id, p_starts_at, v_ends_at) then
    raise exception 'Selected pet already has an appointment during this time window';
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

-- Update create_multi_service_appointment to check pet availability
create or replace function public.create_multi_service_appointment(
  p_pet_id      uuid,
  p_master_id   uuid,
  p_service_ids uuid[],
  p_starts_at   timestamptz,
  p_client_note text default null,
  p_source      public.booking_source default 'mobile'
)
returns public.appointments
language plpgsql security definer set search_path = public
as $$
declare
  v_client_id   uuid := auth.uid();
  v_total_price numeric;
  v_total_dur   int;
  v_ends_at     timestamptz;
  v_appt        public.appointments;
  v_sid         uuid;
  v_sp          numeric;
  v_sd          int;
  v_idx         int := 0;
begin
  if v_client_id is null then
    raise exception 'Not authenticated';
  end if;

  if array_length(p_service_ids, 1) is null or array_length(p_service_ids, 1) = 0 then
    raise exception 'At least one service must be selected';
  end if;

  if not public.is_staff()
     and not exists (select 1 from public.pets where id = p_pet_id and owner_id = v_client_id) then
    raise exception 'Pet does not belong to the current user';
  end if;

  select total_price, total_duration_min into v_total_price, v_total_dur
  from public.resolve_multi_services(p_master_id, p_service_ids);

  v_ends_at := p_starts_at + make_interval(mins => v_total_dur);

  if not public.is_master_available(p_master_id, p_starts_at, v_ends_at) then
    raise exception 'Selected time slot is not available for total duration % min', v_total_dur;
  end if;

  if not public.is_pet_available(p_pet_id, p_starts_at, v_ends_at) then
    raise exception 'Selected pet already has an appointment during this time window';
  end if;

  -- Create parent appointment record
  insert into public.appointments
    (client_id, pet_id, master_id, service_id, status,
     starts_at, ends_at, price, client_note, source, created_by)
  values
    (coalesce((select owner_id from public.pets where id = p_pet_id), v_client_id),
     p_pet_id, p_master_id, p_service_ids[1], 'new',
     p_starts_at, v_ends_at, v_total_price, p_client_note, p_source, v_client_id)
  returning * into v_appt;

  foreach v_sid in array p_service_ids loop
    v_idx := v_idx + 1;
    select price, duration_min into v_sp, v_sd
    from public.resolve_service(p_master_id, v_sid);

    insert into public.appointment_services
      (appointment_id, service_id, price, duration_min, sort_order)
    values
      (v_appt.id, v_sid, v_sp, v_sd, v_idx);
  end loop;

  return v_appt;
end;
$$;
