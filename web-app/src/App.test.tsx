import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App from './App';
import { supabase } from './lib/supabase';

describe('App Root and Auth Gating', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.location.hash = '';
  });

  it('renders landing page when user is not authenticated', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-1',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Хто ми' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Наші послуги' })).toBeDefined();
    expect(screen.queryByText('Запланований візит')).toBeNull();
  });

  it('renders main page with no appointment state when user is authenticated', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-2',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Запланований візит')).toBeDefined();
    expect(screen.getByText('Немає активних записів')).toBeDefined();
    expect(
      screen.getByRole('button', { name: /-20% на комплексний грумінг у будні/i })
    ).toBeDefined();
    expect(
      screen.getByRole('button', {
        name: /Як доглядати за шерстю після прогулянок\?/i,
      })
    ).toBeDefined();
    expect(screen.getByText('© 2026 Стильний зубець. Усі права захищено.')).toBeDefined();
    expect(screen.queryByRole('heading', { level: 2, name: 'Хто ми' })).toBeNull();
  });

  it('renders login page when current view is login', async () => {
    window.location.hash = '#login';
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-3',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Вхід' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Далі' })).toBeDefined();
  });

  it('renders register page when current view is register', async () => {
    window.location.hash = '#register';
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-4',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Реєстрація' })).toBeDefined();
    expect(screen.getByLabelText('ім’я')).toBeDefined();
    expect(screen.getByLabelText('Прізвище')).toBeDefined();
    expect(screen.getByLabelText('ім’я користувача')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Далі' })).toBeDefined();
  });

  it('renders pet register page when current view is pet-register', async () => {
    window.location.hash = '#pet-register';
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-5',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Реєстрація улюбленця' })).toBeDefined();
    expect(screen.getByLabelText('Кличка тваринки')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Зберегти' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Пропустити' })).toBeDefined();
  });
});
