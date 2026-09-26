-- Seed Data for Styling Tooth ("Стильний Зубець")

-- 1. Expanded Service Categories
insert into public.service_categories (name, slug, sort_order) values
  ('Грумінг',   'grooming', 1),
  ('СПА',       'spa',      2),
  ('Гігієна',   'hygiene',  3),
  ('Додатково', 'extra',    4)
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

-- 2. Expanded Services Catalog
insert into public.services (id, category_id, name, description, price, duration_min, sort_order)
select
  v.id::uuid,
  c.id,
  v.name,
  v.descr,
  v.price,
  v.dur,
  v.ord
from (values
  ('10b3da8e-6b75-469b-8469-481822085456', 'grooming', 'Комплексний грумінг (мала порода)', 'Купання, стрижка, сушка, укладка та гігієнічна обробка', 800.00, 90, 1),
  ('ec755ecc-41df-4196-87b0-b4f475ae3a78', 'grooming', 'Комплексний грумінг (велика порода)', 'Купання, стрижка, сушка та вичісування великих порід', 1400.00, 150, 2),
  ('df9198a5-c4fd-495c-891c-4721a3beda28', 'spa',      'СПА-догляд', 'Поживні маски, зволоження шерсті, аромаванна', 600.00, 60, 1),
  ('43320f5b-67f6-480b-a7cf-3d2d60d924c9', 'hygiene',  'Гігієнічна стрижка кігтів', 'Безпечне підрізання та підпилювання кігтів', 150.00, 20, 1),
  ('55555555-0001-4000-8000-000000000001', 'hygiene',  'Гігієнічний догляд', 'Чистка вух, обробка очей та делікатних зон', 300.00, 30, 2),
  ('55555555-0001-4000-8000-000000000002', 'grooming', 'Експрес-грумінг', 'Швидке освіження стрижки та купання між основними візитами', 500.00, 45, 3),
  ('55555555-0001-4000-8000-000000000003', 'grooming', 'Вичісування шерсті', 'Глибоке вичісування підшерстя та видалення ковтунів', 450.00, 60, 4),
  ('55555555-0001-4000-8000-000000000004', 'grooming', 'Породна стрижка', 'Модельна стрижка за стандартами кінологічних федерацій', 950.00, 100, 5),
  ('55555555-0001-4000-8000-000000000005', 'spa',      'Озонотерапія', 'Гідромасажна ванна з озоном для оздоровлення шкіри', 750.00, 45, 2),
  ('55555555-0001-4000-8000-000000000006', 'extra',    'Чистка зубів ультразвуком', 'Видалення зубного каменю та нальоту без наркозу', 650.00, 40, 1)
) as v(id, cat_slug, name, descr, price, dur, ord)
join public.service_categories c on c.slug = v.cat_slug
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  duration_min = excluded.duration_min,
  sort_order = excluded.sort_order;

-- 3. Staff & Demo Users in auth.users
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token, email_change_token_current,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'olena.kovalchuk@stylishtoot.com', crypt('TestPass2026!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Олена Ковальчук","phone":"+380671000001"}'::jsonb, now(), now()),
  ('22222222-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mykhailo.shevchenko@stylishtoot.com', crypt('TestPass2026!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Михайло Шевченко","phone":"+380672000002"}'::jsonb, now(), now()),
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@stylishtoot.com', crypt('TestPass2026!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Адміністратор Салону","phone":"+380670000000"}'::jsonb, now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kateryna.kovalchuk@example.com', crypt('TestPass2026!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Катерина Ковальчук","phone":"+380671234567"}'::jsonb, now(), now()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'oleksandr.melnyk@example.com', crypt('TestPass2026!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Олександр Мельник","phone":"+380502345678"}'::jsonb, now(), now()),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anna.shevchenko@example.com', crypt('TestPass2026!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Анна Шевченко","phone":"+380633456789"}'::jsonb, now(), now()),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dmytro.bondarenko@example.com', crypt('TestPass2026!', gen_salt('bf')), now(), '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Дмитро Бондаренко","phone":"+380994567890"}'::jsonb, now(), now())
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', jsonb_build_object('sub', '11111111-0000-0000-0000-000000000001', 'email', 'olena.kovalchuk@stylishtoot.com', 'email_verified', true), 'email', 'olena.kovalchuk@stylishtoot.com', now(), now(), now()),
  ('22222222-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', jsonb_build_object('sub', '22222222-0000-0000-0000-000000000002', 'email', 'mykhailo.shevchenko@stylishtoot.com', 'email_verified', true), 'email', 'mykhailo.shevchenko@stylishtoot.com', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'admin@stylishtoot.com', 'email_verified', true), 'email', 'admin@stylishtoot.com', now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', jsonb_build_object('sub', '33333333-3333-3333-3333-333333333333', 'email', 'kateryna.kovalchuk@example.com', 'email_verified', true), 'email', 'kateryna.kovalchuk@example.com', now(), now(), now()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', jsonb_build_object('sub', '44444444-4444-4444-4444-444444444444', 'email', 'oleksandr.melnyk@example.com', 'email_verified', true), 'email', 'oleksandr.melnyk@example.com', now(), now(), now()),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', jsonb_build_object('sub', '55555555-5555-5555-5555-555555555555', 'email', 'anna.shevchenko@example.com', 'email_verified', true), 'email', 'anna.shevchenko@example.com', now(), now(), now()),
  ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', jsonb_build_object('sub', '66666666-6666-6666-6666-666666666666', 'email', 'dmytro.bondarenko@example.com', 'email_verified', true), 'email', 'dmytro.bondarenko@example.com', now(), now(), now())
on conflict (provider_id, provider) do nothing;

-- 4. Profiles Details & Roles
alter table public.profiles disable trigger trg_profiles_guard_role;

update public.profiles set
  role = 'master',
  full_name = 'Олена Ковальчук',
  phone = '+380671000001',
  discount_pct = 0
where id = '11111111-0000-0000-0000-000000000001';

update public.profiles set
  role = 'master',
  full_name = 'Михайло Шевченко',
  phone = '+380672000002',
  discount_pct = 0
where id = '22222222-0000-0000-0000-000000000002';

update public.profiles set
  role = 'admin',
  full_name = 'Адміністратор Салону',
  phone = '+380670000000',
  discount_pct = 0
where id = 'a0000000-0000-0000-0000-000000000001';

update public.profiles set
  role = 'client',
  full_name = 'Тім Донін',
  phone = '+380671112233',
  discount_pct = 10.00,
  admin_note = 'Постійний VIP клієнт, 2 улюбленці'
where id = '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b';

update public.profiles set
  role = 'client',
  full_name = 'Тимофій Олександрович Донін',
  phone = '+380509876543',
  discount_pct = 5.00,
  admin_note = 'Любить ранкові візити'
where id = 'a3b21791-a11c-4731-8afe-b9f6f26c5c8e';

update public.profiles set
  role = 'client',
  full_name = 'Катерина Ковальчук',
  phone = '+380671234567',
  discount_pct = 5.00
where id = '33333333-3333-3333-3333-333333333333';

update public.profiles set
  role = 'client',
  full_name = 'Олександр Мельник',
  phone = '+380502345678',
  discount_pct = 0.00
where id = '44444444-4444-4444-4444-444444444444';

alter table public.profiles enable trigger trg_profiles_guard_role;

-- 5. Masters Setup & Linking
insert into public.masters (id, profile_id, display_name, specialization, bio, calendar_color, is_active, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', '11111111-0000-0000-0000-000000000001', 'Олена Ковальчук', 'Комплексний грумінг собак та виставковий догляд', 'Досвід понад 7 років. Сертифікований фахівець зі стрижок та гігієни.', '#96B3E2', true, 1),
  ('22222222-2222-2222-2222-222222222222', '22222222-0000-0000-0000-000000000002', 'Михайло Шевченко', 'СПА-догляд, коти та ультразвукова гігієна', 'Спеціалізується на делікатному догляді за котами та спа-процедурах.', '#EC643A', true, 2)
on conflict (id) do update set
  profile_id = excluded.profile_id,
  display_name = excluded.display_name,
  specialization = excluded.specialization,
  bio = excluded.bio,
  calendar_color = excluded.calendar_color,
  is_active = true;

-- Map all services to both masters
insert into public.master_services (master_id, service_id)
select m.id, s.id
from public.masters m
cross join public.services s
on conflict (master_id, service_id) do nothing;

-- Ensure working schedule Mon-Sat 09:00 - 18:00
do $$
declare
  v_m record;
  v_w int;
begin
  for v_m in select id from public.masters loop
    for v_w in 1..6 loop
      insert into public.master_schedules (master_id, weekday, start_time, end_time)
      values (v_m.id, v_w, '09:00:00', '18:00:00')
      on conflict (master_id, weekday, start_time) do nothing;
    end loop;
  end loop;
end $$;

-- 6. Master Time Off
insert into public.master_time_off (id, master_id, starts_at, ends_at, reason)
values
  ('99999999-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-10-05 10:00:00+00', '2026-10-05 11:00:00+00', 'Санітарна дезінфекція робочого місця'),
  ('99999999-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2026-10-10 06:00:00+00', '2026-10-10 15:00:00+00', 'Кваліфікаційний семінар з грумінгу котів')
on conflict (id) do nothing;

-- 7. Pets Seeding
-- Update previously created dummy pet if exists
update public.pets set
  name = 'Арчі',
  species = 'dog',
  breed = 'Йоркширський тер''єр',
  sex = 'male',
  birth_date = '2023-08-20',
  weight_kg = 3.20,
  color = 'Сталевий з підпалом',
  behavior_notes = 'Спокійний, любить ласощі під час стрижки',
  medical_notes = 'Чутливе праве вушко, обережно при чистці',
  is_active = true
where id = 'e155d170-47b7-4886-a762-7c9eb7a05de9';

insert into public.pets (
  id, owner_id, name, species, breed, sex, birth_date, weight_kg, color, behavior_notes, medical_notes, is_active
) values
  ('70000000-0000-0000-0000-000000000001', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', 'Барні', 'dog', 'Голден ретривер', 'male', '2023-04-12', 28.50, 'Золотистий', 'Дуже дружелюбний, обожнює воду, боїться гучного фену', 'Алергія на курячий білок', true),
  ('70000000-0000-0000-0000-000000000002', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', 'Міся', 'cat', 'Британська короткошерста', 'female', '2024-02-15', 4.20, 'Сріблястий таббі', 'Спокійна, муркоче під час вичісування', 'Без хронічних захворювань', true),
  ('70000000-0000-0000-0000-000000000003', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', 'Рекс', 'dog', 'Джек-рассел тер''єр', 'male', '2025-05-10', 6.50, 'Біло-рудий', 'Енергійний, грайливий, любить м''ячики', 'Всі планові щеплення зроблено', true),
  ('a0000000-0000-0000-0000-000000000002', 'a3b21791-a11c-4731-8afe-b9f6f26c5c8e', 'Луна', 'dog', 'Померанський шпіц', 'female', '2022-11-05', 2.80, 'Кремовий', 'Потребує делікатного розчісування підшерстя', 'Шовковиста шерсть, схильність до ковтунів', true),
  ('30000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Оскар', 'dog', 'Французький бульдог', 'male', '2023-01-10', 12.00, 'Тигровий', 'Трохи хвилюється при обрізанні кігтів', 'Чутливі складки на мордочці', true),
  ('40000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Белла', 'cat', 'Мейн-кун', 'female', '2022-06-18', 6.80, 'Черепаховий', 'Велична та спокійна кішка', 'Потрібне регулярне глибоке вичісування', true),
  ('50000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'Зевс', 'dog', 'Німецька вівчарка', 'male', '2021-09-30', 34.00, 'Чепрачний', 'Добре вихований, знає команди', 'Здоровий, активний', true)
on conflict (id) do update set
  owner_id = excluded.owner_id,
  name = excluded.name,
  species = excluded.species,
  breed = excluded.breed,
  sex = excluded.sex,
  birth_date = excluded.birth_date,
  weight_kg = excluded.weight_kg,
  color = excluded.color,
  behavior_notes = excluded.behavior_notes,
  medical_notes = excluded.medical_notes,
  is_active = true;

-- 8. Appointments Seeding
alter table public.appointments disable trigger trg_guard_appointment_update;
alter table public.appointments disable trigger trg_validate_appointment_status;

insert into public.appointments (
  id, client_id, pet_id, master_id, service_id, status, starts_at, ends_at, price, client_note, admin_note, source
) values
  ('b0000000-0000-0000-0000-000000000001', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', '70000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '10b3da8e-6b75-469b-8469-481822085456', 'completed', '2026-08-15 07:00:00+00', '2026-08-15 08:30:00+00', 800.00, 'Перед виставкою', 'Повний комплекс, собака поводилась чудово', 'mobile'),
  ('b0000000-0000-0000-0000-000000000002', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', '70000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'df9198a5-c4fd-495c-891c-4721a3beda28', 'completed', '2026-08-25 11:00:00+00', '2026-08-25 12:00:00+00', 600.00, 'Зволожувальна маска', 'СПА догляд, шерсть м''яка та шовковиста', 'web'),
  ('b0000000-0000-0000-0000-000000000003', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', '70000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '43320f5b-67f6-480b-a7cf-3d2d60d924c9', 'completed', '2026-09-05 09:00:00+00', '2026-09-05 09:20:00+00', 150.00, 'Тільки кігтики', 'Швидко підрізано, без стресу', 'mobile'),
  ('b0000000-0000-0000-0000-000000000004', 'a3b21791-a11c-4731-8afe-b9f6f26c5c8e', 'e155d170-47b7-4886-a762-7c9eb7a05de9', '11111111-1111-1111-1111-111111111111', '10b3da8e-6b75-469b-8469-481822085456', 'completed', '2026-09-12 12:00:00+00', '2026-09-12 13:30:00+00', 800.00, 'Модельна стрижка йорка', 'Класична стрижка мордочки і лапок', 'crm'),
  ('b0000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', '30000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'df9198a5-c4fd-495c-891c-4721a3beda28', 'completed', '2026-09-14 08:00:00+00', '2026-09-14 09:00:00+00', 600.00, 'Гігієнічний СПА', 'Очищення складок та маска', 'mobile'),
  ('b0000000-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444444', '40000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '10b3da8e-6b75-469b-8469-481822085456', 'cancelled', '2026-09-18 10:00:00+00', '2026-09-18 11:30:00+00', 800.00, 'Не вдалося приїхати', 'Клієнт скасував за добу', 'web'),

  ('c0000000-0000-0000-0000-000000000001', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', '70000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '10b3da8e-6b75-469b-8469-481822085456', 'confirmed', '2026-09-28 08:00:00+00', '2026-09-28 09:30:00+00', 800.00, 'Будь ласка, обережно з феном біля вушок', 'Підготувати заспокійливий спрей', 'mobile'),
  ('c0000000-0000-0000-0000-000000000002', 'a3b21791-a11c-4731-8afe-b9f6f26c5c8e', 'e155d170-47b7-4886-a762-7c9eb7a05de9', '11111111-1111-1111-1111-111111111111', '10b3da8e-6b75-469b-8469-481822085456', 'confirmed', '2026-09-29 11:00:00+00', '2026-09-29 12:30:00+00', 800.00, 'Потрібна акуратна стрижка мордочки', 'Клієнт просив коротше на лапках', 'web'),
  ('c0000000-0000-0000-0000-000000000003', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', '70000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'df9198a5-c4fd-495c-891c-4721a3beda28', 'new', '2026-10-02 12:00:00+00', '2026-10-02 13:00:00+00', 600.00, 'Делікатне вичісування', 'Очікує підтвердження дзвінком', 'mobile'),
  ('c0000000-0000-0000-0000-000000000004', 'a3b21791-a11c-4731-8afe-b9f6f26c5c8e', 'a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'df9198a5-c4fd-495c-891c-4721a3beda28', 'new', '2026-10-03 08:00:00+00', '2026-10-03 09:00:00+00', 600.00, 'СПА ванна', null, 'crm'),
  ('c0000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', '50000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'ec755ecc-41df-4196-87b0-b4f475ae3a78', 'confirmed', '2026-10-05 12:00:00+00', '2026-10-05 14:30:00+00', 1400.00, 'Грумінг вівчарки', 'Два грумери на сушку', 'crm')
on conflict (id) do update set
  client_id = excluded.client_id,
  pet_id = excluded.pet_id,
  master_id = excluded.master_id,
  service_id = excluded.service_id,
  status = excluded.status,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  price = excluded.price,
  client_note = excluded.client_note,
  admin_note = excluded.admin_note,
  source = excluded.source;

-- 9. Appointment Services
insert into public.appointment_services (appointment_id, service_id, price, duration_min, sort_order)
select a.id, a.service_id, a.price, s.duration_min, 1
from public.appointments a
join public.services s on s.id = a.service_id
on conflict (appointment_id, service_id) do update set
  price = excluded.price,
  duration_min = excluded.duration_min;

-- 10. Payments Seeding
insert into public.payments (
  id, appointment_id, client_id, amount, currency, status, provider, invoice_id, page_url
) values
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', 800.00, 'UAH', 'successful', 'monobank', 'inv_mono_20260815_01', 'https://pay.mbnk.biz/inv_mono_20260815_01'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', 600.00, 'UAH', 'successful', 'terminal', 'term_pos_20260825_02', null),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', 150.00, 'UAH', 'successful', 'cash', null, null),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'a3b21791-a11c-4731-8afe-b9f6f26c5c8e', 800.00, 'UAH', 'successful', 'monobank', 'inv_mono_20260912_04', 'https://pay.mbnk.biz/inv_mono_20260912_04'),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 600.00, 'UAH', 'successful', 'monobank', 'inv_mono_20260914_05', 'https://pay.mbnk.biz/inv_mono_20260914_05'),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', '7f7df5ce-01ea-4f6d-98b4-09b7c1c7934b', 800.00, 'UAH', 'pending', 'monobank', 'inv_mono_20260928_01', 'https://pay.mbnk.biz/inv_mono_20260928_01'),
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'a3b21791-a11c-4731-8afe-b9f6f26c5c8e', 800.00, 'UAH', 'pending', 'monobank', 'inv_mono_20260929_02', 'https://pay.mbnk.biz/inv_mono_20260929_02')
on conflict (id) do update set
  appointment_id = excluded.appointment_id,
  client_id = excluded.client_id,
  amount = excluded.amount,
  status = excluded.status,
  provider = excluded.provider,
  invoice_id = excluded.invoice_id,
  page_url = excluded.page_url;

-- Link payments back to appointments
update public.appointments a
set payment_id = p.id
from public.payments p
where p.appointment_id = a.id
  and (a.payment_id is null or a.payment_id <> p.id);

alter table public.appointments enable trigger trg_guard_appointment_update;
alter table public.appointments enable trigger trg_validate_appointment_status;

-- 11. Pet Media (Before / After / General Photos)
insert into public.pet_media (
  id, pet_id, appointment_id, storage_path, photo_type, caption, taken_at
) values
  ('e0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'pets/70000000-0000-0000-0000-000000000001/barni_before_20260815.webp', 'before', 'Барні до комплексної стрижки', '2026-08-15 07:05:00+00'),
  ('e0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'pets/70000000-0000-0000-0000-000000000001/barni_after_20260815.webp', 'after', 'Барні після укладки та вичісування', '2026-08-15 08:25:00+00'),
  ('e0000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'pets/70000000-0000-0000-0000-000000000002/misya_spa_after.webp', 'after', 'Міся після зволожувальної маски', '2026-08-25 11:55:00+00'),
  ('e0000000-0000-0000-0000-000000000004', 'e155d170-47b7-4886-a762-7c9eb7a05de9', 'b0000000-0000-0000-0000-000000000004', 'pets/e155d170-47b7-4886-a762-7c9eb7a05de9/archi_before.webp', 'before', 'Арчі перед модельною стрижкою', '2026-09-12 12:05:00+00'),
  ('e0000000-0000-0000-0000-000000000005', 'e155d170-47b7-4886-a762-7c9eb7a05de9', 'b0000000-0000-0000-0000-000000000004', 'pets/e155d170-47b7-4886-a762-7c9eb7a05de9/archi_after.webp', 'after', 'Арчі з новою модельною стрижкою', '2026-09-12 13:25:00+00'),
  ('e0000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000003', null, 'pets/70000000-0000-0000-0000-000000000003/reks_general.webp', 'general', 'Рекс у салоні', '2026-09-05 09:30:00+00')
on conflict (id) do update set
  pet_id = excluded.pet_id,
  appointment_id = excluded.appointment_id,
  storage_path = excluded.storage_path,
  photo_type = excluded.photo_type,
  caption = excluded.caption,
  taken_at = excluded.taken_at;
