import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LoginScreen } from './LoginScreen';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders top bar, title, input fields and buttons matching frame 197:1235', () => {
    render(<LoginScreen />);

    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByText('Стильний зубець')).toBeInTheDocument();
    expect(screen.getByText('Вхід')).toBeInTheDocument();

    expect(screen.queryByTestId('username-input')).toBeNull();
    expect(screen.getByTestId('identifier-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();

    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    expect(screen.queryByTestId('apple-login-button')).toBeNull();
    expect(screen.getByTestId('submit-login-button')).toBeInTheDocument();

    expect(screen.getByTestId('identifier-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('password-input')).not.toHaveAttribute('placeholder');
  });

  it('navigates back when back button is pressed', () => {
    const onBack = vi.fn();
    render(<LoginScreen onBack={onBack} />);

    fireEvent.click(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('displays validation error if email and password are empty', async () => {
    render(<LoginScreen />);

    fireEvent.click(screen.getByTestId('submit-login-button'));

    expect(
      await screen.findByText('Введіть Email або номер телефону')
    ).toBeInTheDocument();
  });

  it('calls Supabase authentication and triggers onSuccess on valid credentials', async () => {
    const onSuccess = vi.fn();
    (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
      data: { user: { id: 'usr-1', email: 'bulakhmaria@gmail.com' } },
      error: null,
    });

    render(<LoginScreen onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('identifier-input'), {
      target: { value: 'bulakhmaria@gmail.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'secret123' },
    });

    fireEvent.click(screen.getByTestId('submit-login-button'));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'bulakhmaria@gmail.com',
        password: 'secret123',
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('displays error message when Supabase returns invalid credentials', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid login credentials'),
    });

    render(<LoginScreen />);

    fireEvent.change(screen.getByTestId('identifier-input'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByTestId('submit-login-button'));

    expect(
      await screen.findByText('Невірний логін або пароль')
    ).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon is clicked', () => {
    render(<LoginScreen />);

    const passwordInput = screen.getByTestId('password-input');
    const toggleButton = screen.getByTestId('toggle-password-visibility');

    // Initially password is secure
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).not.toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('renders register button and calls onNavigateRegister when clicked', () => {
    const onNavigateRegister = vi.fn();
    render(<LoginScreen onNavigateRegister={onNavigateRegister} />);

    const registerButton = screen.getByTestId('navigate-register-button');
    expect(registerButton).toBeInTheDocument();
    expect(screen.getByText('Ще не маєте акаунту?')).toBeInTheDocument();
    expect(screen.getByText('Зареєструватися →')).toBeInTheDocument();

    fireEvent.click(registerButton);
    expect(onNavigateRegister).toHaveBeenCalledTimes(1);
  });

  it('triggers Google OAuth flow via WebBrowser and completes on valid auth', async () => {
    const onSuccess = vi.fn();
    (WebBrowser.openAuthSessionAsync as any).mockResolvedValueOnce({
      type: 'success',
      url: 'stylingtooth://auth/callback?code=mock-oauth-code',
    });
    (supabase.auth.signInWithOAuth as any).mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
      error: null,
    });
    (supabase.auth.exchangeCodeForSession as any).mockResolvedValueOnce({
      data: {
        session: { user: { id: 'usr-google', email: 'test@gmail.com' } },
      },
      error: null,
    });

    render(<LoginScreen onSuccess={onSuccess} />);

    fireEvent.click(screen.getByTestId('google-login-button'));

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'stylingtooth://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
        'https://accounts.google.com/o/oauth2/v2/auth',
        'stylingtooth://auth/callback'
      );
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
        'mock-oauth-code'
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('displays error when Google OAuth fails', async () => {
    (supabase.auth.signInWithOAuth as any).mockResolvedValueOnce({
      data: null,
      error: new Error('OAuth provider not configured'),
    });

    render(<LoginScreen />);

    fireEvent.click(screen.getByTestId('google-login-button'));

    expect(
      await screen.findByText('OAuth provider not configured')
    ).toBeInTheDocument();
  });
});
