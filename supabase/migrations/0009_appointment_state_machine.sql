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

  if not public.is_staff() then
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
      if new.status not in ('in_progress', 'cancelled', 'no_show') then
        raise exception 'Invalid status transition from confirmed to %', new.status;
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
  for each row
  execute function public.validate_appointment_status_transition();
