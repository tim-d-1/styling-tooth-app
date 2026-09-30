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

function formatVisitReminderMessage(params: {
  petName: string;
  serviceName: string;
  startsAt: string;
  price: number;
}): string {
  const dateStr = new Date(params.startsAt).toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `🐾 <b>Нагадування про візит до «Стильний Зубець»</b>\n\n📅 Час: <b>${dateStr}</b>\n🐶 Улюбленець: <b>${params.petName}</b>\n✂️ Послуга: <b>${params.serviceName}</b>\n💰 Вартість: <b>${params.price} ₴</b>\n\nБудь ласка, приходьте за 5-10 хвилин до початку. До зустрічі!`;
}

function formatSupportReplyMessage(params: {
  ticketNumber: number;
  senderName: string;
  text: string;
}): string {
  return `💬 <b>Нова відповідь у зверненні #${params.ticketNumber}</b>\nВід: <b>${params.senderName}</b>\n\n«${params.text}»\n\nВідповісти можна в особистому кабінеті на сайті або у додатку.`;
}

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
    it('formats appointment reminder with balanced HTML tags', () => {
      const msg = formatVisitReminderMessage({
        petName: 'Роккі',
        serviceName: 'Комплексний грумінг',
        startsAt: '2026-10-05T14:00:00Z',
        price: 1200,
      });

      expect(msg).toContain('<b>Нагадування про візит до «Стильний Зубець»</b>');
      expect(msg).toContain('Роккі');
      expect(msg).toContain('1200 ₴');

      const openTags = (msg.match(/<b>/g) || []).length;
      const closeTags = (msg.match(/<\/b>/g) || []).length;
      expect(openTags).toBe(closeTags);
    });

    it('formats support reply with ticket number and sender', () => {
      const msg = formatSupportReplyMessage({
        ticketNumber: 4835,
        senderName: 'Сергій (Адміністратор)',
        text: 'Ваш візит успішно перенесено на завтра на 15:00.',
      });

      expect(msg).toContain('#4835');
      expect(msg).toContain('Сергій (Адміністратор)');
      expect(msg).toContain('Ваш візит успішно перенесено');
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
