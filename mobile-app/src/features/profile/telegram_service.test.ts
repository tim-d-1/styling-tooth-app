import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateTelegramLink,
  requestPhoneConfirmationViaTelegram,
  TELEGRAM_BOT_USERNAME,
} from './telegram_service';
import { supabase } from '../../lib/supabase';

describe('mobile telegram_service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws error when user is not authenticated', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    await expect(generateTelegramLink()).rejects.toThrow('Not authenticated');
  });

  it('generates a telegram deep link with 6-digit token from rpc', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'mock-user-123' },
        },
      },
      error: null,
    } as any);

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { code: '482910' },
      error: null,
    } as any);

    const linkInfo = await generateTelegramLink();

    expect(rpcSpy).toHaveBeenCalledWith('generate_verification_code', {
      p_channel: 'telegram',
      p_target: 'mock-user-123',
    });
    expect(linkInfo.token).toBe('482910');
    expect(linkInfo.botUsername).toBe(TELEGRAM_BOT_USERNAME);
    expect(linkInfo.linkUrl).toBe(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=482910`);
  });

  it('delegates phone confirmation request to telegram link generator', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'mock-user-456' },
        },
      },
      error: null,
    } as any);

    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { code: '112233' },
      error: null,
    } as any);

    const result = await requestPhoneConfirmationViaTelegram();
    expect(result.token).toBe('112233');
    expect(result.linkUrl).toBe(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=112233`);
  });
});
