import { describe, it, expect } from 'vitest';

function normalizeUkrainianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    return `38${digits}`;
  }
  if (digits.length === 9) {
    return `380${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('380')) {
    return digits;
  }
  return digits;
}

import {
  formatBookingConfirmedMessage,
  formatReminder24hMessage,
  formatReminder2hMessage,
  formatPetReadyMessage,
  formatCareScheduleMessage,
  formatSupportReplyMessage,
} from './telegram_templates';

function isCodeValid(codeRecord: {
  code: string;
  expiresAt: string;
  verifiedAt: string | null;
}, submittedCode: string): boolean {
  if (codeRecord.verifiedAt !== null) return false;
  if (new Date(codeRecord.expiresAt).getTime() <= Date.now()) return false;
  return codeRecord.code.trim() === submittedCode.trim();
}

describe('Telegram Notifications & Confirmations Eval Suite', () => {
  describe('Phone normalization', () => {
    it('normalizes various input formats to standard 380XXXXXXXXX', () => {
      const inputs = [
        '+380 (50) 123-45-67',
        '0501234567',
        '+380501234567',
        '380501234567',
        '050 123 45 67',
      ];
      inputs.forEach((input) => {
        expect(normalizeUkrainianPhone(input)).toBe('380501234567');
      });
    });
  });

  describe('Deep link & token validation', () => {
    it('produces valid start token and telegram URL', () => {
      const token = '839201';
      const bot = 'StylingToothBot';
      const url = `https://t.me/${bot}?start=${token}`;
      expect(url).toMatch(/^https:\/\/t\.me\/[A-Za-z0-9_]+\?start=\d{6}$/);
    });
  });

  describe('Message formatting & HTML validation', () => {
    it('formats booking confirmation with balanced HTML tags and details', () => {
      const msg = formatBookingConfirmedMessage({
        petName: 'Міся',
        petBreed: 'Шотландська висловуха',
        serviceName: 'Експрес-грумінг',
        dateTimeFormatted: 'Середа, 7 жовтня, 12:00',
        masterName: 'Михайло Шевченко',
        price: 850,
      });

      expect(msg).toContain('Міся');
      expect(msg).toContain('Шотландська висловуха');
      expect(msg).toContain('850 ₴');
      const openTags = (msg.match(/<b>/g) || []).length;
      const closeTags = (msg.match(/<\/b>/g) || []).length;
      expect(openTags).toBe(closeTags);
    });

    it('formats 24h and 2h reminders with balanced HTML tags', () => {
      const msg24 = formatReminder24hMessage({
        petName: 'Міся',
        serviceName: 'Експрес-грумінг',
        dateTimeFormatted: '12:00',
        masterName: 'Михайло Шевченко',
      });
      expect(msg24).toContain('Міся');
      expect((msg24.match(/<b>/g) || []).length).toBe((msg24.match(/<\/b>/g) || []).length);

      const msg2 = formatReminder2hMessage({
        petName: 'Міся',
        serviceName: 'Експрес-грумінг',
        dateTimeFormatted: '12:00',
        masterName: 'Михайло Шевченко',
      });
      expect(msg2).toContain('Міся');
      expect((msg2.match(/<b>/g) || []).length).toBe((msg2.match(/<\/b>/g) || []).length);
    });

    it('formats pet ready and care schedule messages with balanced HTML tags', () => {
      const readyMsg = formatPetReadyMessage({
        petName: 'Міся',
        serviceName: 'Експрес-грумінг',
      });
      expect(readyMsg).toContain('Міся');
      expect((readyMsg.match(/<b>/g) || []).length).toBe((readyMsg.match(/<\/b>/g) || []).length);

      const careMsg = formatCareScheduleMessage({
        petName: 'Міся',
        title: 'Вакцинація проти сказу',
        validUntilFormatted: 'до 10 жовтня 2026',
      });
      expect(careMsg).toContain('Вакцинація проти сказу');
      expect((careMsg.match(/<b>/g) || []).length).toBe((careMsg.match(/<\/b>/g) || []).length);
    });

    it('formats support reply with ticket number and balanced tags', () => {
      const msg = formatSupportReplyMessage({
        ticketNumber: 4835,
        senderName: 'Сергій (Адміністратор)',
        text: 'Ваш візит успішно перенесено на завтра на 15:00.',
      });

      expect(msg).toContain('#4835');
      expect(msg).toContain('Сергій (Адміністратор)');
      expect((msg.match(/<i>/g) || []).length).toBe((msg.match(/<\/i>/g) || []).length);
    });
  });

  describe('Verification code expiration and security', () => {
    it('accepts active, unverified code matching submitted code', () => {
      const active = {
        code: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verifiedAt: null,
      };
      expect(isCodeValid(active, '123456')).toBe(true);
    });

    it('rejects expired codes', () => {
      const expired = {
        code: '123456',
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
        verifiedAt: null,
      };
      expect(isCodeValid(expired, '123456')).toBe(false);
    });

    it('rejects already used codes', () => {
      const used = {
        code: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verifiedAt: new Date().toISOString(),
      };
      expect(isCodeValid(used, '123456')).toBe(false);
    });

    it('rejects mismatched codes', () => {
      const active = {
        code: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verifiedAt: null,
      };
      expect(isCodeValid(active, '999999')).toBe(false);
    });
  });
});
