import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getConfirmationStatus,
  generateTelegramLink,
  requestPhoneConfirmationViaTelegram,
  verifyOtpCode,
  sendTestTelegramNotification,
  TELEGRAM_BOT_USERNAME,
} from './telegram_service';
import { supabase } from '@/lib/supabase';

describe('telegram_service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves confirmation status for authenticated user', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: {
        user: {
          id: 'user-tg-1',
          email_confirmed_at: '2026-10-01T00:00:00Z',
        } as any,
      },
      error: null,
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          phone_confirmed: true,
          email_confirmed: true,
          telegram_chat_id: '12345678',
          telegram_username: 'tim_grooming',
        },
        error: null,
      }),
    } as any);

    const status = await getConfirmationStatus();
    expect(status.isPhoneConfirmed).toBe(true);
    expect(status.isEmailConfirmed).toBe(true);
    expect(status.telegramChatId).toBe('12345678');
    expect(status.telegramUsername).toBe('tim_grooming');
  });

  it('returns default unconfirmed status when user is not logged in', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const status = await getConfirmationStatus();
    expect(status.isPhoneConfirmed).toBe(false);
    expect(status.isEmailConfirmed).toBe(false);
    expect(status.telegramChatId).toBeNull();
  });

  it('generates a telegram deep link with random token', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-tg-2' } as any },
      error: null,
    });

    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { code: '482910' },
      error: null,
    } as any);

    const linkInfo = await generateTelegramLink();
    expect(linkInfo.token).toBe('482910');
    expect(linkInfo.botUsername).toBe(TELEGRAM_BOT_USERNAME);
    expect(linkInfo.linkUrl).toBe(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=482910`);
  });

  it('delegates phone confirmation request to telegram link generator', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-tg-3' } as any },
      error: null,
    });

    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { code: '777888' },
      error: null,
    } as any);

    const result = await requestPhoneConfirmationViaTelegram();
    expect(result.token).toBe('777888');
    expect(result.linkUrl).toContain('start=777888');
  });

  it('verifies otp code successfully via rpc', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { success: true },
      error: null,
    } as any);

    const res = await verifyOtpCode('telegram', 'user-1', '123456');
    expect(res.success).toBe(true);
  });

  it('handles invalid otp verification error cleanly', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { success: false, error: 'Недійсний код' },
      error: null,
    } as any);

    const res = await verifyOtpCode('sms', '+380501234567', '000000');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Недійсний код');
  });

  it('sends test notification via supabase edge function', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-tg-4' } as any },
      error: null,
    });

    vi.spyOn(Object.getPrototypeOf(supabase.functions), 'invoke').mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const success = await sendTestTelegramNotification('Перевірка звʼязку');
    expect(success).toBe(true);
  });
});
