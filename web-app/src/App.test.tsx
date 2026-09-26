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

  it('renders pet procedure history page via pathname /pets/:petId/history', async () => {
    window.history.pushState(null, '', '/pets/p-test-1/history');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-4', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-9',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Історія процедур' })
    ).toBeDefined();
    expect(screen.getByText('СПА-комплекс + Гігієнічна стрижка')).toBeDefined();
    expect(screen.getByText('Підсумок за 2026 рік')).toBeDefined();
  });

  it('renders personal data page via pathname /profile/personal-data', async () => {
    window.history.pushState(null, '', '/profile/personal-data');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-5', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-10',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Особисті дані' })
    ).toBeDefined();
    expect(screen.getByText('V.I.P Користувач')).toBeDefined();
    expect(screen.getByText('Зберегти зміни')).toBeDefined();
  });

  it('renders my addresses page via pathname /profile/addresses', async () => {
    window.history.pushState(null, '', '/profile/addresses');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-6', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-11',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Мої Адреси' })
    ).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Деталі адреси' })).toBeDefined();
    expect(screen.getByTestId('pet-taxi-map-card')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Обрати адресу' })).toBeDefined();
  });

  it('renders payment methods page via pathname /profile/payment-methods', async () => {
    window.history.pushState(null, '', '/profile/payment-methods');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-7', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-12',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Способи оплати' })
    ).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Збережені способи' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Додати банківську картку' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Останні транзакції' })).toBeDefined();
  });

  describe('Unauthenticated Route Gating & Redirects', () => {
    const privatePaths = [
      '/profile',
      '/profile/personal-data',
      '/profile/addresses',
      '/profile/payment-methods',
      '/pets/p-test-1',
      '/pets/p-test-1/schedule',
      '/pets/p-test-1/history',
    ];

    for (const testPath of privatePaths) {
      it(`redirects unauthenticated guest from ${testPath} to /login with returnTo query param`, async () => {
        window.history.pushState(null, '', testPath);
        vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
          data: { session: null },
          error: null,
        } as never);
        vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
          data: {
            subscription: {
              id: `sub-unauth-${testPath}`,
              callback: vi.fn(),
              unsubscribe: vi.fn(),
            },
          },
        } as never);

        await act(async () => {
          render(<App />);
        });

        expect(window.location.pathname).toBe('/login');
        expect(window.location.search).toBe(`?from=${encodeURIComponent(testPath)}`);
        expect(screen.getByRole('heading', { level: 1, name: 'Вхід' })).toBeDefined();
      });
    }

    it('redirects authenticated user from /login back to /main or returnTo path', async () => {
      window.history.pushState(null, '', '/login?from=/profile');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'authed-usr-1', email: 'authed@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-authed-login',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(window.location.pathname).toBe('/profile');
    });

    it('redirects authenticated user from /register to /main', async () => {
      window.history.pushState(null, '', '/register');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'authed-usr-2', email: 'authed2@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-authed-register',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(window.location.pathname).toBe('/main');
    });

    it('navigates to returnTo path on successful login', async () => {
      window.history.pushState(null, '', '/login?from=/profile/addresses');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-login-flow',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: {
          session: { user: { id: 'usr-flow', email: 'flow@test.com' } },
          user: { id: 'usr-flow', email: 'flow@test.com' },
        },
        error: null,
      } as never);

      await act(async () => {
        render(<App />);
      });

      const idInput = screen.getByLabelText('Email/номер телефону');
      const pwdInput = screen.getByLabelText('Пароль');
      const submitBtn = screen.getByRole('button', { name: 'Далі' });

      await act(async () => {
        fireEvent.change(idInput, { target: { value: 'flow@test.com' } });
        fireEvent.change(pwdInput, { target: { value: 'password123' } });
        fireEvent.click(submitBtn);
      });

      expect(window.location.pathname).toBe('/profile/addresses');
    });
  });
});
