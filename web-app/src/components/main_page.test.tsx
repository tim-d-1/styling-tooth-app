import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';
import LocationBar from './LocationBar';
import GuestBanner from './GuestBanner';
import VisitSection from './VisitSection';
import UpcomingVisitCard from './UpcomingVisitCard';
import PromoBannersGrid from './PromoBannersGrid';
import ExpertAdviceGrid from './ExpertAdviceGrid';

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
      fireEvent.click(profileBtn);
      expect(handleProfile).toHaveBeenCalled();

      const deviceBtn = screen.getByRole('button', { name: /Завантажити мобільний застосунок/i });
      fireEvent.click(deviceBtn);
      expect(handleDevice).toHaveBeenCalled();

      const notifyBtn = screen.getByRole('button', { name: /Сповіщення: є нові/i });
      fireEvent.click(notifyBtn);
      expect(handleNotification).toHaveBeenCalled();
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

      const banner3 = screen.getByRole('button', { name: /Мобільний застосунок: Керуйте візитами та бонусами 24\/7/i });
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
      ];
      render(<ExpertAdviceGrid articles={mockArticles} onArticleClick={handleClick} />);

      const article1 = screen.getByRole('button', { name: 'Порада 1' });
      fireEvent.click(article1);
      expect(handleClick).toHaveBeenCalledWith('art1');
    });
  });
});
