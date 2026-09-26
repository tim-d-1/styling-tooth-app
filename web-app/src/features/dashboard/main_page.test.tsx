import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Header from '@/components/layout/Header';
import LocationBar from './LocationBar';
import GuestBanner from './GuestBanner';
import VisitSection from './VisitSection';
import UpcomingVisitCard from './UpcomingVisitCard';
import PromoBannersGrid from './PromoBannersGrid';
import ExpertAdviceGrid from './ExpertAdviceGrid';
import MainPage from './MainPage';
import { formatVisitDateDetails } from './dashboard_utils';
import { supabase } from '@/lib/supabase';

describe('Main Page Components', () => {
  describe('Header', () => {
    it('renders guest state with login and register triggers', () => {
      const handleLogin = vi.fn();
      const handleRegister = vi.fn();
      render(<Header isLoggedIn={false} onLoginClick={handleLogin} onRegisterClick={handleRegister} />);

      const loginBtn = screen.getByRole('button', { name: /Вхід \/ Реєстрація/i });
      fireEvent.click(loginBtn);
      expect(handleLogin).toHaveBeenCalled();

      const registerBtn = screen.getByRole('button', { name: /Зареєструватися/i });
      fireEvent.click(registerBtn);
      expect(handleRegister).toHaveBeenCalled();
    });

    it('renders authenticated state with user avatar, notifications and device trigger', () => {
      const handleProfile = vi.fn();
      const handleDevice = vi.fn();
      const handleNotification = vi.fn();
      render(
        <Header
          isLoggedIn={true}
          userName="Марія Булах"
          onProfileClick={handleProfile}
          onDeviceClick={handleDevice}
          onNotificationClick={handleNotification}
          hasNotification={true}
        />
      );

      const profileBtn = screen.getByRole('button', { name: /Особистий профіль користувача: Марія Булах/i });
      const avatarImg = screen.getByRole('img', { name: 'Марія Булах' });
      expect(avatarImg.getAttribute('src')).toBe('/assets/images/default-avatar.svg');
      fireEvent.click(profileBtn);
      expect(handleProfile).toHaveBeenCalled();

      const deviceBtn = screen.getByRole('button', { name: /Завантажити мобільний застосунок/i });
      fireEvent.click(deviceBtn);
      expect(handleDevice).toHaveBeenCalled();

      const notifyBtn = screen.getByRole('button', { name: /Сповіщення: є нові/i });
      fireEvent.click(notifyBtn);
      expect(handleNotification).toHaveBeenCalled();
    });

    it('falls back to default avatar when user avatar fails to load', () => {
      render(
        <Header
          isLoggedIn={true}
          userName="Марія Булах"
          userAvatarUrl="https://example.com/broken-google-avatar.png"
        />
      );

      const avatarImg = screen.getByRole('img', { name: 'Марія Булах' });
      expect(avatarImg.getAttribute('src')).toBe(
        'https://example.com/broken-google-avatar.png'
      );

      fireEvent.error(avatarImg);
      expect(avatarImg.getAttribute('src')).toBe('/assets/images/default-avatar.svg');
    });
  });

  describe('LocationBar', () => {
    it('renders location text and handles notification bell click', () => {
      const handleNotify = vi.fn();
      const handleLocation = vi.fn();
      render(
        <LocationBar
          location="м. Київ"
          onNotificationClick={handleNotify}
          onLocationClick={handleLocation}
          hasNotification={true}
        />
      );

      const locationBtn = screen.getByRole('button', { name: /Поточна локація: м. Київ/i });
      fireEvent.click(locationBtn);
      expect(handleLocation).toHaveBeenCalled();

      const bellBtn = screen.getByRole('button', { name: /Центр сповіщень: є нові сповіщення/i });
      fireEvent.click(bellBtn);
      expect(handleNotify).toHaveBeenCalled();
    });
  });

  describe('GuestBanner', () => {
    it('handles quick book click', () => {
      const handleQuickBook = vi.fn();
      render(<GuestBanner onQuickBookClick={handleQuickBook} />);

      const bookBtn = screen.getByRole('button', { name: /Швидкий запис на візит/i });
      fireEvent.click(bookBtn);
      expect(handleQuickBook).toHaveBeenCalled();
    });
  });

  describe('VisitSection & UpcomingVisitCard', () => {
    it('renders empty fallback when visit is null', () => {
      const handleBook = vi.fn();
      render(<VisitSection visit={null} onBookClick={handleBook} />);

      expect(screen.getByText('Немає активних записів')).toBeDefined();
      const bookBtn = screen.getByRole('button', { name: /Запланувати візит/i });
      fireEvent.click(bookBtn);
      expect(handleBook).toHaveBeenCalled();
    });

    it('renders upcoming visit card with details and handles transfer switch', () => {
      const handleReschedule = vi.fn();
      const handleCancel = vi.fn();
      render(
        <UpcomingVisitCard
          dayOfWeek="ПН"
          dayNumber="15"
          timeSlot="14:00"
          masterName="Олена Коваль"
          procedureName="Стрижка кота"
          basePrice={1000}
          transferPrice={150}
          initialTransferEnabled={false}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByText('ПН')).toBeDefined();
      expect(screen.getByText('15')).toBeDefined();
      expect(screen.getByText('Олена Коваль')).toBeDefined();
      expect(screen.getByText('1000 ₴')).toBeDefined();

      const switchBtn = screen.getByRole('switch', { name: /Увімкнути або вимкнути трансфер улюбленця/i });
      fireEvent.click(switchBtn);
      expect(screen.getByText('1150 ₴')).toBeDefined();

      const rescheduleBtn = screen.getByRole('button', { name: /Перенести запланований візит/i });
      fireEvent.click(rescheduleBtn);
      expect(handleReschedule).toHaveBeenCalled();

      const cancelBtn = screen.getByRole('button', { name: /Скасувати запланований візит/i });
      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalled();
    });
  });

  describe('PromoBannersGrid', () => {
    it('handles promo banner actions', () => {
      const handle1 = vi.fn();
      const handle2 = vi.fn();
      const handle3 = vi.fn();
      render(
        <PromoBannersGrid
          onBanner1Click={handle1}
          onBanner2Click={handle2}
          onBanner3Click={handle3}
        />
      );

      const banner1 = screen.getByRole('button', { name: /Знижка 25% на перший грумінг/i });
      fireEvent.click(banner1);
      expect(handle1).toHaveBeenCalled();

      const banner2 = screen.getByRole('button', { name: /Безкоштовне підстригання кігтів/i });
      fireEvent.click(banner2);
      expect(handle2).toHaveBeenCalled();

      const banner3 = screen.getByRole('button', {
        name: /-20% на комплексний грумінг у будні/i,
      });
      fireEvent.click(banner3);
      expect(handle3).toHaveBeenCalled();
    });
  });

  describe('ExpertAdviceGrid', () => {
    it('renders fallback when articles array is empty', () => {
      render(<ExpertAdviceGrid articles={[]} />);
      expect(screen.getByText('Немає доступних порад')).toBeDefined();
    });

    it('renders articles and handles article click', () => {
      const handleClick = vi.fn();
      const mockArticles = [
        { id: 'art1', title: 'Порада 1', type: 'shampoo' as const },
        { id: 'art2', title: 'Порада 2', subtitle: 'Підзаголовок', type: 'paw' as const },
        { id: 'art3', title: 'Порада 3', type: 'walk' as const },
      ];
      render(<ExpertAdviceGrid articles={mockArticles} onArticleClick={handleClick} />);

      const article1 = screen.getByRole('button', { name: 'Порада 1' });
      fireEvent.click(article1);
      expect(handleClick).toHaveBeenCalledWith('art1');

      const article3 = screen.getByRole('button', { name: 'Порада 3' });
      fireEvent.click(article3);
      expect(handleClick).toHaveBeenCalledWith('art3');
    });
  });

  describe('dashboard_utils', () => {
    it('formats valid ISO date into short Ukrainian weekday, day number, and time', () => {
      const res = formatVisitDateDetails('2026-10-15T14:00:00Z');
      expect(res.dayOfWeek).toBeTruthy();
      expect(res.dayNumber).toBe('15');
      expect(res.timeSlot).toMatch(/^\d{2}:\d{2}$/);
    });

    it('falls back to default values when date string is invalid', () => {
      const res = formatVisitDateDetails('invalid-date');
      expect(res).toEqual({
        dayOfWeek: 'СЕР',
        dayNumber: '10',
        timeSlot: '16:00',
      });
    });
  });

  describe('MainPage Visit Loading & Cancellation', () => {
    it('loads upcoming appointment from Supabase when user is authenticated', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'usr-main-1' },
          },
        },
        error: null,
      } as never);

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    full_name: 'Андрій К.',
                    avatar_url: null,
                  },
                }),
              }),
            }),
          } as never;
        }

        if (table === 'appointments') {
          return {
            select: () => ({
              eq: () => ({
                neq: () => ({
                  gte: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: {
                            id: 'app-main-100',
                            starts_at: '2026-10-15T14:00:00Z',
                            price: 1800,
                            status: 'confirmed',
                            master: { display_name: 'Ольга Майстер' },
                            service: { name: 'Спа-догляд' },
                          },
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          } as never;
        }

        return {} as never;
      });

      await act(async () => {
        render(<MainPage isLoggedIn={true} />);
      });

      expect(screen.getByText('Ольга Майстер')).toBeDefined();
      expect(screen.getByText('Спа-догляд')).toBeDefined();
      expect(screen.getByText('1800 ₴')).toBeDefined();
    });

    it('cancels appointment via Supabase update and renders empty state on success', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'usr-main-2' },
          },
        },
        error: null,
      } as never);

      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({
        eq: eqMock,
      });

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { full_name: 'Тетяна В.' },
                }),
              }),
            }),
          } as never;
        }

        if (table === 'appointments') {
          return {
            select: () => ({
              eq: () => ({
                neq: () => ({
                  gte: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: {
                            id: 'app-main-200',
                            starts_at: '2026-10-15T14:00:00Z',
                            price: 1300,
                            status: 'new',
                            master: { display_name: 'Марія Шевченко' },
                            service: { name: 'Комплексний грумінг' },
                          },
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            update: updateMock,
          } as never;
        }

        return {} as never;
      });

      const handleToast = vi.fn();
      await act(async () => {
        render(<MainPage isLoggedIn={true} onToast={handleToast} />);
      });

      expect(screen.getByText('Комплексний грумінг')).toBeDefined();

      const cancelBtn = screen.getByRole('button', { name: /Скасувати запланований візит/i });
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      expect(updateMock).toHaveBeenCalledWith({ status: 'cancelled' });
      expect(eqMock).toHaveBeenCalledWith('id', 'app-main-200');
      expect(handleToast).toHaveBeenCalledWith('Візит скасовано');
      expect(screen.getByText('Немає активних записів')).toBeDefined();
    });

    it('shows error toast and preserves upcoming visit card when Supabase cancellation fails', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'usr-main-3' },
          },
        },
        error: null,
      } as never);

      const eqMock = vi.fn().mockResolvedValue({
        error: { message: 'Database RLS error' },
      });
      const updateMock = vi.fn().mockReturnValue({
        eq: eqMock,
      });

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { full_name: 'Тетяна В.' },
                }),
              }),
            }),
          } as never;
        }

        if (table === 'appointments') {
          return {
            select: () => ({
              eq: () => ({
                neq: () => ({
                  gte: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: {
                            id: 'app-main-fail',
                            starts_at: '2026-10-15T14:00:00Z',
                            price: 1300,
                            status: 'new',
                            master: { display_name: 'Марія Шевченко' },
                            service: { name: 'Комплексний грумінг' },
                          },
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            update: updateMock,
          } as never;
        }

        return {} as never;
      });

      const handleToast = vi.fn();
      await act(async () => {
        render(<MainPage isLoggedIn={true} onToast={handleToast} />);
      });

      expect(screen.getByText('Комплексний грумінг')).toBeDefined();

      const cancelBtn = screen.getByRole('button', { name: /Скасувати запланований візит/i });
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      expect(updateMock).toHaveBeenCalledWith({ status: 'cancelled' });
      expect(eqMock).toHaveBeenCalledWith('id', 'app-main-fail');
      expect(handleToast).toHaveBeenCalledWith('Помилка скасування: Database RLS error');
      expect(screen.getByText('Комплексний грумінг')).toBeDefined();
    });

    it('invokes custom onCancelVisit callback if provided', async () => {
      const handleCancelVisit = vi.fn().mockResolvedValue(undefined);
      const handleToast = vi.fn();

      await act(async () => {
        render(
          <MainPage
            isLoggedIn={false}
            initialVisit={{
              id: 'custom-visit-1',
              procedureName: 'Спеціальний догляд',
            }}
            onCancelVisit={handleCancelVisit}
            onToast={handleToast}
          />
        );
      });

      expect(screen.getByText('Спеціальний догляд')).toBeDefined();

      const cancelBtn = screen.getByRole('button', { name: /Скасувати запланований візит/i });
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      expect(handleCancelVisit).toHaveBeenCalledWith('custom-visit-1');
      expect(handleToast).toHaveBeenCalledWith('Візит скасовано');
      expect(screen.getByText('Немає активних записів')).toBeDefined();
    });
  });
});
