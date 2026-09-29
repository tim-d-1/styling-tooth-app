import { describe, it, expect } from 'vitest';
import { validateRegisterForm, fileToDataUrl } from './register_utils';

describe('register_utils', () => {
  describe('validateRegisterForm', () => {
    const validData = {
      firstName: 'John',
      lastName: 'Carter',
      username: 'john123',
      identifier: 'john@example.com',
      password: 'password123',
      city: 'м. Київ',
    };

    it('returns isValid true for valid form data', () => {
      const result = validateRegisterForm(validData);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('fails when firstName is empty', () => {
      const result = validateRegisterForm({ ...validData, firstName: '   ' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть ім’я');
    });

    it('fails when lastName is empty', () => {
      const result = validateRegisterForm({ ...validData, lastName: '' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть прізвище');
    });

    it('fails when username is too short', () => {
      const result = validateRegisterForm({ ...validData, username: 'ab' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Ім’я користувача повинно містити не менше 3 символів');
    });

    it('fails when password is too short', () => {
      const result = validateRegisterForm({ ...validData, password: '123' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Пароль повинен містити не менше 6 символів');
    });

    it('fails when identifier is invalid', () => {
      const result = validateRegisterForm({ ...validData, identifier: 'not-an-email' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть коректний Email або номер телефону');
    });

    it('fails when city is empty', () => {
      const result = validateRegisterForm({ ...validData, city: '' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Вкажіть місто');
    });
  });

  describe('fileToDataUrl', () => {
    it('converts a File to a data URL string', async () => {
      const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
      const dataUrl = await fileToDataUrl(file);
      expect(dataUrl).toContain('data:text/plain;base64,');
    });
  });
});
