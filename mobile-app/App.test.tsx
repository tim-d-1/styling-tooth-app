import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';
import { supabase } from './src/lib/supabase';

describe('App navigation and routing flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading screen initially', () => {
    render(<App initialScreen="loading" />);
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('navigates from landing to login when "Увійти" is clicked', () => {
    render(<App initialScreen="landing" />);

    expect(screen.getByTestId('landing-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Увійти' }));

    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
  });

  it('navigates from landing to register when "Реєстрація" is clicked', () => {
    render(<App initialScreen="landing" />);

    fireEvent.click(screen.getByRole('button', { name: 'Реєстрація' }));

    expect(screen.getByTestId('register-screen')).toBeInTheDocument();
  });

  it('navigates from login back to landing when back arrow is pressed', () => {
    render(<App initialScreen="login" />);

    expect(screen.getByTestId('login-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('back-button'));

    expect(screen.getByTestId('landing-screen')).toBeInTheDocument();
  });

  it('navigates between login and register screens via navigation link buttons', () => {
    render(<App initialScreen="login" />);

    fireEvent.click(screen.getByTestId('navigate-register-button'));
    expect(screen.getByTestId('register-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('navigate-login-button'));
    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
  });

  it('transitions to pet onboarding on successful registration', async () => {
    (supabase.auth.signUp as any).mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-new-1',
          email: 'newuser@example.com',
          identities: [{ id: 'id-1' }],
        },
      },
      error: null,
    });

    render(<App initialScreen="register" />);

    fireEvent.change(screen.getByTestId('first-name-input'), {
      target: { value: 'Ольга' },
    });
    fireEvent.change(screen.getByTestId('last-name-input'), {
      target: { value: 'Ткач' },
    });
    fireEvent.change(screen.getByTestId('identifier-input'), {
      target: { value: 'olga@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'secretpass' },
    });

    fireEvent.click(screen.getByTestId('submit-register-button'));

    await waitFor(() => {
      expect(screen.getByTestId('pet-onboarding-screen')).toBeInTheDocument();
    });
  });

  it('transitions to main screen on successful login', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'maria@example.com' } },
      error: null,
    });

    render(<App initialScreen="login" />);

    fireEvent.change(screen.getByTestId('identifier-input'), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'securepwd' },
    });

    fireEvent.click(screen.getByTestId('submit-login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('main-screen')).toBeInTheDocument();
    });
  });

  it('navigates from pet onboarding to main screen when skipped', () => {
    render(<App initialScreen="pet_onboarding" />);

    fireEvent.click(screen.getByTestId('skip-pet-button'));

    expect(screen.getByTestId('main-screen')).toBeInTheDocument();
  });

  it('logs out from profile tab and transitions back to landing screen', async () => {
    render(<App initialScreen="authenticated" />);

    expect(screen.getByTestId('main-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tab-profile'));
    fireEvent.click(screen.getByTestId('logout-button'));

    await waitFor(() => {
      expect(screen.getByTestId('landing-screen')).toBeInTheDocument();
    });
  });
});
