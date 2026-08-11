-- Multi-Service Line Items Table and Booking RPCs

-- 1. Make service_id optional on appointments for multi-service flexibility
alter table public.appointments alter column service_id drop not null;

-- 2. Line Items Table: appointment_services
create table if not exists public.appointment_services (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id     uuid not null references public.services(id)     on delete restrict,
  price          numeric(10,2) not null check (price >= 0),
  duration_min   int not null check (duration_min > 0),
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  primary key (appointment_id, service_id)
);

create index if not exists appointment_services_appointment_idx on public.appointment_services (appointment_id);
create index if not exists appointment_services_service_idx     on public.appointment_services (service_id);

-- 3. RLS for appointment_services
alter table public.appointment_services enable row level security;

drop policy if exists appointment_services_select on public.appointment_services;
create policy appointment_services_select on public.appointment_services
  for select using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_services.appointment_id
        and (a.client_id = auth.uid() or a.master_id = public.current_master_id() or public.is_staff())
    )
  );

drop policy if exists appointment_services_insert on public.appointment_services;
create policy appointment_services_insert on public.appointment_services
  for insert with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_services.appointment_id
        and (a.client_id = auth.uid() or public.is_staff())
    )
  );

-- 4. Multi-Service Total Resolver Helper
create or replace function public.resolve_multi_services(
  p_master_id   uuid,
  p_service_ids uuid[]
)
returns table (
  total_price        numeric,
  total_duration_min int
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_price numeric := 0;
  v_dur   int := 0;
  v_sid   uuid;
  v_sp    numeric;
  v_sd    int;
begin
  foreach v_sid in array p_service_ids loop
    select price, duration_min into v_sp, v_sd
    from public.resolve_service(p_master_id, v_sid);

    if v_sd is null then
      raise exception 'Service % not found for master %', v_sid, p_master_id;
    end if;

    v_price := v_price + v_sp;
    v_dur   := v_dur + v_sd;
  end loop;

  return query select v_price, v_dur;
end;
$$;

-- 5. Multi-Service Availability RPC
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
      (p_date + b.start_time)::timestamptz,
      (p_date + b.end_time)::timestamptz - make_interval(mins => v_total_dur),
      make_interval(mins => v_step)
    ) as gs
  )
  select c.s, c.s + make_interval(mins => v_total_dur)
  from candidates c
  where public.is_master_available(p_master_id, c.s, c.s + make_interval(mins => v_total_dur))
  order by c.s;
end;
$$;

-- 6. Atomic Multi-Service Booking RPC
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

  -- Create parent appointment record
  insert into public.appointments
    (client_id, pet_id, master_id, service_id, status,
     starts_at, ends_at, price, client_note, source, created_by)
  values
    (coalesce((select owner_id from public.pets where id = p_pet_id), v_client_id),
     p_pet_id, p_master_id, p_service_ids[1], 'new',
     p_starts_at, v_ends_at, v_total_price, p_client_note, p_source, v_client_id)
  returning * into v_appt;

  -- Insert line items into appointment_services
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
