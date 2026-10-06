-- Migration 0029: Improve telegram phone linking and normalization
-- Handles 9, 10, and 12-digit Ukrainian phone numbers and links phone if user chat_id already matched

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

    -- Search by phone match OR existing telegram chat id match
    select id into v_user_id
    from public.profiles
    where regexp_replace(coalesce(phone, ''), '[^\d]', '', 'g') = v_norm_phone
       or (telegram_chat_id is not null and telegram_chat_id = trim(p_chat_id))
    order by created_at desc
    limit 1;

    if v_user_id is not null then
        update public.profiles
        set telegram_chat_id = trim(p_chat_id),
            telegram_username = trim(p_username),
            phone = coalesce(phone, '+' || v_norm_phone),
            phone_confirmed = true,
            updated_at = now()
        where id = v_user_id;

        return jsonb_build_object('success', true, 'user_id', v_user_id, 'linked', true);
    end if;

    return jsonb_build_object('success', true, 'linked', false, 'phone', v_norm_phone);
end;
$$;
