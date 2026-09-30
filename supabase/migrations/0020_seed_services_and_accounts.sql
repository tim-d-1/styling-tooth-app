-- Migration 0020: Seed services, master accounts, role accounts, and pet care schedules

-- 1. Seed Service Categories
insert into public.service_categories (name, slug, sort_order) values
  ('Грумінг',   'grooming', 1),
  ('СПА',       'spa',      2),
  ('Гігієна',   'hygiene',  3)
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

-- 2. Seed Services (7 procedures matching catalog)
do $$
declare
  v_cat_grooming uuid;
  v_cat_spa      uuid;
  v_cat_hygiene  uuid;
begin
  select id into v_cat_grooming from public.service_categories where slug = 'grooming';
  select id into v_cat_spa      from public.service_categories where slug = 'spa';
  select id into v_cat_hygiene  from public.service_categories where slug = 'hygiene';

  insert into public.services (id, category_id, name, description, price, duration_min, is_active, sort_order)
  values (
    '50000000-0000-0000-0000-000000000001',
    v_cat_grooming,
    'Експрес-грумінг',
    'Швидке освіження зовнішнього вигляду без повної стрижки: купання, сушіння, легке вичісування та гігієнічний догляд.',
    850.00,
    90,
    true,
    1
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    duration_min = excluded.duration_min,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

  insert into public.services (id, category_id, name, description, price, duration_min, is_active, sort_order)
  values (
    '50000000-0000-0000-0000-000000000002',
    v_cat_spa,
    'SPA-комплекс',
    'Розслаблюючий догляд із професійною косметикою: зволоження шерсті, маска, масаж і делікатне очищення шкіри.',
    700.00,
    60,
    true,
    2
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    duration_min = excluded.duration_min,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

  insert into public.services (id, category_id, name, description, price, duration_min, is_active, sort_order)
  values (
    '50000000-0000-0000-0000-000000000003',
    v_cat_spa,
    'Озонотерапія',
    'Оздоровча процедура з озонованою водою для очищення шкіри, зменшення подразнень і покращення стану шерсті.',
    650.00,
    60,
    true,
    3
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    duration_min = excluded.duration_min,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

  insert into public.services (id, category_id, name, description, price, duration_min, is_active, sort_order)
  values (
    '50000000-0000-0000-0000-000000000004',
    v_cat_hygiene,
    'Гігієнічний догляд',
    'Догляд за лапами, очима, вухами, інтимною зоною та кігтями для підтримання чистоти й комфорту.',
    450.00,
    45,
    true,
    4
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    duration_min = excluded.duration_min,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

  insert into public.services (id, category_id, name, description, price, duration_min, is_active, sort_order)
  values (
    '50000000-0000-0000-0000-000000000005',
    v_cat_grooming,
    'Вичісування',
    'Делікатне видалення відмерлого підшерстка, ковтунів і зайвої шерсті для здорового та охайного вигляду.',
    550.00,
    60,
    true,
    5
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    duration_min = excluded.duration_min,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

  insert into public.services (id, category_id, name, description, price, duration_min, is_active, sort_order)
  values (
    '50000000-0000-0000-0000-000000000006',
    v_cat_grooming,
    'Породна стрижка',
    'Професійна стрижка за стандартом породи для підтримання доглянутого вигляду та підкреслення природної краси шерсті.',
    1100.00,
    120,
    true,
    6
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    duration_min = excluded.duration_min,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

  insert into public.services (id, category_id, name, description, price, duration_min, is_active, sort_order)
  values (
    '50000000-0000-0000-0000-000000000007',
    v_cat_hygiene,
    'Підстригання кігтів',
    'Безпечне підстригання кігтів із дбайливою обробкою країв для комфорту та здоров''я лап.',
    250.00,
    20,
    true,
    7
  )
  on conflict (id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    duration_min = excluded.duration_min,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;
end $$;

-- 3. Seed Accounts (2 Masters, 1 Receptionist, 1 Admin)
-- Password for all accounts: StylingTooth2026!
do $$
declare
  v_pwd_hash text := extensions.crypt('StylingTooth2026!', extensions.gen_salt('bf', 10));
  v_users record;
begin
  alter table public.profiles disable trigger trg_profiles_guard_role;

  for v_users in
    select * from (values
      (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'master.olena@stylingtooth.com',
        'Олена Ковальчук',
        'master'::public.user_role,
        '+380501112233',
        '/assets/images/master_olena.webp'
      ),
      (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'master.mykhailo@stylingtooth.com',
        'Михайло Шевченко',
        'master'::public.user_role,
        '+380502223344',
        '/assets/images/master_mykhailo.webp'
      ),
      (
        '33333333-3333-3333-3333-333333333333'::uuid,
        'receptionist@stylingtooth.com',
        'Ірина Мельник',
        'receptionist'::public.user_role,
        '+380503334455',
        null
      ),
      (
        '44444444-4444-4444-4444-444444444444'::uuid,
        'admin@stylingtooth.com',
        'Сергій Бондаренко',
        'admin'::public.user_role,
        '+380504445566',
        '/assets/images/expert_advice_logo.png'
      )
    ) as t(id, email, full_name, role, phone, avatar_url)
  loop
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      reauthentication_token,
      phone_change,
      phone_change_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_sso_user,
      is_anonymous
    ) values (
      v_users.id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_users.email,
      v_pwd_hash,
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_users.full_name, 'role', v_users.role::text, 'phone', v_users.phone, 'avatar_url', v_users.avatar_url),
      now(),
      now(),
      false,
      false
    )
    on conflict (id) do update set
      email = excluded.email,
      encrypted_password = excluded.encrypted_password,
      confirmation_token = coalesce(auth.users.confirmation_token, ''),
      recovery_token = coalesce(auth.users.recovery_token, ''),
      email_change_token_new = coalesce(auth.users.email_change_token_new, ''),
      email_change = coalesce(auth.users.email_change, ''),
      email_change_token_current = coalesce(auth.users.email_change_token_current, ''),
      reauthentication_token = coalesce(auth.users.reauthentication_token, ''),
      phone_change = coalesce(auth.users.phone_change, ''),
      phone_change_token = coalesce(auth.users.phone_change_token, ''),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data,
      email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
      updated_at = now();

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      v_users.id,
      v_users.id,
      jsonb_build_object('sub', v_users.id::text, 'email', v_users.email),
      'email',
      v_users.id::text,
      now(),
      now(),
      now()
    )
    on conflict (provider, provider_id) do update set
      identity_data = excluded.identity_data,
      updated_at = now();

    insert into public.profiles (id, full_name, email, phone, role, avatar_url)
    values (v_users.id, v_users.full_name, v_users.email, v_users.phone, v_users.role, v_users.avatar_url)
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      phone = excluded.phone,
      role = excluded.role,
      avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  end loop;

  alter table public.profiles enable trigger trg_profiles_guard_role;
end $$;

-- 4. Seed public.masters (2 masters)
insert into public.masters (id, profile_id, display_name, specialization, bio, calendar_color, is_active, sort_order)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Олена Ковальчук',
    'Комплексний грумінг собак',
    'Досвід понад 7 років. Сертифікований фахівець зі стрижок та гігієни.',
    '#96B3E2',
    true,
    1
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Михайло Шевченко',
    'СПА-догляд та коти',
    'Спеціалізується на делікатному догляді за котами та спа-процедурах.',
    '#EC643A',
    true,
    2
  )
on conflict (id) do update set
  profile_id = excluded.profile_id,
  display_name = excluded.display_name,
  specialization = excluded.specialization,
  bio = excluded.bio,
  calendar_color = excluded.calendar_color,
  is_active = true,
  sort_order = excluded.sort_order;

-- 5. Link Masters to Services in public.master_services
insert into public.master_services (master_id, service_id)
select m.id, s.id
from public.masters m
cross join public.services s
where m.id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;

-- 6. Seed Pet Care Schedule for the existing pet
do $$
declare
  v_pet_id uuid;
begin
  select id into v_pet_id from public.pets limit 1;

  if v_pet_id is not null then
    delete from public.pet_care_schedules where pet_id = v_pet_id;

    insert into public.pet_care_schedules (
      id,
      pet_id,
      category,
      title,
      drug_name,
      due_date,
      badge_text,
      valid_until_formatted,
      icon_name,
      status_text,
      status_type,
      sort_order
    ) values
      (
        '80000000-0000-0000-0000-000000000001',
        v_pet_id,
        'parasites',
        'Від кліщів та бліх',
        'Bravecto Plus',
        '2026-10-15',
        '✓ Захищено',
        'Наступна: 15 жовт.',
        'fi-rr-shield-check',
        '✓ Захищено',
        'success',
        1
      ),
      (
        '80000000-0000-0000-0000-000000000002',
        v_pet_id,
        'parasites',
        'Дегельмінтизація',
        'Milbemax',
        '2026-11-10',
        'Через 1 міс.',
        'Наступна: 10 лист.',
        'fi-rr-medicine',
        'Через 1 міс.',
        'neutral',
        2
      ),
      (
        '80000000-0000-0000-0000-000000000003',
        v_pet_id,
        'vaccines',
        'Комплексна вакцинація',
        'Nobivac Tricat Trio',
        '2027-07-24',
        'Діє до 24 лип.',
        'Щорічна ревакцинація',
        'fi-rr-syringe',
        'Діє до 24 лип.',
        'success',
        3
      ),
      (
        '80000000-0000-0000-0000-000000000004',
        v_pet_id,
        'vaccines',
        'Вакцинація від сказу',
        'Nobivac Rabies',
        '2027-07-24',
        'Діє до 24 лип.',
        'Щорічна ревакцинація',
        'fi-rr-shield-check',
        'Діє до 24 лип.',
        'success',
        4
      );
  end if;
end $$;
