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
