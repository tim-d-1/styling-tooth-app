import { supabase } from '@/lib/supabase';

export interface TelegramLinkInfo {
  token: string;
  botUsername: string;
  linkUrl: string;
}

export interface ConfirmationStatus {
  isPhoneConfirmed: boolean;
  isEmailConfirmed: boolean;
  telegramChatId: string | null;
  telegramUsername: string | null;
}

export const TELEGRAM_BOT_USERNAME =
  (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'StylingToothBot';

export async function getConfirmationStatus(): Promise<ConfirmationStatus> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      isPhoneConfirmed: false,
      isEmailConfirmed: false,
      telegramChatId: null,
      telegramUsername: null,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_confirmed, email_confirmed, telegram_chat_id, telegram_username')
    .eq('id', user.id)
    .maybeSingle();

  return {
    isPhoneConfirmed: Boolean(profile?.phone_confirmed),
    isEmailConfirmed: Boolean(profile?.email_confirmed || user.email_confirmed_at),
    telegramChatId: profile?.telegram_chat_id || null,
    telegramUsername: profile?.telegram_username || null,
  };
}

export async function generateTelegramLink(): Promise<TelegramLinkInfo> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('generate_verification_code', {
    p_channel: 'telegram',
    p_target: user.id,
  });

  if (error) throw error;

  const token = data?.code || '';
  const linkUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;

  return {
    token,
    botUsername: TELEGRAM_BOT_USERNAME,
    linkUrl,
  };
}

export async function requestPhoneConfirmationViaTelegram(): Promise<{
  token: string;
  linkUrl: string;
}> {
  return await generateTelegramLink();
}

export async function verifyOtpCode(
  channel: 'telegram' | 'email' | 'sms',
  target: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('verify_confirmation_code', {
    p_channel: channel,
    p_target: target,
    p_code: code,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data?.success) {
    return { success: false, error: data?.error || 'Помилка перевірки коду' };
  }

  return { success: true };
}

export async function sendTestTelegramNotification(message: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const { data, error } = await supabase.functions.invoke('telegram-bot', {
      body: {
        action: 'send_notification',
        userId: user.id,
        title: '🐾 «Стильний Зубець»',
        message: message || 'Тестове сповіщення: ваш Telegram успішно налаштовано для отримання нагадувань!',
      },
    });

    if (error) {
      console.warn('Telegram edge function warning:', error);
      return false;
    }

    return Boolean(data?.success || data?.simulated);
  } catch (err) {
    console.warn('Failed to invoke telegram-bot function:', err);
    return false;
  }
}
