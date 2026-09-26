import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfileUpcomingVisitsPage from './ProfileUpcomingVisitsPage';
import type { UpcomingVisitData, ProfilePet } from './profile_types';
import { supabase } from '@/lib/supabase';

const mockPets: ProfilePet[] = [
  {
    id: 'pet-1',
    name: 'Барон',
    species: 'dog',
    breed: 'Лабрадор',
    avatarUrl: null,
  },
  {
    id: 'pet-2',
    name: 'Міа',
    species: 'cat',
    breed: 'Британська',
    avatarUrl: null,
  },
];

const mockVisits: UpcomingVisitData[] = [
  {
    id: 'v1',
    petId: 'pet-1',
    petName: 'Барон',
    petAvatarUrl: null,
    serviceTitle: 'Комплексний грумінг & СПА',
    masterName: 'Олена М.',
    price: 1200,
    scheduledAtFormatted: 'Субота, 22 Серпня • 14:00',
    startsAt: '2026-08-22T14:00:00.000Z',
  },
  {
    id: 'v2',
    petId: 'pet-2',
    petName: 'Міа',
    petAvatarUrl: null,
    serviceTitle: 'Гігієнічна стрижка кота',
    masterName: 'Анна К.',
    price: 850,
    scheduledAtFormatted: 'Вівторок, 25 Серпня • 11:30',
    startsAt: '2026-08-25T11:30:00.000Z',
  },
];

describe('ProfileUpcomingVisitsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-1', email: 'owner@example.com' },
        },
      },
      error: null,
    } as never);
  });

  it('renders breadcrumbs and triggers navigation callbacks', () => {
    const handleHome = vi.fn();
    const handleProfile = vi.fn();

    render(
      <MemoryRouter>
        <ProfileUpcomingVisitsPage
          initialVisits={mockVisits}
          initialPets={mockPets}
          onHomeClick={handleHome}
          onProfileClick={handleProfile}
        />
      </MemoryRouter>
    );

    const homeButtons = screen.getAllByRole('button', { name: 'Головна' });
    fireEvent.click(homeButtons[0]);
    expect(handleHome).toHaveBeenCalledTimes(1);

    const profileButtons = screen.getAllByRole('button', { name: 'Особистий кабінет' });
    fireEvent.click(profileButtons[0]);
    expect(handleProfile).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Заплановані візити' })
    ).toBeDefined();
  });

  it('renders visits list and summary statistics', () => {
    render(
      <MemoryRouter>
        <ProfileUpcomingVisitsPage
          initialVisits={mockVisits}
          initialPets={mockPets}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Показано 2 заплановані візити')).toBeDefined();
    expect(screen.getByTestId('upcoming-visit-item-v1')).toBeDefined();
    expect(screen.getByTestId('upcoming-visit-item-v2')).toBeDefined();
    expect(screen.getByText('Комплексний грумінг & СПА')).toBeDefined();
    expect(screen.getByText('Гігієнічна стрижка кота')).toBeDefined();
    expect(screen.getByText('1 200 грн')).toBeDefined();
    expect(screen.getByText('850 грн')).toBeDefined();

    expect(screen.getByText('Заплановано візитів:')).toBeDefined();
    expect(screen.getAllByText('Субота, 22 Серпня • 14:00').length).toBe(2);
  });

  it('filters visits by selected pet tab', () => {
    render(
      <MemoryRouter>
        <ProfileUpcomingVisitsPage
          initialVisits={mockVisits}
          initialPets={mockPets}
        />
      </MemoryRouter>
    );

    const miaTab = screen.getByRole('tab', { name: /Міа/i });
    fireEvent.click(miaTab);

    expect(screen.getByText('Показано 1 запланований візит')).toBeDefined();
    expect(screen.getByTestId('upcoming-visit-item-v2')).toBeDefined();
    expect(screen.queryByTestId('upcoming-visit-item-v1')).toBeNull();

    const allTab = screen.getByRole('tab', { name: /Всі улюбленці/i });
    fireEvent.click(allTab);

    expect(screen.getByText('Показано 2 заплановані візити')).toBeDefined();
    expect(screen.getByTestId('upcoming-visit-item-v1')).toBeDefined();
    expect(screen.getByTestId('upcoming-visit-item-v2')).toBeDefined();
  });

  it('filters visits by search query for service and master', () => {
    render(
      <MemoryRouter>
        <ProfileUpcomingVisitsPage
          initialVisits={mockVisits}
          initialPets={mockPets}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Пошук послуги, майстра...');
    fireEvent.change(searchInput, { target: { value: 'Анна' } });

    expect(screen.getByText('Показано 1 запланований візит')).toBeDefined();
    expect(screen.getByTestId('upcoming-visit-item-v2')).toBeDefined();
    expect(screen.queryByTestId('upcoming-visit-item-v1')).toBeNull();

    fireEvent.change(searchInput, { target: { value: 'неіснуюча послуга' } });
    expect(screen.getByText('Показано 0 запланованих візитів')).toBeDefined();
    expect(screen.getByTestId('no-upcoming-visits')).toBeDefined();
  });

  it('sorts visits by date order', () => {
    render(
      <MemoryRouter>
        <ProfileUpcomingVisitsPage
          initialVisits={mockVisits}
          initialPets={mockPets}
        />
      </MemoryRouter>
    );

    const sortButton = screen.getByLabelText('Вибрати сортування візитів');
    fireEvent.click(sortButton);

    const latestOption = screen.getByRole('option', { name: 'Спочатку пізніші' });
    fireEvent.click(latestOption);

    const visitCards = screen.getAllByTestId(/upcoming-visit-item-/);
    expect(visitCards[0].getAttribute('data-testid')).toBe('upcoming-visit-item-v2');
    expect(visitCards[1].getAttribute('data-testid')).toBe('upcoming-visit-item-v1');
  });

  it('handles appointment cancellation via callback and toast', async () => {
    const handleCancel = vi.fn().mockResolvedValue(undefined);
    const handleToast = vi.fn();

    render(
      <MemoryRouter>
        <ProfileUpcomingVisitsPage
          initialVisits={mockVisits}
          initialPets={mockPets}
          onCancelVisit={handleCancel}
          onToast={handleToast}
        />
      </MemoryRouter>
    );

    const cancelButtons = screen.getAllByRole('button', { name: 'Скасувати' });
    await act(async () => {
      fireEvent.click(cancelButtons[0]);
    });

    expect(handleCancel).toHaveBeenCalledWith('v1');
    expect(handleToast).toHaveBeenCalledWith('Візит успішно скасовано');
    expect(screen.queryByText('Комплексний грумінг & СПА')).toBeNull();
  });

  it('triggers reschedule callback when reschedule button is clicked', () => {
    const handleReschedule = vi.fn();

    render(
      <MemoryRouter>
        <ProfileUpcomingVisitsPage
          initialVisits={mockVisits}
          initialPets={mockPets}
          onRescheduleClick={handleReschedule}
        />
      </MemoryRouter>
    );

    const rescheduleButtons = screen.getAllByRole('button', { name: 'Перенести' });
    fireEvent.click(rescheduleButtons[0]);

    expect(handleReschedule).toHaveBeenCalledWith(mockVisits[0]);
  });

  it('renders empty state when no upcoming visits are scheduled', () => {
    const handleBook = vi.fn();

    render(
      <MemoryRouter>
        <ProfileUpcomingVisitsPage
          initialVisits={[]}
          initialPets={mockPets}
          onBookClick={handleBook}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('no-upcoming-visits')).toBeDefined();
    expect(screen.getByText('Немає запланованих візитів')).toBeDefined();

    const bookButton = screen.getByRole('button', { name: 'Записатися на прийом' });
    fireEvent.click(bookButton);
    expect(handleBook).toHaveBeenCalledTimes(1);
  });

  it('loads profile, pets, and upcoming appointments from Supabase on mount', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'usr-999', user_metadata: { full_name: 'Олена' } },
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
                data: { full_name: 'Олена', avatar_url: null },
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
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'app-db-1',
                        pet_id: 'pet-db-1',
                        starts_at: '2026-10-15T14:00:00Z',
                        price: 1500,
                        status: 'confirmed',
                        pet: { id: 'pet-db-1', name: 'Рекс', species: 'dog' },
                        master: { display_name: 'Іван Т.' },
                        service: { name: 'Повний комплекс' },
                      },
                    ],
                  }),
                }),
              }),
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

    await act(async () => {
      render(
        <MemoryRouter>
          <ProfileUpcomingVisitsPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Показано 1 запланований візит')).toBeDefined();
    expect(screen.getByTestId('upcoming-visit-item-app-db-1')).toBeDefined();
    expect(screen.getByText('Повний комплекс')).toBeDefined();
    expect(screen.getByText('Майстер: Іван Т.')).toBeDefined();
    expect(screen.getByText('1 500 грн')).toBeDefined();
  });
});
