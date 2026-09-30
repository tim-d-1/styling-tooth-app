alter table public.profiles add column if not exists telegram_chat_id text;
alter table public.profiles add column if not exists telegram_username text;
alter table public.profiles add column if not exists phone_confirmed boolean not null default false;
alter table public.profiles add column if not exists email_confirmed boolean not null default false;

create table if not exists public.verification_codes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    channel text not null check (channel in ('telegram', 'email', 'sms')),
    target text not null,
    code text not null,
    expires_at timestamptz not null default (now() + interval '15 minutes'),
    verified_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_verification_codes_target_code on public.verification_codes(target, code, expires_at);
create index if not exists idx_verification_codes_user on public.verification_codes(user_id);

create table if not exists public.user_notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    channel text not null default 'telegram' check (channel in ('telegram', 'email', 'push', 'sms', 'in_app')),
    title text not null,
    message text not null,
    status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
    payload jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    sent_at timestamptz
);

create index if not exists idx_user_notifications_user on public.user_notifications(user_id, created_at desc);
create index if not exists idx_user_notifications_status on public.user_notifications(status);

alter table public.verification_codes enable row level security;
alter table public.user_notifications enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies where schemaname = 'public' and tablename = 'verification_codes' and policyname = 'Users can view own verification codes'
    ) then
        create policy "Users can view own verification codes"
            on public.verification_codes for select
            using (auth.uid() = user_id or public.is_admin());
    end if;

    if not exists (
        select 1 from pg_policies where schemaname = 'public' and tablename = 'user_notifications' and policyname = 'Users can read own notifications'
    ) then
        create policy "Users can read own notifications"
            on public.user_notifications for select
            using (auth.uid() = user_id or public.is_admin());
    end if;

    if not exists (
        select 1 from pg_policies where schemaname = 'public' and tablename = 'user_notifications' and policyname = 'Staff can manage notifications'
    ) then
        create policy "Staff can manage notifications"
            on public.user_notifications for all
            using (public.is_admin());
    end if;
end $$;

alter publication supabase_realtime add table public.user_notifications;

create or replace function public.generate_verification_code(
    p_channel text,
    p_target text
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_user_id uuid := auth.uid();
    v_code text;
    v_expires_at timestamptz;
begin
    v_code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
    v_expires_at := now() + interval '15 minutes';

    insert into public.verification_codes (user_id, channel, target, code, expires_at)
    values (v_user_id, p_channel, trim(p_target), v_code, v_expires_at);

    return jsonb_build_object(
        'success', true,
        'channel', p_channel,
        'target', trim(p_target),
        'code', v_code,
        'expires_at', v_expires_at
    );
end;
$$;

create or replace function public.verify_confirmation_code(
    p_channel text,
    p_target text,
    p_code text
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_record record;
    v_user_id uuid := auth.uid();
begin
    select * into v_record
    from public.verification_codes
    where channel = p_channel
      and trim(target) = trim(p_target)
      and code = trim(p_code)
      and verified_at is null
      and expires_at > now()
    order by created_at desc
    limit 1;

    if v_record.id is null then
        return jsonb_build_object('success', false, 'error', 'Недійсний або прострочений код підтвердження');
    end if;

    update public.verification_codes
    set verified_at = now()
    where id = v_record.id;

    if v_user_id is not null then
        if p_channel in ('telegram', 'sms') then
            update public.profiles
            set phone_confirmed = true, updated_at = now()
            where id = v_user_id;
        elsif p_channel = 'email' then
            update public.profiles
            set email_confirmed = true, updated_at = now()
            where id = v_user_id;
        end if;
    elsif v_record.user_id is not null then
        if p_channel in ('telegram', 'sms') then
            update public.profiles
            set phone_confirmed = true, updated_at = now()
            where id = v_record.user_id;
        elsif p_channel = 'email' then
            update public.profiles
            set email_confirmed = true, updated_at = now()
            where id = v_record.user_id;
        end if;
    end if;

    return jsonb_build_object('success', true, 'message', 'Підтвердження успішне');
end;
$$;

create or replace function public.link_telegram_chat(
    p_token text,
    p_chat_id text,
    p_username text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
begin
    select user_id into v_user_id
    from public.verification_codes
    where code = trim(p_token)
      and channel = 'telegram'
      and verified_at is null
      and expires_at > now()
    order by created_at desc
    limit 1;

    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Токен привʼязки не знайдено або термін його дії закінчився');
    end if;

    update public.verification_codes
    set verified_at = now()
    where code = trim(p_token) and channel = 'telegram';

    update public.profiles
    set telegram_chat_id = trim(p_chat_id),
        telegram_username = trim(p_username),
        phone_confirmed = true,
        updated_at = now()
    where id = v_user_id;

    return jsonb_build_object('success', true, 'user_id', v_user_id);
end;
$$;

create or replace function public.confirm_phone_via_telegram(
    p_phone text,
    p_chat_id text,
    p_username text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_norm_phone text;
    v_user_id uuid;
begin
    v_norm_phone := regexp_replace(p_phone, '[^\d]', '', 'g');
    if length(v_norm_phone) = 10 and left(v_norm_phone, 1) = '0' then
        v_norm_phone := '38' || v_norm_phone;
    elsif length(v_norm_phone) = 9 then
        v_norm_phone := '380' || v_norm_phone;
    end if;

    select id into v_user_id
    from public.profiles
    where regexp_replace(coalesce(phone, ''), '[^\d]', '', 'g') = v_norm_phone
    order by created_at desc
    limit 1;

    if v_user_id is not null then
        update public.profiles
        set telegram_chat_id = trim(p_chat_id),
            telegram_username = trim(p_username),
            phone_confirmed = true,
            updated_at = now()
        where id = v_user_id;

        return jsonb_build_object('success', true, 'user_id', v_user_id, 'linked', true);
    end if;

    return jsonb_build_object('success', true, 'linked', false, 'phone', v_norm_phone);
end;
$$;
