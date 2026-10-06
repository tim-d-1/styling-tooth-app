import { describe, it, expect } from 'vitest';
import {
  validatePetRegisterForm,
  parsePetBirthDateInput,
  PetRegisterFormData,
} from './pet_register_utils';

describe('pet_register_utils', () => {
  const refDate = new Date(2026, 9, 1);

  describe('parsePetBirthDateInput', () => {
    it('parses valid ISO format date', () => {
      const res = parsePetBirthDateInput('2023-03-16', refDate);
      expect(res.error).toBeNull();
      expect(res.dateString).toBe('2023-03-16');
    });

    it('parses valid European format date', () => {
      const res = parsePetBirthDateInput('16.03.2023', refDate);
      expect(res.error).toBeNull();
      expect(res.dateString).toBe('2023-03-16');
    });

    it('returns error for future date', () => {
      const res = parsePetBirthDateInput('2030-01-01', refDate);
      expect(res.dateString).toBeNull();
      expect(res.error).toBe('Дата народження не може бути в майбутньому');
    });

    it('parses plain integer age in years (e.g. "2")', () => {
      const res = parsePetBirthDateInput('2', refDate);
      expect(res.error).toBeNull();
      expect(res.dateString).toBe('2024-10-01');
    });

    it('parses Ukrainian age text (e.g. "2 роки", "1 рік", "6 місяців")', () => {
      expect(parsePetBirthDateInput('2 роки', refDate)).toEqual({
        dateString: '2024-10-01',
        error: null,
      });
      expect(parsePetBirthDateInput('1 рік', refDate)).toEqual({
        dateString: '2025-10-01',
        error: null,
      });
      expect(parsePetBirthDateInput('6 місяців', refDate)).toEqual({
        dateString: '2026-04-01',
        error: null,
      });
    });

    it('returns null dateString when input is empty or null', () => {
      const res = parsePetBirthDateInput('', refDate);
      expect(res.error).toBeNull();
      expect(res.dateString).toBeNull();
    });
  });

  describe('validatePetRegisterForm', () => {
    const validData: PetRegisterFormData = {
      name: 'Барон',
      species: 'dog',
      birthDate: '16.03.2023',
    };

    it('validates a correct pet profile form', () => {
      const res = validatePetRegisterForm(validData, refDate);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeNull();
    });

    it('approves valid age input "2" and "2 роки"', () => {
      expect(validatePetRegisterForm({ ...validData, birthDate: '2' }, refDate).isValid).toBe(true);
      expect(validatePetRegisterForm({ ...validData, birthDate: '2 роки' }, refDate).isValid).toBe(true);
    });

    it('requires pet name', () => {
      const res = validatePetRegisterForm({ ...validData, name: '  ' }, refDate);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Введіть кличку тваринки');
    });

    it('fails on invalid birth date', () => {
      const res = validatePetRegisterForm(
        { ...validData, birthDate: 'invalid-date' },
        refDate
      );
      expect(res.isValid).toBe(false);
      expect(res.error).toBeTruthy();
    });
  });
});
