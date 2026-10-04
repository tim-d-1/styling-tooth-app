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

  it('navigates from login back to landing when back arrow is pressed', () => {
    render(<App initialScreen="login" />);

    expect(screen.getByTestId('login-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('back-button'));

    expect(screen.getByTestId('landing-screen')).toBeInTheDocument();
  });

  it('transitions to authenticated state on successful login', async () => {
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
      expect(screen.getByTestId('authenticated-screen')).toBeInTheDocument();
      expect(screen.getByText('Вхід успішний!')).toBeInTheDocument();
    });
  });

  it('logs out and transitions back to landing screen', async () => {
    render(<App initialScreen="authenticated" />);

    expect(screen.getByTestId('authenticated-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('logout-button'));

    await waitFor(() => {
      expect(screen.getByTestId('landing-screen')).toBeInTheDocument();
    });
  });
});
