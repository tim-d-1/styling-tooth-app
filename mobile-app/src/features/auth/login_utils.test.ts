import { describe, it, expect } from 'vitest';
import {
  isEmailIdentifier,
  isPhoneIdentifier,
  normalizePhoneNumber,
  phoneToAuthEmail,
  validateLoginForm,
  parseOAuthRedirectUrl,
} from './login_utils';

describe('login_utils', () => {
  it('correctly identifies valid emails', () => {
    expect(isEmailIdentifier('user@example.com')).toBe(true);
    expect(isEmailIdentifier('test.user+1@domain.co.uk')).toBe(true);
    expect(isEmailIdentifier('invalid-email')).toBe(false);
    expect(isEmailIdentifier('user@')).toBe(false);
  });

  it('normalizes local and international phone numbers', () => {
    expect(normalizePhoneNumber('981234567')).toBe('+380981234567');
    expect(normalizePhoneNumber('0981234567')).toBe('+380981234567');
    expect(normalizePhoneNumber('380981234567')).toBe('+380981234567');
    expect(normalizePhoneNumber('+380981234567')).toBe('+380981234567');
    expect(normalizePhoneNumber('+12345678901')).toBe('+12345678901');
    expect(normalizePhoneNumber('12345')).toBeNull();
  });

  it('generates synthetic auth email from phone number', () => {
    expect(phoneToAuthEmail('+380981234567')).toBe('380981234567@phone.stylingtooth.app');
  });

  it('validates empty inputs and short passwords', () => {
    expect(validateLoginForm('', 'password123')).toEqual({
      isValid: false,
      error: 'Введіть Email або номер телефону',
    });

    expect(validateLoginForm('user@example.com', '')).toEqual({
      isValid: false,
      error: 'Введіть пароль',
    });

    expect(validateLoginForm('user@example.com', '12345')).toEqual({
      isValid: false,
      error: 'Пароль повинен містити не менше 6 символів',
    });

    expect(validateLoginForm('notanemail', '123456')).toEqual({
      isValid: false,
      error: 'Введіть коректний Email або номер телефону',
    });

    expect(validateLoginForm('user@example.com', 'password123')).toEqual({
      isValid: true,
      error: null,
    });
  });

  it('correctly parses OAuth redirect url query codes, hash tokens and errors', () => {
    const codeResult = parseOAuthRedirectUrl(
      'stylingtooth://auth/callback?code=mock-auth-code-123'
    );
    expect(codeResult.code).toBe('mock-auth-code-123');
    expect(codeResult.error).toBeNull();

    const hashResult = parseOAuthRedirectUrl(
      'stylingtooth://auth/callback#access_token=mock-acc&refresh_token=mock-ref'
    );
    expect(hashResult.accessToken).toBe('mock-acc');
    expect(hashResult.refreshToken).toBe('mock-ref');
    expect(hashResult.error).toBeNull();

    const errorResult = parseOAuthRedirectUrl(
      'stylingtooth://auth/callback?error=access_denied&error_description=User+cancelled'
    );
    expect(errorResult.error).toBe('User cancelled');

    const malformedResult = parseOAuthRedirectUrl('not-a-valid-url');
    expect(malformedResult.code).toBeNull();
    expect(malformedResult.error).toBeNull();
  });
});
