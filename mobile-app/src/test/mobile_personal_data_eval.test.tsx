import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PersonalDataScreen } from '../features/profile/PersonalDataScreen';
import { MainScreen } from '../features/dashboard/MainScreen';
import {
  isFigmaDummyPlaceholder,
  sanitizePersonalData,
  formatUkrainianDate,
  formatGender,
} from '../features/profile/personal_data_utils';
import { supabase } from '../lib/supabase';

describe('Personal Data Mobile Eval Suite (Figma Frame 680:3482 & Web Parity)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Eval 1: Figma Frame 680:3482 Design Contract Verification', () => {
    it('evaluates structural elements: header, avatar section, 5 form rows, security note, and save button', () => {
      render(<PersonalDataScreen />);

      expect(screen.getByTestId('personal-data-screen')).toBeInTheDocument();
      expect(screen.getByTestId('personal-data-back-button')).toBeInTheDocument();
      expect(screen.getByTestId('personal-data-title')).toHaveTextContent('Особисті дані');
      expect(screen.getByTestId('personal-data-bell-button')).toBeInTheDocument();

      expect(screen.getByTestId('avatar-container')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-edit-button')).toBeInTheDocument();

      expect(screen.getByTestId('personal-data-card')).toBeInTheDocument();
      expect(screen.getByTestId('fullname-row')).toBeInTheDocument();
      expect(screen.getByTestId('gender-row')).toBeInTheDocument();
      expect(screen.getByTestId('phone-row')).toBeInTheDocument();
      expect(screen.getByTestId('email-row')).toBeInTheDocument();
      expect(screen.getByTestId('birthdate-row')).toBeInTheDocument();

      expect(screen.getByTestId('security-guarantee-note')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Ваші контактні дані використовуються для підтвердження бронювань та сповіщень про візити. Ми гарантуємо їх безпеку.'
        )
      ).toBeInTheDocument();

      const saveButton = screen.getByTestId('save-personal-data-button');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toHaveTextContent('Зберегти зміни');
    });

    it('evaluates field labels match Ukrainian Figma layout specifications', () => {
      render(<PersonalDataScreen />);

      expect(screen.getByText("Ім'я та Прізвище")).toBeInTheDocument();
      expect(screen.getByText('Стать')).toBeInTheDocument();
      expect(screen.getByText('Номер телефону')).toBeInTheDocument();
      expect(screen.getByText('Електронна пошта')).toBeInTheDocument();
      expect(screen.getByText('Дата народження')).toBeInTheDocument();
    });
  });

  describe('Eval 2: Figma Static Dummy Placeholder Avoidance Matrix', () => {
    const figmaMockupValues = [
      'Катерина Ковальчук',
      'kateryna.pet@gmail.com',
      '+380 (97) 123 45 67',
      '+380971234567',
      '14 Травня 1995',
      '1995-05-14',
    ];

    it('detects and flags all Figma mockup values as placeholders', () => {
      figmaMockupValues.forEach((val) => {
        expect(isFigmaDummyPlaceholder(val)).toBe(true);
      });
    });

    it('evaluates that no Figma dummy data leaks into the rendered personal data screen', () => {
      render(
        <PersonalDataScreen
          initialData={{
            fullName: 'Катерина Ковальчук',
            email: 'kateryna.pet@gmail.com',
            phone: '+380 (97) 123 45 67',
            birthDate: '14 Травня 1995',
          }}
        />
      );

      figmaMockupValues.forEach((dummy) => {
        expect(screen.queryByText(dummy)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('fullname-display-value')).toHaveTextContent("Вкажіть ваше ім'я");
      expect(screen.getByTestId('phone-display-value')).toHaveTextContent('Не вказано');
      expect(screen.getByTestId('email-display-value')).toHaveTextContent('Не вказано');
      expect(screen.getByTestId('birthdate-display-value')).toHaveTextContent('Не вказано');
    });

    it('evaluates sanitation resilience across empty, whitespace, and null states', () => {
      const sanitized = sanitizePersonalData({
        fullName: '   ',
        email: '',
        phone: null as any,
        birthDate: undefined,
        gender: '' as any,
      });

      expect(sanitized.fullName).toBe('');
      expect(sanitized.email).toBe('');
      expect(sanitized.phone).toBe('');
      expect(sanitized.birthDate).toBe('');
      expect(sanitized.gender).toBe('');
    });
  });

  describe('Eval 3: Ukrainian Date and Gender Formatting Quality', () => {
    it('evaluates proper Ukrainian month declinations for birth dates', () => {
      expect(formatUkrainianDate('1990-01-15')).toBe('15 Січня 1990');
      expect(formatUkrainianDate('1992-02-28')).toBe('28 Лютого 1992');
      expect(formatUkrainianDate('1985-03-08')).toBe('8 Березня 1985');
      expect(formatUkrainianDate('1999-04-12')).toBe('12 Квітня 1999');
      expect(formatUkrainianDate('1995-05-14')).toBe('14 Травня 1995');
      expect(formatUkrainianDate('2000-06-01')).toBe('1 Червня 2000');
      expect(formatUkrainianDate('1994-07-24')).toBe('24 Липня 1994');
      expect(formatUkrainianDate('1991-08-24')).toBe('24 Серпня 1991');
      expect(formatUkrainianDate('1997-09-01')).toBe('1 Вересня 1997');
      expect(formatUkrainianDate('1989-10-14')).toBe('14 Жовтня 1989');
      expect(formatUkrainianDate('1993-11-21')).toBe('21 Листопада 1993');
      expect(formatUkrainianDate('1996-12-31')).toBe('31 Грудня 1996');
    });

    it('evaluates Ukrainian gender labels', () => {
      expect(formatGender('female')).toBe('Жіноча');
      expect(formatGender('male')).toBe('Чоловіча');
      expect(formatGender('other')).toBe('Інше');
      expect(formatGender('')).toBe('Не вказано');
    });
  });

  describe('Eval 4: Web-app Parity and Supabase Persistence Contract', () => {
    it('evaluates database and auth update calls on save', async () => {
      const mockUserId = 'user-eval-42';
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: {
          session: {
            user: { id: mockUserId, email: 'eva@example.com' },
          },
        },
        error: null,
      });

      render(
        <PersonalDataScreen
          initialData={{
            fullName: 'Єва Шевченко',
            email: 'eva@example.com',
            phone: '+380501112233',
            gender: 'female',
            birthDate: '1995-05-14',
          }}
        />
      );

      fireEvent.click(screen.getByTestId('save-personal-data-button'));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({
          data: expect.objectContaining({
            full_name: 'Єва Шевченко',
            gender: 'female',
          }),
        });
      });
    });

    it('evaluates verified badge rendering when isPhoneVerified is true', () => {
      const { rerender } = render(
        <PersonalDataScreen
          initialData={{
            phone: '+380509998877',
            isPhoneVerified: false,
          }}
        />
      );

      expect(screen.queryByTestId('phone-verified-badge')).not.toBeInTheDocument();

      rerender(
        <PersonalDataScreen
          initialData={{
            phone: '+380509998877',
            isPhoneVerified: true,
          }}
        />
      );

      expect(screen.getByTestId('phone-verified-badge')).toBeInTheDocument();
      expect(screen.getByText('Підтверджено')).toBeInTheDocument();
    });

    it('evaluates verification request buttons and email verified badge contract', () => {
      const { rerender } = render(
        <PersonalDataScreen
          initialData={{
            phone: '+380509998877',
            isPhoneVerified: false,
            email: 'user@example.com',
            isEmailVerified: false,
          }}
        />
      );

      expect(screen.getByTestId('verify-phone-telegram-button')).toBeInTheDocument();
      expect(screen.getByTestId('verify-email-button')).toBeInTheDocument();
      expect(screen.queryByTestId('email-verified-badge')).not.toBeInTheDocument();

      rerender(
        <PersonalDataScreen
          initialData={{
            phone: '+380509998877',
            isPhoneVerified: true,
            email: 'user@example.com',
            isEmailVerified: true,
          }}
        />
      );

      expect(screen.queryByTestId('verify-phone-telegram-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('verify-email-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('phone-verified-badge')).toBeInTheDocument();
      expect(screen.getByTestId('email-verified-badge')).toBeInTheDocument();
    });
  });

  describe('Eval 5: End-to-End Navigation Flow Integration', () => {
    it('evaluates navigating from ProfileScreen into PersonalDataScreen and returning via back button', async () => {
      render(<MainScreen initialTab="profile" />);

      await waitFor(() => {
        expect(screen.getByTestId('profile-tab-content')).toBeInTheDocument();
      });

      const personalSettingRow = screen.getByTestId('setting-item-personal_info');
      expect(personalSettingRow).toBeInTheDocument();

      fireEvent.click(personalSettingRow);

      await waitFor(() => {
        expect(screen.getByTestId('personal-data-screen')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('personal-data-back-button'));

      await waitFor(() => {
        expect(screen.getByTestId('profile-tab-content')).toBeInTheDocument();
      });
    });

    it('evaluates rendering directly to personal_data subscreen via initialProfileSubScreen', async () => {
      render(
        <MainScreen
          initialTab="profile"
          initialProfileSubScreen="personal_data"
        />
      );

      expect(screen.getByTestId('personal-data-screen')).toBeInTheDocument();
      expect(screen.getByTestId('personal-data-title')).toHaveTextContent('Особисті дані');
    });
  });
});
