-- 0030_auto_expire_and_handle_appointment_states.sql

create or replace function public.validate_appointment_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  if auth.uid() is not null and not public.is_staff() then
    if new.status <> 'cancelled' then
      raise exception 'Clients are only permitted to cancel appointments';
    end if;

    if old.status not in ('new', 'confirmed') then
      raise exception 'Cannot cancel appointment with status %', old.status;
    end if;
  end if;

  case old.status
    when 'new' then
      if new.status not in ('confirmed', 'in_progress', 'cancelled') then
        raise exception 'Invalid status transition from new to %', new.status;
      end if;

    when 'confirmed' then
      if new.status not in ('in_progress', 'cancelled', 'late', 'no_show', 'completed') then
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

create or replace function public.sync_past_appointment_statuses()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_count int := 0;
  v_completed_count int := 0;
begin
  with updated_expired as (
    update public.appointments
    set status = 'cancelled',
        admin_note = coalesce(admin_note, '') || case when coalesce(admin_note, '') = '' then '' else ' | ' end || 'Автоматично скасовано: минув запланований час візиту',
        updated_at = now()
    where status = 'new'
      and starts_at < now()
    returning id
  )
  select count(*) into v_expired_count from updated_expired;

  with updated_completed as (
    update public.appointments
    set status = 'completed',
        updated_at = now()
    where status = 'confirmed'
      and ends_at < now()
      and payment_id is not null
    returning id
  )
  select count(*) into v_completed_count from updated_completed;

  return jsonb_build_object(
    'expired_count', v_expired_count,
    'completed_count', v_completed_count,
    'synced_at', now()
  );
end;
$$;

grant execute on function public.sync_past_appointment_statuses() to authenticated, service_role, anon;

select public.sync_past_appointment_statuses();

do $$
declare
  v_pet_id uuid := '5cd6e698-19fd-4900-95d7-0a7c284c5540';
  v_client_id uuid := 'b7b2777f-0414-4e4d-adda-1c6d2bf548f3';
  v_master1 uuid := '11111111-1111-1111-1111-111111111111';
  v_service_spa uuid := '50000000-0000-0000-0000-000000000002';
  v_active_appt uuid := 'b0000000-0000-0000-0000-000000000099';
  v_starts_at timestamptz := '2026-10-17 11:00:00+00';
  v_ends_at timestamptz := '2026-10-17 12:00:00+00';
begin
  if exists (select 1 from public.pets where id = v_pet_id) then
    insert into public.appointments (
      id,
      client_id,
      pet_id,
      master_id,
      service_id,
      status,
      starts_at,
      ends_at,
      price,
      client_note,
      source,
      created_by,
      created_at,
      updated_at
    ) values (
      v_active_appt,
      v_client_id,
      v_pet_id,
      v_master1,
      v_service_spa,
      'new',
      v_starts_at,
      v_ends_at,
      850.00,
      'Потрібне Pet-таксі, кішка боїться шуму',
      'web',
      v_client_id,
      now(),
      now()
    ) on conflict (id) do update set
      status = 'new',
      starts_at = v_starts_at,
      ends_at = v_ends_at,
      updated_at = now();

    insert into public.appointment_services (
      appointment_id,
      service_id,
      price,
      duration_min,
      sort_order
    ) values (
      v_active_appt,
      v_service_spa,
      850.00,
      60,
      1
    ) on conflict do nothing;
  end if;
end $$;
