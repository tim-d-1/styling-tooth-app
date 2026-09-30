import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import App from './App';
import { supabase } from './lib/supabase';

describe('App Root and Auth Gating', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.scrollTo = vi.fn();
    window.history.pushState(null, '', '/');
    vi.spyOn(supabase.auth, 'getUser').mockImplementation(async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        return { data: { user: data.session.user }, error: null } as never;
      }
      return { data: { user: null }, error: new Error('Auth session missing') } as never;
    });
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

  it('clears stale session and renders landing page when getUser returns error', async () => {
    const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null } as never);
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'deleted-user', email: 'deleted@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: { message: 'User from sub claim in JWT does not exist', status: 401 } as never,
    });
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

    expect(signOutSpy).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 2, name: 'Хто ми' })).toBeDefined();
    expect(screen.queryByText('Запланований візит')).toBeNull();
  });

  it('clears stale session and renders landing page when session exists but getUser user is null', async () => {
    const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null } as never);
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'phantom-user', email: 'phantom@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
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

    expect(signOutSpy).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 2, name: 'Хто ми' })).toBeDefined();
  });

  it('renders main page with no appointment state when user is authenticated', async () => {
    const createChain = () => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.neq = vi.fn(() => chain);
      chain.gte = vi.fn(() => chain);
      chain.order = vi.fn(() => chain);
      chain.limit = vi.fn(() => chain);
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      return chain;
    };
    vi.spyOn(supabase, 'from').mockImplementation(() => createChain() as never);

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
    expect(await screen.findByText('Немає активних записів')).toBeDefined();
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
    expect(screen.queryByLabelText('ім’я користувача')).toBeNull();
    expect(screen.getByLabelText('Email/номер телефону')).toBeDefined();
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
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'pet_care_schedules') {
        return {
          select: () => ({
            eq: () => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sched-1',
                    pet_id: 'p-test-1',
                    category: 'parasites',
                    title: 'Від кліщів та бліх',
                    drug_name: 'Bravecto',
                    due_date: '2026-08-15',
                    badge_text: '✓ Захищено',
                    valid_until_formatted: 'Наступна: 15 серп.',
                    icon_name: 'fi-rr-shield-check',
                    status_text: '✓ Захищено',
                    status_type: 'warning',
                    sort_order: 1,
                  },
                ],
              }),
            }),
          }),
        } as never;
      }
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.neq = vi.fn(() => chain);
      chain.gte = vi.fn(() => chain);
      chain.order = vi.fn(() => chain);
      chain.limit = vi.fn(() => chain);
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      return chain as never;
    });

    await act(async () => {
      render(<App />);
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Графік профілактичних обробок' })
    ).toBeDefined();
    expect(await screen.findByText('Найближча обробка')).toBeDefined();
    expect(await screen.findByText('Медичні документи')).toBeDefined();

    fromSpy.mockRestore();
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
    expect(screen.getByTestId('empty-procedure-search')).toBeDefined();
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
    expect(screen.getByText("Ім'я та Прізвище")).toBeDefined();
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

  it('renders upcoming visits page via pathname /profile/upcoming-visits', async () => {
    window.history.pushState(null, '', '/profile/upcoming-visits');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-8', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-13',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Заплановані візити' })
    ).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Підсумок записів' })).toBeDefined();
  });

  it('renders loyalty program page via pathname /profile/loyalty', async () => {
    window.history.pushState(null, '', '/profile/loyalty');
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-profile-loyalty', email: 'katya@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          id: 'sub-14',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as never);

    await act(async () => {
      render(<App />);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Програма лояльності' })
    ).toBeDefined();
    expect(screen.getByText('Ваш бонусний баланс:')).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Історія транзакцій' })).toBeDefined();
  });

  describe('Unauthenticated Route Gating & Redirects', () => {
    const privatePaths = [
      '/profile',
      '/profile/personal-data',
      '/profile/addresses',
      '/profile/payment-methods',
      '/profile/upcoming-visits',
      '/profile/loyalty',
      '/profile/loyalty-program',
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

    it('navigates to /quick-schedule when clicking "Швидкий запис" on landing page', async () => {
      window.history.pushState(null, '', '/');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-anon-quick-schedule',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      const quickScheduleBtn = screen.getByRole('button', { name: 'Швидкий запис' });
      await act(async () => {
        fireEvent.click(quickScheduleBtn);
      });

      expect(window.location.pathname).toBe('/quick-schedule');
      expect(
        await screen.findByRole('heading', { level: 2, name: 'Запланований візит' })
      ).toBeDefined();
      expect(
        await screen.findByRole('heading', { level: 2, name: 'Заплануйте свій візит' })
      ).toBeDefined();
    });

    it('renders quick schedule page directly via /quick-schedule and supports back navigation', async () => {
      window.history.pushState(null, '', '/quick-schedule');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-anon-quick-direct',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(
        await screen.findByRole('heading', { level: 2, name: 'Запланований візит' })
      ).toBeDefined();
      expect(
        await screen.findByRole('heading', { level: 2, name: 'Заплануйте свій візит' })
      ).toBeDefined();

      const backBtn = screen.getByRole('button', { name: 'Назад' });
      expect(backBtn).toBeDefined();
    });

    it('renders article page directly via /articles/shampoo-guide and supports back navigation', async () => {
      window.history.pushState(null, '', '/articles/shampoo-guide');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-article-direct',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Як обрати правильний шампунь?' })
      ).toBeDefined();
      expect(screen.getByRole('button', { name: 'Назад' })).toBeDefined();
      expect(screen.getByText('Оцініть, наскільки корисною була ця інформація')).toBeDefined();
    });

    it('navigates to article page when clicking article from main page', async () => {
      const createChain = () => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.neq = vi.fn(() => chain);
        chain.gte = vi.fn(() => chain);
        chain.order = vi.fn(() => chain);
        chain.limit = vi.fn(() => chain);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
        return chain;
      };
      vi.spyOn(supabase, 'from').mockImplementation(() => createChain() as never);

      window.history.pushState(null, '', '/main');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-art-nav', email: 'user@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-art-nav',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      const articleBtn = await screen.findByRole('button', {
        name: /ЯК ОБРАТИ ПРАВИЛЬНИЙ ШАМПУНЬ\?/i,
      });
      await act(async () => {
        fireEvent.click(articleBtn);
      });

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Як обрати правильний шампунь?' })
      ).toBeDefined();
    });

    it('renders promo page directly via /promotions/free-nail-trimming and navigates to quick schedule on CTA click', async () => {
      window.history.pushState(null, '', '/promotions/free-nail-trimming');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-promo-direct',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(screen.getByText('Безкоштовне')).toBeDefined();
      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'підстригання кігтів при комплексному грумінгу',
        })
      ).toBeDefined();

      const ctaBtn = screen.getByRole('button', { name: 'Швидкий запис' });
      await act(async () => {
        fireEvent.click(ctaBtn);
      });

      expect(
        await screen.findByRole('heading', { level: 2, name: 'Запланований візит' })
      ).toBeDefined();
    });

    it('navigates to promo page when clicking promo banner from main page', async () => {
      const createChain = () => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.neq = vi.fn(() => chain);
        chain.gte = vi.fn(() => chain);
        chain.order = vi.fn(() => chain);
        chain.limit = vi.fn(() => chain);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
        return chain;
      };
      vi.spyOn(supabase, 'from').mockImplementation(() => createChain() as never);

      window.history.pushState(null, '', '/main');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-promo-nav', email: 'user@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-promo-nav',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      const promoBanner = await screen.findByRole('button', {
        name: /Безкоштовне підстригання кігтів/i,
      });
      await act(async () => {
        fireEvent.click(promoBanner);
      });

      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'підстригання кігтів при комплексному грумінгу',
        })
      ).toBeDefined();
    });

    it('navigates to promo page when clicking promo banner 2 from root route / when authenticated', async () => {
      const createChain = () => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.neq = vi.fn(() => chain);
        chain.gte = vi.fn(() => chain);
        chain.order = vi.fn(() => chain);
        chain.limit = vi.fn(() => chain);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
        return chain;
      };
      vi.spyOn(supabase, 'from').mockImplementation(() => createChain() as never);

      window.history.pushState(null, '', '/');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-root-promo', email: 'root@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-root-promo',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      const promoBanner = await screen.findByRole('button', {
        name: /Безкоштовне підстригання кігтів/i,
      });
      await act(async () => {
        fireEvent.click(promoBanner);
      });

      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'підстригання кігтів при комплексному грумінгу',
        })
      ).toBeDefined();
    });

    it('renders city selection page directly via /select-city', async () => {
      window.history.pushState(null, '', '/select-city');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-city-direct',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Оберіть своє місто' })
      ).toBeDefined();
      expect(screen.getByRole('radio', { name: 'Київ' })).toBeDefined();
      expect(screen.getByRole('radio', { name: 'Львів' })).toBeDefined();
    });

    it('navigates to city selection page when clicking location bar and updates selected city on confirm', async () => {
      const createChain = () => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.neq = vi.fn(() => chain);
        chain.gte = vi.fn(() => chain);
        chain.order = vi.fn(() => chain);
        chain.limit = vi.fn(() => chain);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
        return chain;
      };
      vi.spyOn(supabase, 'from').mockImplementation(() => createChain() as never);

      window.history.pushState(null, '', '/main');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-city-nav', email: 'user@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-city-nav',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      const locationBtn = await screen.findByRole('button', {
        name: /Поточна локація/i,
      });
      await act(async () => {
        fireEvent.click(locationBtn);
      });

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Оберіть своє місто' })
      ).toBeDefined();

      const lvivRadio = screen.getByRole('radio', { name: 'Львів' });
      await act(async () => {
        fireEvent.click(lvivRadio);
      });

      const confirmBtn = screen.getByRole('button', { name: 'Підтвердити' });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      expect(
        await screen.findByRole('button', { name: /Поточна локація: м. Львів/i })
      ).toBeDefined();
    });

    it('redirects unauthenticated user from /booking to /login with return path', async () => {
      window.history.pushState(null, '', '/booking');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-booking-unauth',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(await screen.findByRole('heading', { level: 1, name: 'Вхід' })).toBeDefined();
    });

    it('renders BookingPage when authenticated user navigates to /booking', async () => {
      const createChain = () => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.order = vi.fn().mockResolvedValue({ data: [], error: null });
        return chain;
      };
      vi.spyOn(supabase, 'from').mockImplementation(() => createChain() as never);

      window.history.pushState(null, '', '/booking');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-booking-auth', email: 'booker@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-booking-auth',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(await screen.findByRole('heading', { level: 1, name: 'Оберіть улюбленця' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Додати нового улюбленця' })).toBeDefined();
    });

    it('navigates from main page to /booking when clicking book visit button in VisitSection', async () => {
      const createChain = () => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.neq = vi.fn(() => chain);
        chain.gte = vi.fn(() => chain);
        chain.order = vi.fn(() => chain);
        chain.limit = vi.fn(() => chain);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
        return chain;
      };
      vi.spyOn(supabase, 'from').mockImplementation(() => createChain() as never);

      window.history.pushState(null, '', '/main');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-nav-book', email: 'navbook@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-nav-book',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      const bookBtn = await screen.findByRole('button', { name: /Запланувати візит/i });
      await act(async () => {
        fireEvent.click(bookBtn);
      });

      expect(await screen.findByRole('heading', { level: 1, name: 'Оберіть улюбленця' })).toBeDefined();
    });

    it('renders create ticket page via pathname /support/new-ticket', async () => {
      window.history.pushState(null, '', '/support/new-ticket');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-support-1', email: 'support@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-support-1',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Створити нове звернення' })).toBeDefined();
    });

    it('renders support chat page via pathname /support/chat', async () => {
      window.history.pushState(null, '', '/support/chat');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-support-2', email: 'support2@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-support-2',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(screen.getByText('Служба підтримки')).toBeDefined();
    });

    it('renders support call page via pathname /support/call', async () => {
      window.history.pushState(null, '', '/support/call');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-support-3', email: 'support3@example.com' },
          },
        },
        error: null,
      } as never);
      vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
        data: {
          subscription: {
            id: 'sub-support-3',
            callback: vi.fn(),
            unsubscribe: vi.fn(),
          },
        },
      } as never);

      await act(async () => {
        render(<App />);
      });

      expect(screen.getByText('Адміністратор Сергій')).toBeDefined();
      expect(screen.getByRole('button', { name: 'Завершити дзвінок' })).toBeDefined();
    });
  });
});

