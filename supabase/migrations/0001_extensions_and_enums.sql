-- gen_random_uuid()
create extension if not exists "pgcrypto";

create extension if not exists "btree_gist";

-- Application roles. 'receptionist' has desk access without full config rights.
do $$ begin
  create type public.user_role as enum ('client', 'master', 'receptionist', 'admin');
exception when duplicate_object then null; end $$;

-- Visit lifecycle
do $$ begin
  create type public.appointment_status as enum (
    'new',         -- Новий
    'confirmed',   -- Підтверджено
    'in_progress', -- В процесі
    'completed',   -- Завершено
    'cancelled',   -- Скасовано
    'late'         -- Запізнюється
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pet_species as enum ('dog', 'cat', 'rabbit', 'rodent', 'bird', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pet_sex as enum ('male', 'female', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pet_photo_type as enum ('before', 'after', 'general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_source as enum ('mobile', 'web', 'crm');
exception when duplicate_object then null; end $$;
