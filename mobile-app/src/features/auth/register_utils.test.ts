import { describe, it, expect } from 'vitest';
import {
  validateRegisterForm,
  RegisterFormData,
  normalizePhoneNumber,
  phoneToAuthEmail,
} from './register_utils';

describe('validateRegisterForm', () => {
  const validForm: RegisterFormData = {
    firstName: 'Олена',
    lastName: 'Коваль',
    identifier: 'olena@example.com',
    password: 'password123',
    city: 'м. Київ',
  };

  it('validates a correct form with email', () => {
    const result = validateRegisterForm(validForm);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('validates a correct form with phone number', () => {
    const result = validateRegisterForm({
      ...validForm,
      identifier: '+380501234567',
    });
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('requires first name', () => {
    const result = validateRegisterForm({ ...validForm, firstName: '  ' });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Введіть ім’я');
  });

  it('requires last name', () => {
    const result = validateRegisterForm({ ...validForm, lastName: '' });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Введіть прізвище');
  });

  it('requires identifier', () => {
    const result = validateRegisterForm({ ...validForm, identifier: '' });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Введіть Email або номер телефону');
  });

  it('requires password', () => {
    const result = validateRegisterForm({ ...validForm, password: '' });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Введіть пароль');
  });

  it('requires password with at least 6 characters', () => {
    const result = validateRegisterForm({ ...validForm, password: '123' });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Пароль повинен містити не менше 6 символів');
  });

  it('rejects invalid email/phone identifier format', () => {
    const result = validateRegisterForm({
      ...validForm,
      identifier: 'not-valid-id',
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Введіть коректний Email або номер телефону');
  });

  it('requires city', () => {
    const result = validateRegisterForm({ ...validForm, city: '' });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Вкажіть місто');
  });

  it('correctly maps phone to auth email', () => {
    const normalized = normalizePhoneNumber('0501234567');
    expect(normalized).toBe('+380501234567');
    expect(phoneToAuthEmail(normalized!)).toBe('380501234567@phone.stylingtooth.app');
  });
});
