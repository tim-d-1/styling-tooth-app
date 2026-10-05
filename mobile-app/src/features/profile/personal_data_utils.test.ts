import { describe, it, expect } from 'vitest';
import {
  formatUkrainianDate,
  formatGender,
  parseGender,
  formatPhoneDisplay,
  isFigmaDummyPlaceholder,
  sanitizePersonalData,
} from './personal_data_utils';

describe('personal_data_utils', () => {
  describe('formatUkrainianDate', () => {
    it('returns "Не вказано" for empty or null dates', () => {
      expect(formatUkrainianDate(null)).toBe('Не вказано');
      expect(formatUkrainianDate('')).toBe('Не вказано');
      expect(formatUkrainianDate('   ')).toBe('Не вказано');
    });

    it('formats ISO YYYY-MM-DD date into Ukrainian month format', () => {
      expect(formatUkrainianDate('1995-05-14')).toBe('14 Травня 1995');
      expect(formatUkrainianDate('2001-01-01')).toBe('1 Січня 2001');
      expect(formatUkrainianDate('1988-12-31')).toBe('31 Грудня 1988');
    });

    it('formats dot separated DD.MM.YYYY date', () => {
      expect(formatUkrainianDate('14.05.1995')).toBe('14 Травня 1995');
      expect(formatUkrainianDate('01.09.2000')).toBe('1 Вересня 2000');
    });

    it('returns original string if unparseable', () => {
      expect(formatUkrainianDate('some-unknown-string')).toBe('some-unknown-string');
    });
  });

  describe('formatGender & parseGender', () => {
    it('formats gender keys to Ukrainian text', () => {
      expect(formatGender('female')).toBe('Жіноча');
      expect(formatGender('male')).toBe('Чоловіча');
      expect(formatGender('other')).toBe('Інше');
      expect(formatGender(null)).toBe('Не вказано');
      expect(formatGender('')).toBe('Не вказано');
    });

    it('parses Ukrainian labels to gender keys', () => {
      expect(parseGender('Жіноча')).toBe('female');
      expect(parseGender('Чоловіча')).toBe('male');
      expect(parseGender('Інше')).toBe('other');
      expect(parseGender('Не вказано')).toBe('');
      expect(parseGender(null)).toBe('');
    });
  });

  describe('formatPhoneDisplay', () => {
    it('formats 12-digit Ukrainian phone number', () => {
      expect(formatPhoneDisplay('+380971234567')).toBe('+380 (97) 123 45 67');
      expect(formatPhoneDisplay('380971234567')).toBe('+380 (97) 123 45 67');
    });

    it('formats 10-digit Ukrainian phone number starting with 0', () => {
      expect(formatPhoneDisplay('0971234567')).toBe('+380 (97) 123 45 67');
    });

    it('returns empty string when input is empty', () => {
      expect(formatPhoneDisplay('')).toBe('');
      expect(formatPhoneDisplay(null)).toBe('');
    });
  });

  describe('isFigmaDummyPlaceholder', () => {
    it('detects Figma static placeholder texts', () => {
      expect(isFigmaDummyPlaceholder('Катерина Ковальчук')).toBe(true);
      expect(isFigmaDummyPlaceholder('kateryna.pet@gmail.com')).toBe(true);
      expect(isFigmaDummyPlaceholder('+380 (97) 123 45 67')).toBe(true);
      expect(isFigmaDummyPlaceholder('+380971234567')).toBe(true);
      expect(isFigmaDummyPlaceholder('14 Травня 1995')).toBe(true);
      expect(isFigmaDummyPlaceholder('1995-05-14')).toBe(true);
    });

    it('returns false for actual user inputs', () => {
      expect(isFigmaDummyPlaceholder('Олександр Петренко')).toBe(false);
      expect(isFigmaDummyPlaceholder('alex@example.com')).toBe(false);
      expect(isFigmaDummyPlaceholder('+380509998877')).toBe(false);
      expect(isFigmaDummyPlaceholder('2000-10-20')).toBe(false);
      expect(isFigmaDummyPlaceholder(null)).toBe(false);
    });
  });

  describe('sanitizePersonalData', () => {
    it('clears Figma dummy placeholders from profile data', () => {
      const sanitized = sanitizePersonalData({
        fullName: 'Катерина Ковальчук',
        email: 'kateryna.pet@gmail.com',
        phone: '+380 (97) 123 45 67',
        birthDate: '14 Травня 1995',
      });

      expect(sanitized.fullName).toBe('');
      expect(sanitized.email).toBe('');
      expect(sanitized.phone).toBe('');
      expect(sanitized.birthDate).toBe('');
    });

    it('preserves valid user data and returns defaults', () => {
      const sanitized = sanitizePersonalData({
        fullName: 'Іван Бойко',
        email: 'ivan@example.com',
        phone: '+380501112233',
        gender: 'male',
        isPhoneVerified: true,
        isEmailVerified: false,
        birthDate: '1990-08-12',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      expect(sanitized.fullName).toBe('Іван Бойко');
      expect(sanitized.email).toBe('ivan@example.com');
      expect(sanitized.phone).toBe('+380501112233');
      expect(sanitized.gender).toBe('male');
      expect(sanitized.isPhoneVerified).toBe(true);
      expect(sanitized.isEmailVerified).toBe(false);
      expect(sanitized.birthDate).toBe('1990-08-12');
      expect(sanitized.avatarUrl).toBe('https://example.com/avatar.jpg');
    });
  });
});
