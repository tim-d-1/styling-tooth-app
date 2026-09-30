import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import NotificationSettingsPage from './NotificationSettingsPage';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './notification_types';
import { supabase } from '@/lib/supabase';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('NotificationSettingsPage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'test-user-1',
            email: 'user@example.com',
            user_metadata: {
              full_name: 'Олена Петренко',
              avatar_url: '/assets/images/custom-avatar.png',
              notification_preferences: {
                channels: {
                  telegram: true,
                  push: false,
                  sms: true,
                  email: false,
                },
                types: {
                  visits: true,
                  treatments: false,
                  promos: true,
                  newSpa: true,
                },
              },
            },
          },
        },
      } as any,
      error: null,
    });

    vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
      data: { user: {} as any },
      error: null,
    });
  });

  it('renders breadcrumbs, title, channels section, and types section', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <NotificationSettingsPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('navigation', { name: 'Навігація хлібними крихтами' })).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Налаштування сповіщень' })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: "Канали зв'язку" })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Типи сповіщень' })
    ).toBeDefined();

    expect(screen.getByText('Telegram')).toBeDefined();
    expect(screen.getByText('Підтверджено')).toBeDefined();
    expect(screen.getByText('Push-сповіщення')).toBeDefined();
    expect(screen.getByText('SMS-повідомлення')).toBeDefined();
    expect(screen.getByText('Email розсилка')).toBeDefined();

    expect(screen.getByText('Нагадування про візити')).toBeDefined();
    expect(screen.getByText('Нагадування про обробки')).toBeDefined();
    expect(screen.getByText('Персональні акції та знижки')).toBeDefined();
    expect(screen.getByText('Новинки СПА та догляду')).toBeDefined();
  });

  it('loads preferences from Supabase session user_metadata', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <NotificationSettingsPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      const pushSwitch = screen.getByRole('switch', { name: 'Push-сповіщення' });
      expect(pushSwitch.getAttribute('aria-checked')).toBe('false');

      const smsSwitch = screen.getByRole('switch', { name: 'SMS-повідомлення' });
      expect(smsSwitch.getAttribute('aria-checked')).toBe('true');

      const treatmentsSwitch = screen.getByRole('switch', { name: 'Нагадування про обробки' });
      expect(treatmentsSwitch.getAttribute('aria-checked')).toBe('false');

      const spaSwitch = screen.getByRole('switch', { name: 'Новинки СПА та догляду' });
      expect(spaSwitch.getAttribute('aria-checked')).toBe('true');
    });
  });

  it('uses default preferences when initialPreferences is passed', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <NotificationSettingsPage initialPreferences={DEFAULT_NOTIFICATION_PREFERENCES} />
        </MemoryRouter>
      );
    });

    const telegramSwitch = screen.getByRole('switch', { name: 'Telegram' });
    expect(telegramSwitch.getAttribute('aria-checked')).toBe('true');

    const emailSwitch = screen.getByRole('switch', { name: 'Email розсилка' });
    expect(emailSwitch.getAttribute('aria-checked')).toBe('false');

    const spaSwitch = screen.getByRole('switch', { name: 'Новинки СПА та догляду' });
    expect(spaSwitch.getAttribute('aria-checked')).toBe('false');
  });

  it('toggles channel switch, calls supabase.auth.updateUser, and triggers toast', async () => {
    const handleToast = vi.fn();
    await act(async () => {
      render(
        <MemoryRouter>
          <NotificationSettingsPage
            initialPreferences={DEFAULT_NOTIFICATION_PREFERENCES}
            onToast={handleToast}
          />
        </MemoryRouter>
      );
    });

    const pushSwitch = screen.getByRole('switch', { name: 'Push-сповіщення' });
    expect(pushSwitch.getAttribute('aria-checked')).toBe('true');

    await act(async () => {
      fireEvent.click(pushSwitch);
    });

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          notification_preferences: {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            channels: {
              ...DEFAULT_NOTIFICATION_PREFERENCES.channels,
              push: false,
            },
          },
        },
      });
      expect(handleToast).toHaveBeenCalledWith('Налаштування збережено');
    });
  });

  it('toggles notification type switch, calls supabase.auth.updateUser, and triggers toast', async () => {
    const handleToast = vi.fn();
    await act(async () => {
      render(
        <MemoryRouter>
          <NotificationSettingsPage
            initialPreferences={DEFAULT_NOTIFICATION_PREFERENCES}
            onToast={handleToast}
          />
        </MemoryRouter>
      );
    });

    const spaSwitch = screen.getByRole('switch', { name: 'Новинки СПА та догляду' });
    expect(spaSwitch.getAttribute('aria-checked')).toBe('false');

    await act(async () => {
      fireEvent.click(spaSwitch);
    });

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          notification_preferences: {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            types: {
              ...DEFAULT_NOTIFICATION_PREFERENCES.types,
              newSpa: true,
            },
          },
        },
      });
      expect(handleToast).toHaveBeenCalledWith('Налаштування збережено');
    });
  });

  it('reverts switch state and shows error toast when Supabase updateUser returns error', async () => {
    const handleToast = vi.fn();
    vi.spyOn(supabase.auth, 'updateUser').mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Database error', name: 'AuthError', status: 500 } as any,
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <NotificationSettingsPage
            initialPreferences={DEFAULT_NOTIFICATION_PREFERENCES}
            onToast={handleToast}
          />
        </MemoryRouter>
      );
    });

    const smsSwitch = screen.getByRole('switch', { name: 'SMS-повідомлення' });
    expect(smsSwitch.getAttribute('aria-checked')).toBe('false');

    await act(async () => {
      fireEvent.click(smsSwitch);
    });

    await waitFor(() => {
      expect(handleToast).toHaveBeenCalledWith('Помилка збереження налаштувань');
      expect(smsSwitch.getAttribute('aria-checked')).toBe('false');
    });
  });

  it('triggers navigation callbacks for home and profile breadcrumbs', async () => {
    const handleHome = vi.fn();
    const handleProfile = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <NotificationSettingsPage
            onHomeClick={handleHome}
            onProfileClick={handleProfile}
          />
        </MemoryRouter>
      );
    });

    const breadcrumbHome = screen.getByRole('button', { name: 'Головна' });
    fireEvent.click(breadcrumbHome);
    expect(handleHome).toHaveBeenCalledTimes(1);

    const breadcrumbProfile = screen.getByRole('button', { name: 'Особистий кабінет' });
    fireEvent.click(breadcrumbProfile);
    expect(handleProfile).toHaveBeenCalledTimes(1);
  });
});
