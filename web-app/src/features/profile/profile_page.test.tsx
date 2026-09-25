import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ProfileHero from './ProfileHero';
import ProfileUpcomingVisitCard from './ProfileUpcomingVisitCard';
import LoyaltyCard from './LoyaltyCard';
import MyPetsSection from './MyPetsSection';
import ProfileSettingsSection from './ProfileSettingsSection';
import ProfilePage from './ProfilePage';
import { supabase } from '@/lib/supabase';
import { formatAppointmentDate, formatPetAge } from './profile_utils';
import type { ProfilePet, UpcomingVisitData } from './profile_types';

describe('Profile Feature Components', () => {
  describe('ProfileHero', () => {
    it('renders breadcrumbs and greeting text', () => {
      const handleHome = vi.fn();
      const handleBook = vi.fn();

      render(
        <ProfileHero
          userName="Марія"
          onHomeClick={handleHome}
          onBookClick={handleBook}
        />
      );

      expect(screen.getByText('Головна')).toBeDefined();
      expect(screen.getByText('Особистий кабінет')).toBeDefined();
      expect(screen.getByRole('heading', { level: 1, name: 'Вітаємо, Марія! 👋' })).toBeDefined();

      fireEvent.click(screen.getByText('Головна'));
      expect(handleHome).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: 'Записатися на грумінг' }));
      expect(handleBook).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProfileUpcomingVisitCard', () => {
    const mockVisit: UpcomingVisitData = {
      id: 'v1',
      petName: 'Барон',
      petAvatarUrl: null,
      serviceTitle: 'Комплексний грумінг & СПА',
      masterName: 'Олена М.',
      price: 1200,
      scheduledAtFormatted: 'Субота, 22 Серпня • 14:00',
    };

    it('renders active visit details and triggers action callbacks', () => {
      const handleReschedule = vi.fn();
      const handleCancel = vi.fn();

      render(
        <ProfileUpcomingVisitCard
          visit={mockVisit}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByText('Найближчий візит')).toBeDefined();
      expect(screen.getByText('Субота, 22 Серпня • 14:00')).toBeDefined();
      expect(screen.getByText('Барон')).toBeDefined();
      expect(screen.getByText('Комплексний грумінг & СПА')).toBeDefined();
      expect(screen.getByText('Майстер: Олена М. • 1 200 грн')).toBeDefined();
      expect(screen.getByTestId('pet-default-avatar')).toBeDefined();

      fireEvent.click(screen.getByRole('button', { name: 'Перенести' }));
      expect(handleReschedule).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('renders empty state when no upcoming visit is scheduled without redundant schedule button', () => {
      render(<ProfileUpcomingVisitCard visit={null} />);

      expect(screen.getByText('Немає запланованих візитів')).toBeDefined();
      expect(
        screen.getByText('Оберіть зручний час для догляду за вашим улюбленцем')
      ).toBeDefined();
      expect(screen.queryByRole('button', { name: 'Записатися' })).toBeNull();
    });
  });

  describe('LoyaltyCard', () => {
    it('renders user details and loyalty balance', () => {
      const handleLoyalty = vi.fn();

      render(
        <LoyaltyCard
          user={{
            name: 'Оксана',
            phone: '+380 (50) 123 45 67',
            loyaltyTier: 'Silver Level • 15% Cashback',
            bonusPoints: 320,
          }}
          onLoyaltyClick={handleLoyalty}
        />
      );

      expect(screen.getByText('Оксана')).toBeDefined();
      expect(screen.getByText('+380 (50) 123 45 67')).toBeDefined();
      expect(screen.getByText('Silver Level • 15% Cashback')).toBeDefined();
      expect(screen.getByText('320')).toBeDefined();
      expect(screen.getByText('бонусів')).toBeDefined();

      const cardBtn = screen.getByRole('button');
      fireEvent.click(cardBtn);
      expect(handleLoyalty).toHaveBeenCalledTimes(1);
    });

    it('renders user uploaded avatar when provided', () => {
      render(
        <LoyaltyCard
          user={{
            name: 'Катерина',
            phone: '+380 97 000 00 00',
            avatarUrl: 'https://example.com/uploaded-avatar.jpg',
          }}
        />
      );

      const avatar = screen.getByRole('img', { name: 'Катерина' });
      expect(avatar.getAttribute('src')).toBe('https://example.com/uploaded-avatar.jpg');
    });

    it('falls back to default avatar when user avatar fails to load in LoyaltyCard', () => {
      render(
        <LoyaltyCard
          user={{
            name: 'Катерина',
            phone: '+380 97 000 00 00',
            avatarUrl: 'https://example.com/broken-avatar.jpg',
          }}
        />
      );

      const avatar = screen.getByRole('img', { name: 'Катерина' });
      fireEvent.error(avatar);
      expect(avatar.getAttribute('src')).toBe('/assets/images/default-avatar.svg');
    });
  });

  describe('MyPetsSection', () => {
    const mockPets: ProfilePet[] = [
      {
        id: 'p1',
        name: 'Барон',
        species: 'Собака',
        breed: 'Мальтіпу',
        ageFormatted: '2 роки',
        avatarUrl: null,
        lastVisitFormatted: '18 лип',
      },
      {
        id: 'p2',
        name: 'Луна',
        species: 'Кіт',
        avatarUrl: 'https://example.com/cat-photo.jpg',
        lastVisitFormatted: null,
      },
    ];

    it('renders pet list and add pet button', () => {
      const handleAddPet = vi.fn();
      const handlePetClick = vi.fn();

      render(
        <MyPetsSection
          pets={mockPets}
          onAddPetClick={handleAddPet}
          onPetClick={handlePetClick}
        />
      );

      expect(screen.getByRole('heading', { level: 2, name: 'Мої улюбленці' })).toBeDefined();
      expect(screen.getByText('Барон')).toBeDefined();
      expect(screen.getByText('Мальтіпу • 2 роки')).toBeDefined();
      expect(screen.getByText('Останній візит: 18 лип')).toBeDefined();
      expect(screen.getByTestId('pet-avatar-p1')).toBeDefined();

      expect(screen.getByText('Луна')).toBeDefined();
      const catImg = screen.getByRole('img', { name: 'Луна' });
      expect(catImg.getAttribute('src')).toBe('https://example.com/cat-photo.jpg');

      fireEvent.click(screen.getByText('Барон'));
      expect(handlePetClick).toHaveBeenCalledWith(mockPets[0]);

      fireEvent.click(screen.getByRole('button', { name: /Додати улюбленця/i }));
      expect(handleAddPet).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProfileSettingsSection', () => {
    it('renders all setting cards and triggers callback', () => {
      const handleSelect = vi.fn();
      render(<ProfileSettingsSection onSelectSetting={handleSelect} />);

      expect(screen.getByRole('heading', { level: 2, name: 'Налаштування профілю' })).toBeDefined();
      expect(screen.getByText('Особисті дані')).toBeDefined();
      expect(screen.getByText('Мої адреси')).toBeDefined();
      expect(screen.getByText('Способи оплати')).toBeDefined();
      expect(screen.getByText('Налаштування сповіщень')).toBeDefined();
      expect(screen.getByText('Підтримка')).toBeDefined();
      expect(screen.getByText('Часті запитання (FAQ)')).toBeDefined();
      expect(screen.getByTestId('support-online-badge')).toBeDefined();

      fireEvent.click(screen.getByText('Особисті дані'));
      expect(handleSelect).toHaveBeenCalledWith('personal_info');
    });
  });

  describe('ProfilePage Integration', () => {
    it('renders profile page with empty state when user has no appointment or pets', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      } as never);

      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Вітаємо! 👋' })).toBeDefined();
      expect(screen.getByText('Найближчий візит')).toBeDefined();
      expect(screen.getByText('Немає запланованих візитів')).toBeDefined();
      expect(screen.getByRole('button', { name: /Додати улюбленця/i })).toBeDefined();
    });

    it('loads profile, pets, and upcoming appointment from supabase when authenticated', async () => {
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'usr-456' },
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
                    full_name: 'Олена Петренко',
                    phone: '+380 99 999 99 99',
                    email: 'olena@example.com',
                    avatar_url: 'https://example.com/olena.png',
                    discount_pct: 10,
                  },
                }),
              }),
            }),
          } as never;
        }

        if (table === 'pets') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'pet-db-1',
                        name: 'Рекс',
                        species: 'dog',
                        breed: 'Вівчарка',
                        birth_date: '2024-01-01',
                      },
                    ],
                  }),
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
                            id: 'app-1',
                            starts_at: '2026-10-15T14:00:00Z',
                            price: 1500,
                            status: 'confirmed',
                            pet: { name: 'Рекс', species: 'dog' },
                            master: { display_name: 'Іван Т.' },
                            service: { name: 'Повний комплекс' },
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
        render(<ProfilePage />);
      });

      expect(screen.getByRole('heading', { level: 1, name: 'Вітаємо, Олена Петренко! 👋' })).toBeDefined();
      expect(screen.getAllByText('Рекс')).toHaveLength(2);
      expect(screen.getByText('10% Знижка')).toBeDefined();
      expect(screen.getByText('Повний комплекс')).toBeDefined();
      expect(screen.getByText(/Іван Т\./)).toBeDefined();
    });
  });

  describe('profile_utils', () => {
    it('formats appointment dates into localized readable string', () => {
      const formatted = formatAppointmentDate('2026-08-22T14:00:00Z');
      expect(formatted).toContain('22');
      expect(formatted).toContain('•');
    });

    it('formats pet age based on birth date', () => {
      expect(formatPetAge(null)).toBeNull();
      expect(formatPetAge(undefined)).toBeNull();

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const ageStr = formatPetAge(oneYearAgo.toISOString().split('T')[0]);
      expect(ageStr).toContain('рік');
    });
  });
});

