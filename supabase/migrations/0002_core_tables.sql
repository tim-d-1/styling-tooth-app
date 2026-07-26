create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          public.user_role not null default 'client',
  full_name     text,
  phone         text,
  email         text,
  avatar_url    text,
  -- CRM
  discount_pct  numeric(5,2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  admin_note    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'App user profile, 1:1 with auth.users. Role drives RLS.';

create table if not exists public.pets (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  name           text not null,
  species        public.pet_species not null,
  breed          text,
  sex            public.pet_sex not null default 'unknown',
  birth_date     date,
  weight_kg      numeric(5,2),
  color          text,
  behavior_notes text,
  medical_notes  text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists pets_owner_id_idx on public.pets (owner_id);
create index if not exists pets_breed_idx    on public.pets (breed);

create table if not exists public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references public.service_categories (id) on delete set null,
  name         text not null,
  description  text,
  price        numeric(10,2) not null default 0 check (price >= 0),
  duration_min int not null check (duration_min > 0),   -- drives slot length
  image_url    text,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists services_category_id_idx on public.services (category_id);
create index if not exists services_is_active_idx    on public.services (is_active);

create table if not exists public.masters (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid unique references public.profiles (id) on delete set null,
  display_name   text not null,
  specialization text,
  bio            text,
  avatar_url     text,
  calendar_color text default '#96B3E2',
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- which masters perform which services
create table if not exists public.master_services (
  master_id        uuid not null references public.masters (id)  on delete cascade,
  service_id       uuid not null references public.services (id) on delete cascade,
  price_override    numeric(10,2) check (price_override >= 0),
  duration_override int check (duration_override > 0),
  primary key (master_id, service_id)
);

-- weekly working hours (recurring). weekday: 0=Sun .. 6=Sat (matches EXTRACT(dow))
create table if not exists public.master_schedules (
  id         uuid primary key default gen_random_uuid(),
  master_id  uuid not null references public.masters (id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null,
  check (end_time > start_time),
  unique (master_id, weekday, start_time)
);
create index if not exists master_schedules_master_idx on public.master_schedules (master_id);

-- one-off unavailability (vacation, sick, lunch block, etc.)
create table if not exists public.master_time_off (
  id         uuid primary key default gen_random_uuid(),
  master_id  uuid not null references public.masters (id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists master_time_off_master_idx on public.master_time_off (master_id);
create index if not exists master_time_off_range_idx
  on public.master_time_off using gist (master_id, tstzrange(starts_at, ends_at));

create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles (id) on delete restrict,
  pet_id      uuid not null references public.pets (id)     on delete restrict,
  master_id   uuid not null references public.masters (id)  on delete restrict,
  service_id  uuid not null references public.services (id) on delete restrict,
  status      public.appointment_status not null default 'new',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  price       numeric(10,2) not null default 0 check (price >= 0),
  client_note text,
  admin_note  text,
  source      public.booking_source not null default 'mobile',
  payment_id  uuid,
  created_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at > starts_at),

  -- Overbooking guard: a master cannot have two overlapping active visits
  -- Cancelled visits are excluded
  constraint appointments_no_overlap exclude using gist (
    master_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled')
);
create index if not exists appointments_client_idx    on public.appointments (client_id);
create index if not exists appointments_master_idx    on public.appointments (master_id);
create index if not exists appointments_pet_idx       on public.appointments (pet_id);
create index if not exists appointments_starts_at_idx on public.appointments (starts_at);
create index if not exists appointments_status_idx    on public.appointments (status);

create table if not exists public.pet_media (
  id             uuid primary key default gen_random_uuid(),
  pet_id         uuid not null references public.pets (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  storage_path   text not null,   -- object path in the 'pet-media' bucket
  photo_type     public.pet_photo_type not null default 'general',
  caption        text,
  taken_at       timestamptz,
  created_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now()
);
create index if not exists pet_media_pet_idx         on public.pet_media (pet_id);
create index if not exists pet_media_appointment_idx on public.pet_media (appointment_id);
