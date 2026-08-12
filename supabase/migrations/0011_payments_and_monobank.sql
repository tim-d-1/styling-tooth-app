-- Monobank Payments Schema, Payment Attempts, and Webhook Functions

do $$ begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'successful', 'failed', 'expired', 'refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_provider') then
    create type public.payment_provider as enum ('monobank', 'cash', 'terminal');
  end if;
end $$;

create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  client_id      uuid not null references public.profiles(id)    on delete cascade,
  amount         numeric(10,2) not null check (amount > 0),
  currency       text not null default 'UAH',
  status         public.payment_status not null default 'pending',
  provider       public.payment_provider not null default 'monobank',
  invoice_id     text,
  page_url       text,
  raw_payload    jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists payments_appointment_idx on public.payments (appointment_id);
create index if not exists payments_client_idx      on public.payments (client_id);
create index if not exists payments_invoice_id_idx  on public.payments (invoice_id);

do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'appointments_payment_id_fkey'
  ) then
    alter table public.appointments
      add constraint appointments_payment_id_fkey
      foreign key (payment_id) references public.payments(id) on delete set null;
  end if;
end $$;

alter table public.payments enable row level security;

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (client_id = auth.uid() or public.is_staff());

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert with check (client_id = auth.uid() or public.is_staff());

drop policy if exists payments_update on public.payments;
create policy payments_update on public.payments
  for update using (public.is_staff()) with check (public.is_staff());

create or replace function public.create_payment_attempt(
  p_appointment_id uuid,
  p_provider       public.payment_provider default 'monobank'
)
returns public.payments
language plpgsql security definer set search_path = public
as $$
declare
  v_client_id uuid := auth.uid();
  v_appt      public.appointments;
  v_payment   public.payments;
begin
  if v_client_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_appt from public.appointments where id = p_appointment_id;
  if v_appt.id is null then
    raise exception 'Appointment not found';
  end if;

  if not public.is_staff() and v_appt.client_id <> v_client_id then
    raise exception 'Not authorized to pay for this appointment';
  end if;

  insert into public.payments (appointment_id, client_id, amount, status, provider)
  values (v_appt.id, v_appt.client_id, v_appt.price, 'pending', p_provider)
  returning * into v_payment;

  update public.appointments set payment_id = v_payment.id where id = v_appt.id;

  return v_payment;
end;
$$;

create or replace function public.handle_monobank_webhook_event(
  p_invoice_id  text,
  p_status      text,
  p_raw_payload jsonb default null
)
returns public.payments
language plpgsql security definer set search_path = public
as $$
declare
  v_payment    public.payments;
  v_new_status public.payment_status;
begin
  select * into v_payment from public.payments where invoice_id = p_invoice_id;
  if v_payment.id is null then
    raise exception 'Payment record not found for invoice %', p_invoice_id;
  end if;

  v_new_status := case p_status
    when 'success'    then 'successful'::public.payment_status
    when 'created'    then 'pending'::public.payment_status
    when 'processing' then 'pending'::public.payment_status
    when 'failure'    then 'failed'::public.payment_status
    when 'expired'    then 'expired'::public.payment_status
    else 'failed'::public.payment_status
  end;

  update public.payments
  set status = v_new_status,
      raw_payload = p_raw_payload,
      updated_at = now()
  where id = v_payment.id
  returning * into v_payment;

  -- If payment succeeded, automatically confirm appointment if status is 'new'
  if v_new_status = 'successful' and v_payment.appointment_id is not null then
    update public.appointments
    set status = 'confirmed', updated_at = now()
    where id = v_payment.appointment_id and status = 'new';
  end if;

  return v_payment;
end;
$$;
