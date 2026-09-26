import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import LoyaltyProgramPage from './LoyaltyProgramPage';
import type { LoyaltyProgramData } from './profile_types';
import { supabase } from '@/lib/supabase';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockLoyaltyData: LoyaltyProgramData = {
  balancePoints: 500,
  discountUah: 125,
  tierName: 'Gold Level • 25% Cashback',
  nextTierName: 'До Platinum рівня',
  currentSpendUah: 7000,
  nextTierSpendUah: 8000,
  totalEarnedPoints: 2000,
  totalSpentPoints: 1500,
  privileges: [
    '25% кешбеку з кожної послуги',
    'Пріоритетний запис до топ-майстрів',
    'Безкоштовна спа-маска при комплексному грумінгу',
  ],
  transactions: [
    {
      id: 'tx-1',
      title: 'Комплексний грумінг',
      dateFormatted: '18 Липня 2026',
      points: 250,
      iconName: 'fi-rr-barber-shop',
    },
    {
      id: 'tx-2',
      title: 'Спа процедура',
      dateFormatted: '02 Липня 2026',
      points: -300,
      iconName: 'fi-rr-spa',
    },
  ],
};

describe('LoyaltyProgramPage', () => {
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
            user_metadata: { full_name: 'Ольга Іваненко' },
          },
        },
      },
      error: null,
    } as never);

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              full_name: 'Ольга Іваненко',
              avatar_url: 'https://example.com/avatar.jpg',
            },
          }),
        }),
      }),
    } as never);
  });

  it('renders breadcrumbs and triggers navigation callbacks', async () => {
    const handleHome = vi.fn();
    const handleProfile = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <LoyaltyProgramPage
            onHomeClick={handleHome}
            onProfileClick={handleProfile}
          />
        </MemoryRouter>
      );
    });

    const homeBtn = screen.getByRole('button', { name: 'Головна' });
    fireEvent.click(homeBtn);
    expect(handleHome).toHaveBeenCalledTimes(1);

    const profileBtn = screen.getByRole('button', { name: 'Особистий кабінет' });
    fireEvent.click(profileBtn);
    expect(handleProfile).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('heading', { level: 1, name: 'Програма лояльності' })).toBeDefined();
    expect(screen.getByText(/1 бонусний бал = 0\.25 гривень/)).toBeDefined();
  });

  it('falls back to navigate when navigation callbacks are omitted', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LoyaltyProgramPage />
        </MemoryRouter>
      );
    });

    const homeBtn = screen.getByRole('button', { name: 'Головна' });
    fireEvent.click(homeBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/main');

    const profileBtn = screen.getByRole('button', { name: 'Особистий кабінет' });
    fireEvent.click(profileBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('renders hero card with balance, discount calculation, tier, and progress', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LoyaltyProgramPage initialData={mockLoyaltyData} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Ваш бонусний баланс:')).toBeDefined();
    expect(screen.getByText('500')).toBeDefined();
    expect(
      screen.getByText('= 125 грн знижки на наступний візит або купівлю товарів')
    ).toBeDefined();
    expect(screen.getByText('Gold Level • 25% Cashback')).toBeDefined();
    expect(screen.getByText('До Platinum рівня')).toBeDefined();
    expect(screen.getByText('7000/8000 грн')).toBeDefined();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.getAttribute('aria-valuenow')).toBe('7000');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('8000');
  });

  it('renders total earned and total spent statistics cards', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LoyaltyProgramPage initialData={mockLoyaltyData} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Нараховано за весь час:')).toBeDefined();
    expect(screen.getByText('+2 000')).toBeDefined();
    expect(screen.getByText('Витрачено:')).toBeDefined();
    expect(screen.getByText('-1 500')).toBeDefined();
  });

  it('renders privileges list correctly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LoyaltyProgramPage initialData={mockLoyaltyData} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Привілегії Gold Level 👑')).toBeDefined();
    expect(screen.getByText('25% кешбеку з кожної послуги')).toBeDefined();
    expect(screen.getByText('Пріоритетний запис до топ-майстрів')).toBeDefined();
    expect(screen.getByText('Безкоштовна спа-маска при комплексному грумінгу')).toBeDefined();
  });

  it('filters transactions when switching between tabs', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LoyaltyProgramPage initialData={mockLoyaltyData} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Комплексний грумінг')).toBeDefined();
    expect(screen.getByText('Спа процедура')).toBeDefined();

    const earnedTab = screen.getByRole('tab', { name: 'Нараховано' });
    fireEvent.click(earnedTab);
    expect(screen.getByText('Комплексний грумінг')).toBeDefined();
    expect(screen.queryByText('Спа процедура')).toBeNull();

    const spentTab = screen.getByRole('tab', { name: 'Витрачено' });
    fireEvent.click(spentTab);
    expect(screen.queryByText('Комплексний грумінг')).toBeNull();
    expect(screen.getByText('Спа процедура')).toBeDefined();

    const allTab = screen.getByRole('tab', { name: 'Всі' });
    fireEvent.click(allTab);
    expect(screen.getByText('Комплексний грумінг')).toBeDefined();
    expect(screen.getByText('Спа процедура')).toBeDefined();
  });

  it('renders empty state when there are no transactions matching the filter', async () => {
    const dataWithoutSpent: LoyaltyProgramData = {
      ...mockLoyaltyData,
      transactions: [
        {
          id: 'tx-1',
          title: 'Комплексний грумінг',
          dateFormatted: '18 Липня 2026',
          points: 250,
          iconName: 'fi-rr-barber-shop',
        },
      ],
    };

    await act(async () => {
      render(
        <MemoryRouter>
          <LoyaltyProgramPage initialData={dataWithoutSpent} />
        </MemoryRouter>
      );
    });

    const spentTab = screen.getByRole('tab', { name: 'Витрачено' });
    fireEvent.click(spentTab);

    expect(screen.getByTestId('no-transactions')).toBeDefined();
    expect(screen.getByText('Немає транзакцій у цій категорії')).toBeDefined();
  });

  it('triggers toast notifications for header actions', async () => {
    const handleToast = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <LoyaltyProgramPage onToast={handleToast} />
        </MemoryRouter>
      );
    });

    const deviceBtn = screen.getByRole('button', { name: 'Завантажити мобільний застосунок' });
    fireEvent.click(deviceBtn);
    expect(handleToast).toHaveBeenCalledWith('Завантажити додаток');

    const notificationBtn = screen.getByRole('button', { name: 'Сповіщення' });
    fireEvent.click(notificationBtn);
    expect(handleToast).toHaveBeenCalledWith('Немає нових сповіщень');
  });

  it('renders default transactions when initialData is not provided', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LoyaltyProgramPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('450')).toBeDefined();
    expect(screen.getByText('+1 700')).toBeDefined();
    expect(screen.getByText('-1 250')).toBeDefined();
    expect(screen.getByText('Комплексний грумінг (Мальтипу)')).toBeDefined();
    expect(screen.getByText('Озонова ванна + Масаж')).toBeDefined();
  });
});
