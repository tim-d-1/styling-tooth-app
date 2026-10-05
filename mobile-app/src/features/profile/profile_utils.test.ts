import { describe, it, expect } from 'vitest';
import {
  resolveProfileUserName,
  resolveGreeting,
  formatProfilePhone,
  resolvePaymentSubtitle,
  formatBonusPoints,
} from './profile_utils';

describe('profile_utils', () => {
  it('resolves user name from profile data first', () => {
    const profileData = { full_name: 'Олена Сидоренко' };
    const sessionUser = {
      user_metadata: { first_name: 'Олена', last_name: 'Коваль' },
      email: 'olena@example.com',
    };
    expect(resolveProfileUserName(profileData, sessionUser)).toBe('Олена Сидоренко');
  });

  it('resolves user name from session metadata first and last name if profile is empty', () => {
    const sessionUser = {
      user_metadata: { first_name: 'Богдан', last_name: 'Мельник' },
      email: 'bogdan@example.com',
    };
    expect(resolveProfileUserName(null, sessionUser)).toBe('Богдан Мельник');
  });

  it('resolves user name from email prefix if no metadata or profile name exists', () => {
    const sessionUser = {
      user_metadata: {},
      email: 'customer42@example.com',
    };
    expect(resolveProfileUserName(null, sessionUser)).toBe('customer42');
  });

  it('returns empty string if user cannot be identified', () => {
    expect(resolveProfileUserName(null, null)).toBe('');
  });

  it('resolves greeting with first name extracted from full name', () => {
    expect(resolveGreeting('Катерина Шевченко')).toBe('Вітаємо, Катерина! 👋');
    expect(resolveGreeting('Олександр')).toBe('Вітаємо, Олександр! 👋');
    expect(resolveGreeting('')).toBe('Вітаємо! 👋');
    expect(resolveGreeting(null)).toBe('Вітаємо! 👋');
  });

  it('formats profile phone number or falls back to "Номер не вказано"', () => {
    expect(formatProfilePhone('+380 97 123 45 67')).toBe('+380 97 123 45 67');
    expect(formatProfilePhone('')).toBe('Номер не вказано');
    expect(formatProfilePhone(null)).toBe('Номер не вказано');
    expect(formatProfilePhone('   ')).toBe('Номер не вказано');
  });

  it('resolves payment subtitle with formatted labels or default Банківська картка', () => {
    expect(resolvePaymentSubtitle([])).toBe('Банківська картка');
    expect(resolvePaymentSubtitle(null as any)).toBe('Банківська картка');
    expect(
      resolvePaymentSubtitle([
        { type: 'card', last4: '4821' },
      ])
    ).toBe('*4821');
  });

  it('formats bonus points with Ukrainian locale thousands separator', () => {
    expect(formatBonusPoints(450)).toBe('450');
    expect(formatBonusPoints(12500)).toMatch(/12[\s\u00A0\u202F]?500/);
    expect(formatBonusPoints(0)).toBe('0');
    expect(formatBonusPoints(null)).toBe('0');
  });
});
