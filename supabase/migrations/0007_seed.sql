insert into public.service_categories (name, slug, sort_order) values
  ('Грумінг',   'grooming', 1),
  ('СПА',       'spa',      2),
  ('Гігієна',   'hygiene',  3)
on conflict (slug) do nothing;

insert into public.services (category_id, name, description, price, duration_min, sort_order)
select c.id, v.name, v.descr, v.price, v.dur, v.ord
from (values
  ('grooming', 'Комплексний грумінг (мала порода)', 'Купання, стрижка, укладка', 800.00, 90,  1),
  ('grooming', 'Комплексний грумінг (велика порода)','Купання, стрижка, укладка', 1400.00, 150, 2),
  ('spa',      'СПА-догляд',                         'Маски, зволоження шерсті',   600.00, 60,  1),
  ('hygiene',  'Гігієнічна стрижка кігтів',          'Підрізання кігтів',          150.00, 20,  1)
) as v(cat_slug, name, descr, price, dur, ord)
join public.service_categories c on c.slug = v.cat_slug
on conflict do nothing;
