import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingHero from './LandingHero';
import LandingAbout from './LandingAbout';
import LandingServices from './LandingServices';
import LandingContacts from './LandingContacts';
import LandingFooter from './LandingFooter';
import LandingPage from './LandingPage';
import { LANDING_SERVICES, CONTACT_ITEMS } from './landing_types';

describe('Landing Page Components', () => {
  describe('LandingHero', () => {
    it('renders hero titles and handles action triggers', () => {
      const handleRegister = vi.fn();
      const handleLogin = vi.fn();

      render(
        <LandingHero
          onRegisterClick={handleRegister}
          onLoginClick={handleLogin}
        />
      );

      expect(screen.getByText('Стильний зубець')).toBeDefined();
      expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
      expect(screen.getByText('без черг і дзвінків')).toBeDefined();

      const registerBtn = screen.getByRole('button', { name: 'Реєстрація' });
      fireEvent.click(registerBtn);
      expect(handleRegister).toHaveBeenCalledTimes(1);

      const loginBtn = screen.getByRole('button', { name: 'Увійти' });
      fireEvent.click(loginBtn);
      expect(handleLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('LandingAbout', () => {
    it('renders who we are section and triggers book callback', () => {
      const handleBook = vi.fn();
      render(<LandingAbout onBookClick={handleBook} />);

      expect(screen.getByRole('heading', { level: 2, name: 'Хто ми' })).toBeDefined();
      expect(
        screen.getByText('Стильний Зубець — простір турботи та краси для вашого улюбленця.')
      ).toBeDefined();
      expect(screen.getByText('Турбота, яку видно.')).toBeDefined();

      const bookBtn = screen.getByRole('button', { name: 'Записати улюбленця' });
      fireEvent.click(bookBtn);
      expect(handleBook).toHaveBeenCalledTimes(1);
    });
  });

  describe('LandingServices', () => {
    it('renders all 8 services and triggers quick book callback', () => {
      const handleQuickBook = vi.fn();
      render(<LandingServices onQuickBookClick={handleQuickBook} />);

      expect(
        screen.getByRole('heading', { level: 2, name: 'Наші послуги' })
      ).toBeDefined();

      expect(LANDING_SERVICES).toHaveLength(8);
      for (const service of LANDING_SERVICES) {
        expect(screen.getByText(service.title)).toBeDefined();
        expect(screen.getByText(service.description)).toBeDefined();
      }

      const quickBookBtn = screen.getByRole('button', { name: 'Швидкий запис' });
      fireEvent.click(quickBookBtn);
      expect(handleQuickBook).toHaveBeenCalledTimes(1);
    });
  });

  describe('LandingContacts', () => {
    it('renders contacts heading, social icons and information cards', () => {
      render(<LandingContacts />);

      expect(
        screen.getByRole('heading', { level: 2, name: 'Контакти' })
      ).toBeDefined();

      expect(screen.getByLabelText('Instagram')).toBeDefined();
      expect(screen.getByLabelText('Telegram')).toBeDefined();
      expect(screen.getByLabelText('Facebook')).toBeDefined();
      expect(screen.getByLabelText('WhatsApp')).toBeDefined();

      for (const item of CONTACT_ITEMS) {
        expect(screen.getByText(item.label)).toBeDefined();
        expect(screen.getByText(item.value)).toBeDefined();
      }
    });
  });

  describe('LandingFooter', () => {
    it('renders footer navigation links, address, legal links and copyright', () => {
      render(<LandingFooter />);

      expect(screen.getByText('Адреса')).toBeDefined();
      expect(screen.getByText('Київ, Хрещатик, 15')).toBeDefined();
      expect(screen.getByText('+38 (044) 123-45-67')).toBeDefined();
      expect(screen.getByText('Щодня: 09:00 - 21:00')).toBeDefined();

      expect(screen.getByRole('link', { name: 'Послуги' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'Про нас' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'Контакти' })).toBeDefined();

      expect(screen.getByRole('link', { name: 'Політика конфіденційності' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'Умови використання' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'Договір оферти' })).toBeDefined();

      expect(
        screen.getByText('© 2026 Стильний зубець. Усі права захищено.')
      ).toBeDefined();
      expect(screen.getByText("З любов'ю до тварин")).toBeDefined();
    });
  });

  describe('LandingPage Integration', () => {
    it('renders all sections together and propagates action callbacks', () => {
      const handleRegister = vi.fn();
      const handleLogin = vi.fn();
      const handleBook = vi.fn();

      const { container } = render(
        <LandingPage
          onRegisterClick={handleRegister}
          onLoginClick={handleLogin}
          onBookClick={handleBook}
        />
      );

      expect(screen.getByText('Стильний зубець')).toBeDefined();
      expect(screen.getByRole('heading', { level: 2, name: 'Хто ми' })).toBeDefined();
      expect(screen.getByRole('heading', { level: 2, name: 'Наші послуги' })).toBeDefined();
      expect(screen.getByRole('heading', { level: 2, name: 'Контакти' })).toBeDefined();
      expect(screen.getByText('Юридична інформація')).toBeDefined();

      const elementsWithInlineStyles = container.querySelectorAll('[style]');
      expect(elementsWithInlineStyles.length).toBe(0);
    });
  });
});
