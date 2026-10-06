import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PersonalDataScreen } from './PersonalDataScreen';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';

describe('PersonalDataScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, title, and back button', () => {
    const handleBack = vi.fn();
    render(<PersonalDataScreen onBack={handleBack} />);

    expect(screen.getByTestId('personal-data-screen')).toBeInTheDocument();
    expect(screen.getByTestId('personal-data-title')).toHaveTextContent('Особисті дані');
    expect(screen.getByTestId('personal-data-back-button')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('personal-data-back-button'));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('handles notification bell press', () => {
    const handleNotification = vi.fn();
    render(<PersonalDataScreen onNotificationPress={handleNotification} />);

    fireEvent.click(screen.getByTestId('personal-data-bell-button'));
    expect(handleNotification).toHaveBeenCalledTimes(1);
  });

  it('renders avatar placeholder and launches image picker on edit button tap', async () => {
    const toastSpy = vi.fn();
    render(<PersonalDataScreen onToast={toastSpy} />);

    expect(screen.getByTestId('avatar-placeholder')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('avatar-edit-button'));

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
      expect(toastSpy).toHaveBeenCalledWith('Аватар оновлено');
    });
  });

  it('renders avatar image when avatarUrl is present', () => {
    render(
      <PersonalDataScreen
        initialData={{ avatarUrl: 'https://example.com/custom-avatar.jpg' }}
      />
    );

    expect(screen.getByTestId('avatar-image')).toBeInTheDocument();
  });

  it('avoids Figma dummy placeholders when empty data is supplied', () => {
    render(
      <PersonalDataScreen
        initialData={{
          fullName: 'Катерина Ковальчук',
          phone: '+380 (97) 123 45 67',
          email: 'kateryna.pet@gmail.com',
          birthDate: '14 Травня 1995',
        }}
      />
    );

    expect(screen.getByTestId('fullname-display-value')).toHaveTextContent("Вкажіть ваше ім'я");
    expect(screen.getByTestId('phone-display-value')).toHaveTextContent('Не вказано');
    expect(screen.getByTestId('email-display-value')).toHaveTextContent('Не вказано');
    expect(screen.getByTestId('birthdate-display-value')).toHaveTextContent('Не вказано');
  });

  it('renders dynamic profile data properly', () => {
    render(
      <PersonalDataScreen
        initialData={{
          fullName: 'Марія Коваль',
          phone: '+380501234567',
          isPhoneVerified: true,
          email: 'maria@example.com',
          birthDate: '1998-04-20',
        }}
      />
    );

    expect(screen.getByTestId('fullname-display-value')).toHaveTextContent('Марія Коваль');
    expect(screen.getByTestId('phone-display-value')).toHaveTextContent('+380 (50) 123 45 67');
    expect(screen.getByTestId('phone-verified-badge')).toBeInTheDocument();
    expect(screen.getByTestId('email-display-value')).toHaveTextContent('maria@example.com');
    expect(screen.getByTestId('birthdate-display-value')).toHaveTextContent('20 Квітня 1998');
  });

  it('allows inline editing of full name and saving', async () => {
    const handleSave = vi.fn();
    const handleToast = vi.fn();

    render(
      <PersonalDataScreen
        initialData={{
          fullName: 'Старе Імʼя',
        }}
        onSave={handleSave}
        onToast={handleToast}
      />
    );

    fireEvent.click(screen.getByTestId('edit-fullname-button'));

    const input = screen.getByTestId('fullname-input');
    fireEvent.change(input, { target: { value: 'Нове Імʼя' } });

    fireEvent.click(screen.getByTestId('save-personal-data-button'));

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Нове Імʼя',
        })
      );
      expect(handleToast).toHaveBeenCalledWith('Зміни успішно збережено');
    });
  });

  it('does not render gender field on mobile', () => {
    render(<PersonalDataScreen />);
    expect(screen.queryByTestId('gender-row')).not.toBeInTheDocument();
  });

  it('renders security guarantee information banner', () => {
    render(<PersonalDataScreen />);

    expect(screen.getByTestId('security-guarantee-note')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ваші контактні дані використовуються для підтвердження бронювань та сповіщень про візити. Ми гарантуємо їх безпеку.'
      )
    ).toBeInTheDocument();
  });

  it('renders verify buttons when phone or email is unconfirmed, and triggers verification flows', async () => {
    const handleToast = vi.fn();
    const openURLSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: 'usr-10' } } },
      error: null,
    } as never);
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { code: '654321' },
      error: null,
    } as never);
    const resendSpy = vi.spyOn(supabase.auth, 'resend').mockResolvedValue({
      data: {},
      error: null,
    } as never);

    render(
      <PersonalDataScreen
        initialData={{
          phone: '+380501234567',
          isPhoneVerified: false,
          email: 'unconfirmed@example.com',
          isEmailVerified: false,
        }}
        onToast={handleToast}
      />
    );

    const tgBtn = screen.getByTestId('verify-phone-telegram-button');
    expect(tgBtn).toBeInTheDocument();
    fireEvent.click(tgBtn);

    await waitFor(() => {
      expect(rpcSpy).toHaveBeenCalledWith('generate_verification_code', {
        p_channel: 'telegram',
        p_target: 'usr-10',
      });
      expect(openURLSpy).toHaveBeenCalledWith(
        expect.stringMatching(/https:\/\/t\.me\/(styling_tooth_bot|StylingToothBot)\?start=654321/)
      );
      expect(handleToast).toHaveBeenCalledWith('Відкриваємо Telegram бота для підтвердження');
    });

    const emailBtn = screen.getByTestId('verify-email-button');
    expect(emailBtn).toBeInTheDocument();
    fireEvent.click(emailBtn);

    await waitFor(() => {
      expect(resendSpy).toHaveBeenCalledWith({
        type: 'signup',
        email: 'unconfirmed@example.com',
      });
      expect(handleToast).toHaveBeenCalledWith('Лист із підтвердженням надіслано на вашу пошту');
    });
  });

  it('renders email verified badge when email is verified', () => {
    render(
      <PersonalDataScreen
        initialData={{
          email: 'confirmed@example.com',
          isEmailVerified: true,
        }}
      />
    );

    expect(screen.getByTestId('email-verified-badge')).toBeInTheDocument();
  });

  it('syncs email confirmation from getUser when auth user has email_confirmed_at', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'usr-confirmed-id',
            email: 'live-confirmed@example.com',
          },
        },
      },
      error: null,
    } as never);

    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: {
        user: {
          id: 'usr-confirmed-id',
          email: 'live-confirmed@example.com',
          email_confirmed_at: '2026-10-05T12:00:00Z',
        },
      },
      error: null,
    } as never);

    render(<PersonalDataScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('email-verified-badge')).toBeInTheDocument();
    });
  });
});
