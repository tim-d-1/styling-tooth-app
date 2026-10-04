import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RegisterScreen } from './RegisterScreen';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

describe('RegisterScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders top bar, title, input fields and buttons matching frame 197:1111 without username and without placeholders', () => {
    render(<RegisterScreen />);

    expect(screen.getByTestId('register-screen')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByText('Стильний зубець')).toBeInTheDocument();
    expect(screen.getByText('Реєстрація')).toBeInTheDocument();

    expect(screen.queryByTestId('username-input')).toBeNull();
    expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('identifier-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('city-input')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-picker-button')).toBeInTheDocument();

    expect(screen.getByTestId('google-register-button')).toBeInTheDocument();
    expect(screen.queryByTestId('apple-register-button')).toBeNull();
    expect(screen.getByTestId('submit-register-button')).toBeInTheDocument();

    expect(screen.getByTestId('first-name-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('last-name-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('identifier-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('password-input')).not.toHaveAttribute('placeholder');
  });

  it('navigates back when back button is pressed', () => {
    const onBack = vi.fn();
    render(<RegisterScreen onBack={onBack} />);

    fireEvent.click(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('displays validation error if required fields are empty', async () => {
    render(<RegisterScreen />);

    fireEvent.click(screen.getByTestId('submit-register-button'));

    expect(await screen.findByText('Введіть ім’я')).toBeInTheDocument();
  });

  it('displays error if password is less than 6 characters', async () => {
    render(<RegisterScreen />);

    fireEvent.change(screen.getByTestId('first-name-input'), {
      target: { value: 'Марія' },
    });
    fireEvent.change(screen.getByTestId('last-name-input'), {
      target: { value: 'Булах' },
    });
    fireEvent.change(screen.getByTestId('identifier-input'), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: '123' },
    });

    fireEvent.click(screen.getByTestId('submit-register-button'));

    expect(
      await screen.findByText('Пароль повинен містити не менше 6 символів')
    ).toBeInTheDocument();
  });

  it('calls Supabase signUp and triggers onSuccess on valid submission', async () => {
    const onSuccess = vi.fn();
    (supabase.auth.signUp as any).mockResolvedValueOnce({
      data: {
        user: {
          id: 'usr-new-1',
          email: 'maria@example.com',
          identities: [{ id: 'ident-1' }],
        },
      },
      error: null,
    });

    render(<RegisterScreen onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('first-name-input'), {
      target: { value: 'Марія' },
    });
    fireEvent.change(screen.getByTestId('last-name-input'), {
      target: { value: 'Булах' },
    });
    fireEvent.change(screen.getByTestId('identifier-input'), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'secretPass123' },
    });

    fireEvent.click(screen.getByTestId('submit-register-button'));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'maria@example.com',
        password: 'secretPass123',
        options: {
          data: {
            first_name: 'Марія',
            last_name: 'Булах',
            full_name: 'Марія Булах',
            city: 'м. Київ',
            phone: undefined,
          },
        },
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('notifies user when email is already registered', async () => {
    (supabase.auth.signUp as any).mockResolvedValueOnce({
      data: {
        user: {
          id: 'usr-existing',
          email: 'maria@example.com',
          identities: [],
        },
      },
      error: null,
    });

    render(<RegisterScreen />);

    fireEvent.change(screen.getByTestId('first-name-input'), {
      target: { value: 'Марія' },
    });
    fireEvent.change(screen.getByTestId('last-name-input'), {
      target: { value: 'Булах' },
    });
    fireEvent.change(screen.getByTestId('identifier-input'), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'secretPass123' },
    });

    fireEvent.click(screen.getByTestId('submit-register-button'));

    expect(
      await screen.findByText(
        'Користувач із цією електронною адресою вже існує. Будь ласка, увійдіть.'
      )
    ).toBeInTheDocument();
  });

  it('navigates to login when login link button is clicked', () => {
    const onNavigateLogin = vi.fn();
    render(<RegisterScreen onNavigateLogin={onNavigateLogin} />);

    fireEvent.click(screen.getByTestId('navigate-login-button'));
    expect(onNavigateLogin).toHaveBeenCalledTimes(1);
  });

  it('triggers Google OAuth registration flow', async () => {
    (supabase.auth.signInWithOAuth as any).mockResolvedValueOnce({
      data: { url: 'https://supabase.co/auth/v1/authorize?provider=google' },
      error: null,
    });

    (WebBrowser.openAuthSessionAsync as any).mockResolvedValueOnce({
      type: 'cancel',
    });

    render(<RegisterScreen />);

    fireEvent.click(screen.getByTestId('google-register-button'));

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      );
      expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalled();
    });
  });
});
