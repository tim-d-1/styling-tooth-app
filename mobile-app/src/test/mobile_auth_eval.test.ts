import { describe, it, expect } from 'vitest';
import {
  isEmailIdentifier,
  isPhoneIdentifier,
  normalizePhoneNumber,
  phoneToAuthEmail,
  validateLoginForm,
  parseOAuthRedirectUrl,
} from '../features/auth/login_utils';
import { validateRegisterForm } from '../features/auth/register_utils';
import {
  validatePetRegisterForm,
  parsePetBirthDateInput,
} from '../features/pets/pet_register_utils';
import { colors, radii } from '../theme/tokens';

describe('Mobile Auth & Onboarding Eval Suite: Generalization, Edge Cases, and Contracts', () => {
  describe('Eval: Phone normalization across diverse input variants', () => {
    const cases = [
      { input: '0501234567', expected: '+380501234567' },
      { input: ' 067 111 22 33 ', expected: '+380671112233' },
      { input: '093-456-78-90', expected: '+380934567890' },
      { input: '(044) 123 45 67', expected: '+380441234567' },
      { input: '380501234567', expected: '+380501234567' },
      { input: '+380501234567', expected: '+380501234567' },
      { input: '+14155552671', expected: '+14155552671' },
      { input: '+48123456789', expected: '+48123456789' },
      { input: '123', expected: null },
      { input: 'abcdef', expected: null },
    ];

    cases.forEach(({ input, expected }) => {
      it(`evaluates normalization of "${input}" -> ${expected}`, () => {
        expect(normalizePhoneNumber(input)).toBe(expected);
      });
    });
  });

  describe('Eval: Synthetic Auth Email generation', () => {
    it('generates consistent domain format for all normalized phones', () => {
      const phone = '+380991234567';
      const email = phoneToAuthEmail(phone);
      expect(email).toBe('380991234567@phone.stylingtooth.app');
      expect(isEmailIdentifier(email)).toBe(true);
    });
  });

  describe('Eval: Login Form Validation Matrix', () => {
    const testMatrix = [
      { id: '', pwd: '', expectedError: 'Введіть Email або номер телефону' },
      { id: '   ', pwd: 'pass123', expectedError: 'Введіть Email або номер телефону' },
      { id: 'valid@email.com', pwd: '', expectedError: 'Введіть пароль' },
      { id: 'valid@email.com', pwd: '12345', expectedError: 'Пароль повинен містити не менше 6 символів' },
      { id: 'plainusername', pwd: '123456', expectedError: 'Введіть коректний Email або номер телефону' },
      { id: 'valid@email.com', pwd: '123456', expectedError: null },
      { id: '+380501234567', pwd: 'strongpassword', expectedError: null },
      { id: '0501234567', pwd: 'strongpassword', expectedError: null },
    ];

    testMatrix.forEach(({ id, pwd, expectedError }, idx) => {
      it(`evaluates validation matrix row ${idx + 1} (${id})`, () => {
        const result = validateLoginForm(id, pwd);
        if (expectedError) {
          expect(result.isValid).toBe(false);
          expect(result.error).toBe(expectedError);
        } else {
          expect(result.isValid).toBe(true);
          expect(result.error).toBeNull();
        }
      });
    });
  });

  describe('Eval: Registration Form Validation Matrix (No Username)', () => {
    const baseForm = {
      firstName: 'Ольга',
      lastName: 'Ткач',
      identifier: 'olga@example.com',
      password: 'password123',
      city: 'м. Київ',
    };

    const registerMatrix = [
      { patch: { firstName: '' }, expectedError: 'Введіть ім’я' },
      { patch: { lastName: '' }, expectedError: 'Введіть прізвище' },
      { patch: { identifier: '' }, expectedError: 'Введіть Email або номер телефону' },
      { patch: { password: '123' }, expectedError: 'Пароль повинен містити не менше 6 символів' },
      { patch: { city: '' }, expectedError: 'Вкажіть місто' },
      { patch: {}, expectedError: null },
    ];

    registerMatrix.forEach(({ patch, expectedError }, idx) => {
      it(`evaluates register matrix row ${idx + 1}`, () => {
        const result = validateRegisterForm({ ...baseForm, ...patch });
        if (expectedError) {
          expect(result.isValid).toBe(false);
          expect(result.error).toBe(expectedError);
        } else {
          expect(result.isValid).toBe(true);
          expect(result.error).toBeNull();
        }
      });
    });
  });

  describe('Eval: Pet Onboarding Date Parsing and Validation Matrix (No Чутливість)', () => {
    const refDate = new Date(2026, 9, 1);

    const dateMatrix = [
      { input: '2022-05-15', expectedDate: '2022-05-15', expectedError: null },
      { input: '16.03.2023', expectedDate: '2023-03-16', expectedError: null },
      { input: '2030-01-01', expectedDate: null, expectedError: 'Дата народження не може бути в майбутньому' },
      { input: 'invalid', expectedDate: null, expectedError: 'Вкажіть коректну дату народження або вік (наприклад, 16.03.2023)' },
      { input: '', expectedDate: null, expectedError: null },
    ];

    dateMatrix.forEach(({ input, expectedDate, expectedError }, idx) => {
      it(`evaluates pet birth date matrix row ${idx + 1} (${input})`, () => {
        const res = parsePetBirthDateInput(input, refDate);
        expect(res.dateString).toBe(expectedDate);
        if (expectedError) {
          expect(res.error).toBe(expectedError);
        } else {
          expect(res.error).toBeNull();
        }
      });
    });

    it('evaluates pet profile validation requiring name and species, omitting sensitivity', () => {
      const validPet = {
        name: 'Барон',
        species: 'dog' as const,
        birthDate: '16.03.2023',
        medicalNotes: 'Алергія на курку',
        behaviorNotes: 'Дружелюбний',
      };
      const validRes = validatePetRegisterForm(validPet, refDate);
      expect(validRes.isValid).toBe(true);
      expect(validRes.error).toBeNull();

      const missingNameRes = validatePetRegisterForm({ ...validPet, name: '' }, refDate);
      expect(missingNameRes.isValid).toBe(false);
      expect(missingNameRes.error).toBe('Введіть кличку тваринки');
    });
  });

  describe('Eval: Theme Tokens Contract', () => {
    it('preserves web-app brand colors and values', () => {
      expect(colors.terracotta.toLowerCase()).toBe('#ec643a');
      expect(colors.surfaceCream.toLowerCase()).toBe('#fffbf6');
      expect(colors.contentDark.toLowerCase()).toBe('#242f35');
      expect(radii.md).toBe(12);
    });
  });

  describe('Eval: OAuth Redirect Parameter Extraction Matrix', () => {
    const oauthCases = [
      {
        url: 'stylingtooth://auth/callback?code=pkce-auth-code-12345',
        expectedCode: 'pkce-auth-code-12345',
        expectedError: null,
      },
      {
        url: 'exp://192.168.1.5:8081/--/auth/callback?code=expo-go-code-67890',
        expectedCode: 'expo-go-code-67890',
        expectedError: null,
      },
      {
        url: 'stylingtooth://auth/callback#access_token=jwt-access&refresh_token=jwt-refresh',
        expectedAccessToken: 'jwt-access',
        expectedRefreshToken: 'jwt-refresh',
        expectedError: null,
      },
      {
        url: 'stylingtooth://auth/callback?error=access_denied&error_description=User+denied+access',
        expectedCode: null,
        expectedError: 'User denied access',
      },
      {
        url: 'stylingtooth://auth/callback',
        expectedCode: null,
        expectedError: null,
      },
    ];

    oauthCases.forEach(({ url, expectedCode, expectedAccessToken, expectedRefreshToken, expectedError }, idx) => {
      it(`evaluates OAuth redirect parse case ${idx + 1}`, () => {
        const parsed = parseOAuthRedirectUrl(url);
        if (expectedCode !== undefined) {
          expect(parsed.code).toBe(expectedCode);
        }
        if (expectedAccessToken !== undefined) {
          expect(parsed.accessToken).toBe(expectedAccessToken);
        }
        if (expectedRefreshToken !== undefined) {
          expect(parsed.refreshToken).toBe(expectedRefreshToken);
        }
        expect(parsed.error).toBe(expectedError);
      });
    });
  });
});
