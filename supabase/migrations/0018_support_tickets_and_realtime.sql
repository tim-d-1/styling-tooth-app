create type public.ticket_status as enum ('in_progress', 'waiting', 'resolved', 'closed');
create type public.ticket_category as enum ('booking', 'services', 'payment', 'transfer', 'other');
create type public.ticket_urgency as enum ('normal', 'urgent');
create type public.message_sender_role as enum ('client', 'staff', 'system');

create sequence if not exists public.support_ticket_number_seq start 4830;

create table public.support_tickets (
    id uuid primary key default gen_random_uuid(),
    ticket_number integer not null default nextval('public.support_ticket_number_seq'),
    client_id uuid not null references public.profiles(id) on delete cascade,
    subject text not null,
    category public.ticket_category not null default 'other',
    status public.ticket_status not null default 'in_progress',
    urgency public.ticket_urgency not null default 'normal',
    pet_id uuid references public.pets(id) on delete set null,
    appointment_id uuid references public.appointments(id) on delete set null,
    description text not null,
    attachment_name text,
    attachment_url text,
    assigned_staff_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.support_messages (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references public.support_tickets(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete cascade,
    sender_role public.message_sender_role not null default 'client',
    sender_name text not null,
    sender_avatar_url text,
    text text not null,
    attachment_url text,
    created_at timestamptz not null default now()
);

create index idx_support_tickets_client on public.support_tickets(client_id);
create index idx_support_tickets_status on public.support_tickets(status);
create index idx_support_messages_ticket on public.support_messages(ticket_id, created_at);

alter publication supabase_realtime add table public.support_tickets;
alter publication supabase_realtime add table public.support_messages;

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy "Clients read own tickets, staff reads all"
    on public.support_tickets for select
    using (auth.uid() = client_id or public.is_admin());

create policy "Clients insert own tickets, staff inserts"
    on public.support_tickets for insert
    with check (auth.uid() = client_id or public.is_admin());

create policy "Staff updates tickets, client can resolve/close own"
    on public.support_tickets for update
    using (auth.uid() = client_id or public.is_admin())
    with check (
        public.is_admin() or (
            auth.uid() = client_id and status in ('resolved', 'closed')
        )
    );

create policy "Read messages for accessible tickets"
    on public.support_messages for select
    using (
        exists (
            select 1 from public.support_tickets t
            where t.id = ticket_id
              and (t.client_id = auth.uid() or public.is_admin())
        )
    );

create policy "Insert messages for accessible tickets"
    on public.support_messages for insert
    with check (
        auth.uid() = sender_id and
        exists (
            select 1 from public.support_tickets t
            where t.id = ticket_id
              and (t.client_id = auth.uid() or public.is_admin())
        )
    );

create or replace function public.touch_support_ticket()
returns trigger language plpgsql security definer as $$
begin
    update public.support_tickets
    set updated_at = now()
    where id = new.ticket_id;
    return new;
end;
$$;

create trigger on_support_message_created
    after insert on public.support_messages
    for each row execute function public.touch_support_ticket();

create trigger set_support_tickets_updated_at
    before update on public.support_tickets
    for each row execute function public.set_updated_at();
