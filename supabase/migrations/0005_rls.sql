alter table public.profiles           enable row level security;
alter table public.pets               enable row level security;
alter table public.pet_media          enable row level security;
alter table public.service_categories enable row level security;
alter table public.services           enable row level security;
alter table public.masters            enable row level security;
alter table public.master_services    enable row level security;
alter table public.master_schedules   enable row level security;
alter table public.master_time_off    enable row level security;
alter table public.appointments       enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists pets_select on public.pets;
create policy pets_select on public.pets
  for select using (owner_id = auth.uid() or public.is_staff());

drop policy if exists pets_insert on public.pets;
create policy pets_insert on public.pets
  for insert with check (owner_id = auth.uid() or public.is_staff());

drop policy if exists pets_update on public.pets;
create policy pets_update on public.pets
  for update using (owner_id = auth.uid() or public.is_staff())
  with check (owner_id = auth.uid() or public.is_staff());

drop policy if exists pets_delete on public.pets;
create policy pets_delete on public.pets
  for delete using (owner_id = auth.uid() or public.is_admin());

drop policy if exists pet_media_select on public.pet_media;
create policy pet_media_select on public.pet_media
  for select using (
    public.is_staff()
    or exists (select 1 from public.pets p where p.id = pet_media.pet_id and p.owner_id = auth.uid())
  );

drop policy if exists pet_media_insert on public.pet_media;
create policy pet_media_insert on public.pet_media
  for insert with check (
    public.is_staff()
    or exists (select 1 from public.pets p where p.id = pet_media.pet_id and p.owner_id = auth.uid())
  );

drop policy if exists pet_media_delete on public.pet_media;
create policy pet_media_delete on public.pet_media
  for delete using (
    public.is_staff()
    or exists (select 1 from public.pets p where p.id = pet_media.pet_id and p.owner_id = auth.uid())
  );

drop policy if exists service_categories_read on public.service_categories;
create policy service_categories_read on public.service_categories
  for select using (true);
drop policy if exists service_categories_write on public.service_categories;
create policy service_categories_write on public.service_categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists services_read on public.services;
create policy services_read on public.services
  for select using (true);
drop policy if exists services_write on public.services;
create policy services_write on public.services
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists masters_read on public.masters;
create policy masters_read on public.masters
  for select using (true);
drop policy if exists masters_write on public.masters;
create policy masters_write on public.masters
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists master_services_read on public.master_services;
create policy master_services_read on public.master_services
  for select using (true);
drop policy if exists master_services_write on public.master_services;
create policy master_services_write on public.master_services
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists master_schedules_read on public.master_schedules;
create policy master_schedules_read on public.master_schedules
  for select using (true);
drop policy if exists master_schedules_write on public.master_schedules;
create policy master_schedules_write on public.master_schedules
  for all using (public.is_admin()) with check (public.is_admin());

-- time-off is internal: staff read, admin write
drop policy if exists master_time_off_read on public.master_time_off;
create policy master_time_off_read on public.master_time_off
  for select using (public.is_staff());
drop policy if exists master_time_off_write on public.master_time_off;
create policy master_time_off_write on public.master_time_off
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- appointments
--   select: own (client) / assigned (master) / staff
--   insert: prefer create_appointment() RPC; direct insert allowed for own/staff
--   update: staff any; client may edit own (e.g. cancel)
--   delete: admin only
-- ----------------------------------------------------------------------------
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select using (
    client_id = auth.uid()
    or master_id = public.current_master_id()
    or public.is_staff()
  );

drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
  for insert with check (client_id = auth.uid() or public.is_staff());

drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments
  for update using (client_id = auth.uid() or public.is_staff())
  with check (client_id = auth.uid() or public.is_staff());

drop policy if exists appointments_delete on public.appointments;
create policy appointments_delete on public.appointments
  for delete using (public.is_admin());
