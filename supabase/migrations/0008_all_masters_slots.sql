create or replace function public.get_available_slots_all_masters(
  p_service_id uuid,
  p_date date,
  p_step_min int default null
)
returns table (
  master_id uuid,
  display_name text,
  avatar_url text,
  slot_start timestamptz,
  slot_end timestamptz
)
language plpgsql stable security definer set search_path = public
as $$
begin
  return query
  select
    m.id as master_id,
    m.display_name,
    m.avatar_url,
    s.slot_start,
    s.slot_end
  from public.masters m
  join public.master_services ms on ms.master_id = m.id
  cross join lateral public.get_available_slots(m.id, p_service_id, p_date, p_step_min) s
  where ms.service_id = p_service_id
    and m.is_active = true
  order by s.slot_start, m.sort_order;
end;
$$;
