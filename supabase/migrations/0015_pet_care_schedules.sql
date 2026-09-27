-- Migration 0015: Pet Care Schedules Table and RLS Policies

create table if not exists public.pet_care_schedules (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  category text not null check (category in ('parasites', 'vaccines')),
  title text not null,
  drug_name text,
  due_date date,
  badge_text text not null,
  valid_until_formatted text,
  icon_name text not null default 'fi-rr-shield-check',
  status_text text,
  status_type text not null default 'neutral' check (status_type in ('success', 'neutral', 'warning')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pet_care_schedules_pet_id_idx on public.pet_care_schedules (pet_id);
create index if not exists pet_care_schedules_due_date_idx on public.pet_care_schedules (due_date);

alter table public.pet_care_schedules enable row level security;

drop policy if exists pet_care_schedules_select on public.pet_care_schedules;
create policy pet_care_schedules_select on public.pet_care_schedules
  for select using (
    public.is_staff()
    or exists (select 1 from public.pets p where p.id = pet_care_schedules.pet_id and p.owner_id = auth.uid())
  );

drop policy if exists pet_care_schedules_insert on public.pet_care_schedules;
create policy pet_care_schedules_insert on public.pet_care_schedules
  for insert with check (
    public.is_staff()
    or exists (select 1 from public.pets p where p.id = pet_care_schedules.pet_id and p.owner_id = auth.uid())
  );

drop policy if exists pet_care_schedules_update on public.pet_care_schedules;
create policy pet_care_schedules_update on public.pet_care_schedules
  for update using (
    public.is_staff()
    or exists (select 1 from public.pets p where p.id = pet_care_schedules.pet_id and p.owner_id = auth.uid())
  ) with check (
    public.is_staff()
    or exists (select 1 from public.pets p where p.id = pet_care_schedules.pet_id and p.owner_id = auth.uid())
  );

drop policy if exists pet_care_schedules_delete on public.pet_care_schedules;
create policy pet_care_schedules_delete on public.pet_care_schedules
  for delete using (
    public.is_staff()
    or exists (select 1 from public.pets p where p.id = pet_care_schedules.pet_id and p.owner_id = auth.uid())
  );
