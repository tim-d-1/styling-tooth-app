-- 0026_support_any_master_in_booking.sql
-- Allow create_appointment and create_multi_service_appointment to resolve an available master when p_master_id is NULL ('any master')

create or replace function public.create_appointment(
  p_pet_id     uuid,
  p_master_id  uuid default null,
  p_service_id uuid default null,
  p_starts_at  timestamptz default null,
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
  v_target_master_id uuid := p_master_id;
begin
  if v_client_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_pet_id is null then
    raise exception 'Pet ID is required';
  end if;

  if p_service_id is null then
    raise exception 'Service ID is required';
  end if;

  if p_starts_at is null then
    raise exception 'Start time is required';
  end if;

  if not public.is_staff()
     and not exists (select 1 from public.pets where id = p_pet_id and owner_id = v_client_id) then
    raise exception 'Pet does not belong to the current user';
  end if;

  -- If master is not specified ('any'), pick the first available active master for this service and slot
  if v_target_master_id is null then
    select m.id into v_target_master_id
    from public.masters m
    join public.master_services ms on ms.master_id = m.id
    where ms.service_id = p_service_id
      and m.is_active = true
      and public.is_master_available(
        m.id,
        p_starts_at,
        p_starts_at + make_interval(mins => coalesce(ms.duration_override, (select duration_min from public.services where id = p_service_id)))
      )
    order by m.sort_order
    limit 1;

    if v_target_master_id is null then
      select m.id into v_target_master_id
      from public.masters m
      where m.is_active = true
        and public.is_master_available(
          m.id,
          p_starts_at,
          p_starts_at + make_interval(mins => coalesce((select duration_min from public.services where id = p_service_id), 60))
        )
      order by m.sort_order
      limit 1;
    end if;

    if v_target_master_id is null then
      raise exception 'Selected slot is not available for any master';
    end if;
  end if;

  select price, duration_min into v_price, v_duration
  from public.resolve_service(v_target_master_id, p_service_id);
  if v_duration is null then
    raise exception 'Service not found';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration);

  if not public.is_master_available(v_target_master_id, p_starts_at, v_ends_at) then
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
     p_pet_id, v_target_master_id, p_service_id, 'new',
     p_starts_at, v_ends_at, v_price, p_client_note, p_source, v_client_id)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.create_multi_service_appointment(
  p_pet_id      uuid,
  p_master_id   uuid default null,
  p_service_ids uuid[] default null,
  p_starts_at   timestamptz default null,
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
  v_target_master_id uuid := p_master_id;
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

  if v_target_master_id is null then
    select m.id into v_target_master_id
    from public.masters m
    where m.is_active = true
      and public.is_master_available(
        m.id,
        p_starts_at,
        p_starts_at + make_interval(mins => (
          select coalesce(sum(duration_min), 60)::int from public.services where id = any(p_service_ids)
        ))
      )
    order by m.sort_order
    limit 1;

    if v_target_master_id is null then
      raise exception 'Selected slot is not available for any master';
    end if;
  end if;

  select total_price, total_duration_min into v_total_price, v_total_dur
  from public.resolve_multi_services(v_target_master_id, p_service_ids);

  v_ends_at := p_starts_at + make_interval(mins => v_total_dur);

  if not public.is_master_available(v_target_master_id, p_starts_at, v_ends_at) then
    raise exception 'Selected time slot is not available for total duration % min', v_total_dur;
  end if;

  if not public.is_pet_available(p_pet_id, p_starts_at, v_ends_at) then
    raise exception 'Selected pet already has an appointment during this time window';
  end if;

  insert into public.appointments
    (client_id, pet_id, master_id, service_id, status,
     starts_at, ends_at, price, client_note, source, created_by)
  values
    (coalesce((select owner_id from public.pets where id = p_pet_id), v_client_id),
     p_pet_id, v_target_master_id, p_service_ids[1], 'new',
     p_starts_at, v_ends_at, v_total_price, p_client_note, p_source, v_client_id)
  returning * into v_appt;

  foreach v_sid in array p_service_ids loop
    v_idx := v_idx + 1;
    select price, duration_min into v_sp, v_sd
    from public.resolve_service(v_target_master_id, v_sid);

    insert into public.appointment_services
      (appointment_id, service_id, price, duration_min, sort_order)
    values
      (v_appt.id, v_sid, v_sp, v_sd, v_idx);
  end loop;

  return v_appt;
end;
$$;
