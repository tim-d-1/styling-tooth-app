import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import App from './App';
import { supabase } from './lib/supabase';

describe('App Root and Auth Gating', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.pushState(null, '', '/');
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

  it('renders login page via pathname /login', async () => {
    window.history.pushState(null, '', '/login');
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

  it('renders register page via pathname /register', async () => {
    window.history.pushState(null, '', '/register');
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

  it('renders pet register page via pathname /pet-register', async () => {
    window.history.pushState(null, '', '/pet-register');
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

  it('redirects to source page (/profile) when coming from profile and skipping pet register', async () => {
    window.history.pushState({ from: '/profile' }, '', '/pet-register');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-redirect', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-5b',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    const skipBtn = screen.getByRole('button', { name: 'Пропустити' });
    await act(async () => {
      fireEvent.click(skipBtn);
    });

    expect(window.location.pathname).toBe('/profile');
  });

  it('redirects to source page (/profile) via query param from=/profile when clicking back', async () => {
    window.history.pushState(null, '', '/pet-register?from=/profile');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-redirect-2', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-5c',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    const backBtn = screen.getByRole('button', { name: /Назад/i });
    await act(async () => {
      fireEvent.click(backBtn);
    });

    expect(window.location.pathname).toBe('/profile');
  });

  it('renders profile page via pathname /profile', async () => {
    window.history.pushState(null, '', '/profile');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-1', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-6',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByRole('heading', { level: 1, name: /Вітаємо/i })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Мої улюбленці' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Налаштування профілю' })).toBeDefined();
  });

  it('renders pet detail page via pathname /pets/:petId', async () => {
    window.history.pushState(null, '', '/pets/p-test-1');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-2', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-7',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Мої улюбленці' })).toBeDefined();
    expect(screen.getByRole('navigation', { name: 'Навігація по сайту' })).toBeDefined();
  });

  it('renders pet care schedule page via pathname /pets/:petId/schedule', async () => {
    window.history.pushState(null, '', '/pets/p-test-1/schedule');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-3', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-8',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Графік профілактичних обробок' })
    ).toBeDefined();
    expect(screen.getByText('Найближча обробка')).toBeDefined();
    expect(screen.getByText('Медичні документи')).toBeDefined();
  });
});
