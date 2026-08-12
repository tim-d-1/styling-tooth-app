create or replace view public.client_stats
    with (security_invoker = true)
    as
    select
      p.id as client_id,
      count(a.id) filter (where a.status = 'completed')               as completed_visits,
      coalesce(avg(a.price) filter (where a.status = 'completed'), 0) as average_check,
      coalesce(sum(a.price) filter (where a.status = 'completed'), 0) as lifetime_value,
      max(a.starts_at)                                                as last_visit_at
    from public.profiles p
    left join public.appointments a on a.client_id = p.id
    group by p.id;