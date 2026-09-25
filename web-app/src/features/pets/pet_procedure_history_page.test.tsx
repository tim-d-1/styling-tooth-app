import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PetProcedureHistoryPage from './PetProcedureHistoryPage';
import { supabase } from '@/lib/supabase';
import type { PetProcedureHistory, ProcedureHistorySummary } from './pet_types';

describe('PetProcedureHistoryPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-kate-1',
            email: 'kate@example.com',
            user_metadata: {
              full_name: 'Катерина',
              avatar_url: null,
            },
          },
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
                  avatar_url: 'https://images.example.com/avatar.webp',
                },
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

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://storage.example.com/${path}` },
      }),
    } as never);
  });

  it('renders breadcrumbs and triggers navigation callbacks', async () => {
    const handleHome = vi.fn();
    const handleProfile = vi.fn();
    const handlePets = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <PetProcedureHistoryPage
            onHomeClick={handleHome}
            onProfileClick={handleProfile}
            onPetsClick={handlePets}
          />
        </MemoryRouter>
      );
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Історія процедур' })
    ).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Головна' }));
    expect(handleHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Особистий кабінет' }));
    expect(handleProfile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Мої улюбленці' }));
    expect(handlePets).toHaveBeenCalledTimes(1);
  });

  it('renders procedure cards with rating and status badges', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <PetProcedureHistoryPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('СПА-комплекс + Гігієнічна стрижка')).toBeDefined();
    expect(screen.getByText('Експрес-лінька & Догляд за кігтями')).toBeDefined();
    expect(screen.getByTestId('procedure-rating-badge')).toBeDefined();
    expect(screen.getByTestId('procedure-status-badge')).toBeDefined();
    expect(screen.getByText('Показано 2 візити')).toBeDefined();
  });

  it('filters procedures by search input', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <PetProcedureHistoryPage />
        </MemoryRouter>
      );
    });

    const searchInput = screen.getByPlaceholderText('Пошук запитання або послуги...');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Експрес' } });
    });

    expect(screen.getByText('Експрес-лінька & Догляд за кігтями')).toBeDefined();
    expect(screen.queryByText('СПА-комплекс + Гігієнічна стрижка')).toBeNull();
    expect(screen.getByText('Показано 1 візит')).toBeDefined();

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'невідома процедура' } });
    });

    expect(screen.getByTestId('empty-procedure-search')).toBeDefined();
    expect(screen.getByText('Процедур не знайдено')).toBeDefined();
    expect(screen.getByText('Показано 0 візитів')).toBeDefined();
  });

  it('filters procedures by category tabs', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <PetProcedureHistoryPage />
        </MemoryRouter>
      );
    });

    const groomingTab = screen.getByRole('tab', { name: '✂️ Грумінг' });
    await act(async () => {
      fireEvent.click(groomingTab);
    });

    expect(screen.getByText('Експрес-лінька & Догляд за кігтями')).toBeDefined();

    const transferTab = screen.getByRole('tab', { name: '🚗 Pet-трансфер' });
    await act(async () => {
      fireEvent.click(transferTab);
    });

    expect(screen.getByTestId('empty-procedure-search')).toBeDefined();

    const allTab = screen.getByRole('tab', { name: 'Всі запитання' });
    await act(async () => {
      fireEvent.click(allTab);
    });

    expect(screen.getByText('СПА-комплекс + Гігієнічна стрижка')).toBeDefined();
    expect(screen.getByText('Експрес-лінька & Догляд за кігтями')).toBeDefined();
  });

  it('sorts procedures using sort dropdown', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <PetProcedureHistoryPage />
        </MemoryRouter>
      );
    });

    const sortButton = screen.getByRole('button', { name: 'Вибрати сортування візитів' });
    await act(async () => {
      fireEvent.click(sortButton);
    });

    expect(screen.getByRole('listbox')).toBeDefined();

    const priceAscOption = screen.getByRole('option', { name: 'За вартістю (зрост.)' });
    await act(async () => {
      fireEvent.click(priceAscOption);
    });

    const articles = screen.getAllByRole('article');
    expect(articles[0].textContent).toContain('Експрес-лінька & Догляд за кігтями');
    expect(articles[1].textContent).toContain('СПА-комплекс + Гігієнічна стрижка');
  });

  it('renders summary card with custom summary data', async () => {
    const customSummary: ProcedureHistorySummary = {
      year: 2026,
      totalProcedures: 15,
      favoriteMaster: 'Оксана П.',
    };

    await act(async () => {
      render(
        <MemoryRouter>
          <PetProcedureHistoryPage initialSummary={customSummary} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Підсумок за 2026 рік')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getByText('Оксана П.')).toBeDefined();
  });

  it('handles repeat visit button click', async () => {
    const handleRepeat = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <PetProcedureHistoryPage onRepeatVisitClick={handleRepeat} />
        </MemoryRouter>
      );
    });

    const repeatButtons = screen.getAllByRole('button', { name: 'Повторити візит' });
    await act(async () => {
      fireEvent.click(repeatButtons[0]);
    });

    expect(handleRepeat).toHaveBeenCalledTimes(1);
    expect(handleRepeat).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'proc-1',
        serviceTitle: 'СПА-комплекс + Гігієнічна стрижка',
      })
    );
  });

  it('renders single result photo and split before/after photo layouts', async () => {
    const customItems: PetProcedureHistory[] = [
      {
        id: 'single-photo-item',
        serviceTitle: 'Стрижка кота',
        price: 800,
        dateFormatted: '1 Серпня 2026',
        masterName: 'Карина',
        tags: ['Кіт', 'Стрижка'],
        resultPhotoUrl: 'https://images.example.com/cat-result.webp',
      },
      {
        id: 'split-photo-item',
        serviceTitle: 'Стрижка шпіца',
        price: 1100,
        dateFormatted: '5 Серпня 2026',
        masterName: 'Ірина',
        tags: ['Шпіц'],
        beforePhotoUrl: 'https://images.example.com/spitz-before.webp',
        afterPhotoUrl: 'https://images.example.com/spitz-after.webp',
      },
    ];

    await act(async () => {
      render(
        <MemoryRouter>
          <PetProcedureHistoryPage initialProcedures={customItems} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Результат ✨')).toBeDefined();
    expect(screen.getByText('До 🐾')).toBeDefined();
    expect(screen.getByText('Після ✨')).toBeDefined();
  });

  it('loads user profile data on mount and updates header', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <PetProcedureHistoryPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByAltText('Катерина')).toBeDefined();
  });
});
