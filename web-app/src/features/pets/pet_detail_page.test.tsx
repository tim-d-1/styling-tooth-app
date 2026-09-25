import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PetProfileCard from './PetProfileCard';
import PetHealthAlertCard from './PetHealthAlertCard';
import PetCareScheduleCard from './PetCareScheduleCard';
import PetProcedureHistoryCard from './PetProcedureHistoryCard';
import PetDetailPage from './PetDetailPage';
import {
  formatPetSubtitle,
  formatVisitsCount,
  getSpeciesEmoji,
  formatDateToUkrainian,
} from './pet_utils';
import { formatPetAge } from '@/features/profile/profile_utils';
import type {
  PetDetail,
  PetSwitcherItem,
  PetProcedureHistory,
  CareScheduleItem,
} from './pet_types';
import { supabase } from '@/lib/supabase';

describe('Pet Feature Utilities', () => {
  it('formats pet subtitle correctly with breed, age and weight', () => {
    expect(formatPetSubtitle('Мальтіпу', '2 роки 4 місяці', 4.5)).toBe(
      'Мальтіпу • 2 роки 4 місяці • 4.5 кг'
    );
    expect(formatPetSubtitle('Коргі', null, 12)).toBe('Коргі • 12 кг');
    expect(formatPetSubtitle(null, '1 рік', null)).toBe('1 рік');
    expect(formatPetSubtitle(null, null, null)).toBe('');
  });

  it('formats visit count pluralization in Ukrainian', () => {
    expect(formatVisitsCount(0)).toBe('0 візитів');
    expect(formatVisitsCount(1)).toBe('1 візит');
    expect(formatVisitsCount(2)).toBe('2 візити');
    expect(formatVisitsCount(4)).toBe('4 візити');
    expect(formatVisitsCount(5)).toBe('5 візитів');
    expect(formatVisitsCount(11)).toBe('11 візитів');
    expect(formatVisitsCount(12)).toBe('12 візитів');
    expect(formatVisitsCount(21)).toBe('21 візит');
    expect(formatVisitsCount(24)).toBe('24 візити');
  });

  it('resolves species emojis correctly', () => {
    expect(getSpeciesEmoji('dog')).toBe('🐶');
    expect(getSpeciesEmoji('Собака')).toBe('🐶');
    expect(getSpeciesEmoji('cat')).toBe('🐱');
    expect(getSpeciesEmoji('Кіт')).toBe('🐱');
    expect(getSpeciesEmoji('rabbit')).toBe('🐰');
    expect(getSpeciesEmoji('rodent')).toBe('🐹');
    expect(getSpeciesEmoji('bird')).toBe('🦜');
    expect(getSpeciesEmoji('unknown')).toBe('🐾');
  });

  it('formats ISO date to Ukrainian format', () => {
    expect(formatDateToUkrainian('2026-07-20T10:00:00Z')).toMatch(/20/);
    expect(formatDateToUkrainian('2026-07-20T10:00:00Z')).toMatch(/2026/);
    expect(formatDateToUkrainian(null)).toBe('');
  });
});

describe('Pet Feature Components', () => {
  const mockPet: PetDetail = {
    id: 'pet-1',
    name: 'Барон',
    species: 'dog',
    breed: 'Мальтіпу',
    birthDate: '2024-03-01',
    ageFormatted: '2 роки 4 місяці',
    weightKg: 4.5,
    behaviorNotes: 'Чутлива шкіра вух',
    medicalNotes: 'Алергія на курку та штучні ароматизатори',
    avatarUrl: null,
    visitsCount: 12,
    isVip: true,
  };

  describe('PetProfileCard', () => {
    it('renders pet card details, badges and edit trigger', () => {
      const handleEdit = vi.fn();
      render(<PetProfileCard pet={mockPet} onEditClick={handleEdit} />);

      expect(screen.getByRole('heading', { level: 2, name: 'Барон' })).toBeDefined();
      expect(screen.getByText('Мальтіпу • 2 роки 4 місяці • 4.5 кг')).toBeDefined();
      expect(screen.getByTestId('visits-badge').textContent).toBe('12 візитів');
      expect(screen.getByTestId('vip-badge')).toBeDefined();
      expect(screen.getByTestId('default-pet-avatar')).toBeDefined();

      fireEvent.click(
        screen.getByRole('button', { name: 'Редагувати профіль улюбленця' })
      );
      expect(handleEdit).toHaveBeenCalledTimes(1);
    });

    it('renders uploaded avatar image when available', () => {
      const petWithAvatar: PetDetail = {
        ...mockPet,
        avatarUrl: 'https://example.com/pet.png',
        isVip: false,
      };

      render(<PetProfileCard pet={petWithAvatar} />);
      const img = screen.getByRole('img', { name: 'Барон' });
      expect(img).toBeDefined();
      expect(screen.queryByTestId('vip-badge')).toBeNull();
    });
  });

  describe('PetHealthAlertCard', () => {
    it('renders bullet list from medical and behavior notes', () => {
      render(
        <PetHealthAlertCard
          medicalNotes="Алергія на курку"
          behaviorNotes="Чутлива шкіра вух"
        />
      );

      expect(screen.getByText('Алергії та особливості')).toBeDefined();
      expect(screen.getByText('Алергія на курку')).toBeDefined();
      expect(screen.getByText('Чутлива шкіра вух')).toBeDefined();
    });

    it('renders empty message when no notes are provided', () => {
      render(<PetHealthAlertCard medicalNotes={null} behaviorNotes={null} />);
      expect(screen.getByText('Особливості та алергії не вказані')).toBeDefined();
    });
  });

  describe('PetCareScheduleCard', () => {
    it('renders empty state when no schedule items are provided and handles details click', () => {
      const handleDetails = vi.fn();
      render(<PetCareScheduleCard onDetailsClick={handleDetails} />);

      expect(screen.getByRole('heading', { level: 3, name: 'Графік обробок' })).toBeDefined();
      expect(screen.getByText('Немає запланованих обробок')).toBeDefined();
      expect(screen.getByText('Натисніть, щоб відкрити або налаштувати графік')).toBeDefined();

      fireEvent.click(screen.getByTestId('empty-care-schedule'));
      expect(handleDetails).toHaveBeenCalledTimes(1);

      fireEvent.click(
        screen.getByRole('button', { name: 'Деталі графіка обробок' })
      );
      expect(handleDetails).toHaveBeenCalledTimes(2);
    });

    it('renders custom schedule items when passed as prop and handles click', () => {
      const handleDetails = vi.fn();
      const customItems: CareScheduleItem[] = [
        {
          id: 'custom-1',
          title: 'Огляд стоматолога',
          badgeText: 'Рекомендовано',
          statusType: 'neutral',
          drugName: 'Чистка ультразвуком',
          validUntilFormatted: 'до 1 вересня 2026',
          iconName: 'fi-rr-paw',
        },
        {
          id: 'custom-2',
          title: 'Від кліщів та бліх',
          badgeText: 'Через 14 днів',
          statusType: 'warning',
          drugName: 'Bravecto',
          validUntilFormatted: 'до 15 Серпня 2026',
          iconName: 'fi-rr-shield-check',
        },
      ];

      render(
        <PetCareScheduleCard
          scheduleItems={customItems}
          onDetailsClick={handleDetails}
        />
      );
      expect(screen.getByText('Огляд стоматолога')).toBeDefined();
      expect(screen.getByText('Рекомендовано')).toBeDefined();
      expect(screen.getByText('Препарат: Чистка ультразвуком')).toBeDefined();
      expect(screen.getByText('Від кліщів та бліх')).toBeDefined();
      expect(screen.getByText('Через 14 днів')).toBeDefined();

      fireEvent.click(screen.getByRole('button', { name: 'Деталі графіка обробок' }));
      expect(handleDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('PetProcedureHistoryCard', () => {
    const mockHistory: PetProcedureHistory = {
      id: 'app-1',
      appointmentId: 'app-1',
      serviceTitle: 'СПА-комплекс',
      price: 1450,
      dateFormatted: '20 Липня 2026',
      masterName: 'Анна',
      tags: ['Стрижка', 'Купання', 'Ознаки алергії відсутні'],
      beforePhotoUrl: null,
      afterPhotoUrl: null,
    };

    it('renders procedure details, tags and photo slots', () => {
      const handleDetails = vi.fn();
      render(
        <PetProcedureHistoryCard
          history={mockHistory}
          onDetailsClick={handleDetails}
        />
      );

      expect(screen.getByRole('heading', { level: 3, name: 'Історія процедур' })).toBeDefined();
      expect(screen.getByText('Останній візит')).toBeDefined();
      expect(screen.getByText('20 Липня 2026 • Майстер Анна')).toBeDefined();
      expect(screen.getByText('СПА-комплекс')).toBeDefined();
      expect(screen.getByText('1450 грн')).toBeDefined();
      expect(screen.getByText('Стрижка')).toBeDefined();
      expect(screen.getByText('Купання')).toBeDefined();
      expect(screen.getByText('Ознаки алергії відсутні')).toBeDefined();
      expect(screen.getByTestId('empty-before-photo')).toBeDefined();
      expect(screen.getByTestId('empty-after-photo')).toBeDefined();

      fireEvent.click(
        screen.getByRole('button', { name: 'Вся історія процедур' })
      );
      expect(handleDetails).toHaveBeenCalledTimes(1);

      fireEvent.click(
        screen.getByRole('heading', { level: 3, name: 'Історія процедур' })
      );
      expect(handleDetails).toHaveBeenCalledTimes(2);
    });

    it('renders uploaded before/after photos when provided', () => {
      const historyWithPhotos: PetProcedureHistory = {
        ...mockHistory,
        beforePhotoUrl: 'https://example.com/before.jpg',
        afterPhotoUrl: 'https://example.com/after.jpg',
      };

      render(<PetProcedureHistoryCard history={historyWithPhotos} />);
      expect(screen.getByRole('img', { name: 'Фото до процедури' })).toBeDefined();
      expect(screen.getByRole('img', { name: 'Фото після процедури' })).toBeDefined();
    });

    it('renders empty state when no history is provided', () => {
      render(<PetProcedureHistoryCard history={null} />);
      expect(
        screen.getByText('Немає завершених візитів для цього улюбленця')
      ).toBeDefined();
    });
  });
});

describe('PetDetailPage Integration', () => {
  const mockPets: PetSwitcherItem[] = [
    { id: 'pet-1', name: 'Барон', species: 'dog', isActive: true },
    { id: 'pet-2', name: 'Луна', species: 'cat', isActive: false },
  ];

  const mockPetDetail: PetDetail = {
    id: 'pet-1',
    name: 'Барон',
    species: 'dog',
    breed: 'Мальтіпу',
    birthDate: '2024-03-01',
    ageFormatted: '2 роки 4 місяці',
    weightKg: 4.5,
    behaviorNotes: 'Чутлива шкіра вух',
    medicalNotes: 'Алергія на курку',
    avatarUrl: null,
    visitsCount: 12,
    isVip: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders breadcrumbs, title, switcher pills and handles actions', async () => {
    const handleHome = vi.fn();
    const handleProfile = vi.fn();
    const handleAddPet = vi.fn();
    const handleBook = vi.fn();
    const handleRecommendations = vi.fn();

    const handleSchedule = vi.fn();
    const handleHistory = vi.fn();

    render(
      <MemoryRouter initialEntries={['/pets/pet-1']}>
        <PetDetailPage
          onHomeClick={handleHome}
          onProfileClick={handleProfile}
          onAddPetClick={handleAddPet}
          onBookClick={handleBook}
          onRecommendationsClick={handleRecommendations}
          onScheduleClick={handleSchedule}
          onHistoryClick={handleHistory}
          initialPets={mockPets}
          initialPetDetail={mockPetDetail}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Головна')).toBeDefined();
    expect(screen.getByText('Особистий кабінет')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Мої улюбленці' })).toBeDefined();

    expect(screen.getByRole('button', { name: /Барон/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Луна/ })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Барон' })).toBeDefined();

    fireEvent.click(screen.getByText('Головна'));
    expect(handleHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Особистий кабінет'));
    expect(handleProfile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Додати улюбленця' }));
    expect(handleAddPet).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Записати на візит' }));
    expect(handleBook).toHaveBeenCalledWith('pet-1');

    fireEvent.click(screen.getByRole('button', { name: 'Рекомендації' }));
    expect(handleRecommendations).toHaveBeenCalledWith('pet-1');

    fireEvent.click(screen.getByRole('button', { name: 'Деталі графіка обробок' }));
    expect(handleSchedule).toHaveBeenCalledWith('pet-1');

    fireEvent.click(screen.getByRole('button', { name: 'Вся історія процедур' }));
    expect(handleHistory).toHaveBeenCalledWith('pet-1');
  });

  it('renders empty state when initialPets is empty and no pet is available', () => {
    const handleAddPet = vi.fn();
    render(
      <MemoryRouter initialEntries={['/pets']}>
        <PetDetailPage
          initialPets={[]}
          initialPetDetail={null}
          onAddPetClick={handleAddPet}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'У вас ще немає зареєстрованих улюбленців',
      })
    ).toBeDefined();

    const addBtns = screen.getAllByRole('button', { name: 'Додати улюбленця' });
    fireEvent.click(addBtns[0]);
    expect(handleAddPet).toHaveBeenCalled();
  });

  it('loads pet details, appointment history and media from Supabase when authenticated', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'usr-pet-100' },
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
                  full_name: 'Катерина',
                  avatar_url: null,
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
                      id: 'p-101',
                      name: 'Барон',
                      species: 'dog',
                      breed: 'Мальтіпу',
                      birth_date: '2024-03-01',
                      weight_kg: 4.5,
                      behavior_notes: 'Чутлива шкіра вух',
                      medical_notes: 'Алергія на курку',
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
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.count === 'exact') {
              return {
                eq: () => ({
                  neq: vi.fn().mockResolvedValue({ count: 8 }),
                }),
              };
            }
            return {
              eq: () => ({
                neq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: 'app-99',
                          starts_at: '2026-07-20T10:00:00Z',
                          price: 1450,
                          status: 'completed',
                          service: { name: 'СПА-комплекс' },
                          master: { display_name: 'Анна' },
                        },
                      }),
                    }),
                  }),
                }),
              }),
            };
          },
        } as never;
      }

      if (table === 'pet_media') {
        return {
          select: () => ({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'm-1',
                  storage_path: 'p-101/before.jpg',
                  photo_type: 'before',
                },
                {
                  id: 'm-2',
                  storage_path: 'p-101/after.jpg',
                  photo_type: 'after',
                },
              ],
            }),
          }),
        } as never;
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      } as never;
    });

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://storage.example.com/${path}` },
      }),
    } as never);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/pets/p-101']}>
          <PetDetailPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Барон' })).toBeDefined();
    const expectedSubtitle = formatPetSubtitle(
      'Мальтіпу',
      formatPetAge('2024-03-01'),
      4.5
    );
    expect(screen.getByText(expectedSubtitle)).toBeDefined();
    expect(screen.getByTestId('visits-badge').textContent).toBe('8 візитів');
    expect(screen.getByTestId('vip-badge')).toBeDefined();
    expect(screen.getByText('СПА-комплекс')).toBeDefined();
    expect(screen.getByText('1450 грн')).toBeDefined();
  });
});
