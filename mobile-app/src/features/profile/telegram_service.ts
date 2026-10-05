import { supabase } from '../../lib/supabase';

export interface TelegramLinkInfo {
  token: string;
  botUsername: string;
  linkUrl: string;
}

export const TELEGRAM_BOT_USERNAME =
  process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME ||
  process.env.VITE_TELEGRAM_BOT_USERNAME ||
  'styling_tooth_bot';

export async function generateTelegramLink(): Promise<TelegramLinkInfo> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
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

export async function requestPhoneConfirmationViaTelegram(): Promise<TelegramLinkInfo> {
  return await generateTelegramLink();
}
