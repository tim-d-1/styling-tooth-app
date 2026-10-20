import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MainScreen } from './MainScreen';
import { supabase } from '../../lib/supabase';

describe('MainScreen (Головна)', () => {
  const mockVisit = {
    id: 'visit-123',
    startsAt: '2026-08-12T14:30:00.000Z',
    petName: 'Барон',
    serviceName: 'Комплексний грумінг',
    status: 'confirmed',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'client-uuid-1',
            email: 'maria@example.com',
          },
        },
      },
      error: null,
    });
    (supabase.from as any).mockImplementation((_table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }));
  });

  it('renders top bar, scheduled visit before banners, promo banners with backgrounds, and advice', () => {
    render(<MainScreen initialVisit={null} userEmail="maria@example.com" />);

    expect(screen.getByTestId('main-screen')).toBeInTheDocument();
    expect(screen.getByTestId('location-indicator')).toBeInTheDocument();
    expect(screen.getByText('м. Київ')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-button')).toBeInTheDocument();

    expect(screen.queryByTestId('quick-booking-button')).not.toBeInTheDocument();
    expect(screen.queryByText(/Привіт/i)).not.toBeInTheDocument();

    const emptyVisitCard = screen.getByTestId('empty-visit-card');
    const promoDiscountCard = screen.getByTestId('promo-discount-card');
    expect(emptyVisitCard).toBeInTheDocument();
    expect(promoDiscountCard).toBeInTheDocument();

    expect(
      Boolean(emptyVisitCard.compareDocumentPosition(promoDiscountCard) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true);

    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.getByText('НА ПЕРШИЙ ГРУМІНГ')).toBeInTheDocument();
    expect(screen.getByTestId('promo-detail-button')).toBeInTheDocument();

    expect(screen.getByTestId('promo-seasonal-card')).toBeInTheDocument();
    expect(screen.getByText('Безкоштовне')).toBeInTheDocument();
    expect(
      screen.getByText('підстригання кігтів при комплексному грумінгу')
    ).toBeInTheDocument();

    expect(screen.getByTestId('promo-weekday-card')).toBeInTheDocument();
    expect(screen.getByText('-20%')).toBeInTheDocument();
    expect(screen.getByText('на комплексний грумінг у будні')).toBeInTheDocument();

    expect(screen.getByTestId('advice-card-shampoo')).toBeInTheDocument();
    expect(screen.getByTestId('advice-card-paws')).toBeInTheDocument();

    expect(screen.getByTestId('bottom-tabbar')).toBeInTheDocument();
    expect(screen.getByTestId('tab-home')).toBeInTheDocument();
    expect(screen.getByTestId('tab-booking')).toBeInTheDocument();
    expect(screen.getByTestId('tab-pets')).toBeInTheDocument();
    expect(screen.getByTestId('tab-profile')).toBeInTheDocument();
  });

  it('renders scheduled visit card before promo banners when visit exists', () => {
    render(<MainScreen initialVisit={mockVisit} />);

    const visitCard = screen.getByTestId('visit-card');
    const promoCard = screen.getByTestId('promo-discount-card');

    expect(visitCard).toBeInTheDocument();
    expect(promoCard).toBeInTheDocument();
    expect(
      Boolean(visitCard.compareDocumentPosition(promoCard) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true);

    expect(screen.getByTestId('visit-date-badge')).toBeInTheDocument();
    expect(screen.getByText('Тваринка: Барон')).toBeInTheDocument();
    expect(screen.getByText('Комплексний грумінг')).toBeInTheDocument();
    expect(screen.getByTestId('reschedule-visit-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-visit-button')).toBeInTheDocument();
  });

  it('cancels scheduled visit when cancel button is clicked', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'appointments') {
        return {
          update: mockUpdate,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<MainScreen initialVisit={mockVisit} />);

    fireEvent.click(screen.getByTestId('cancel-visit-button'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('appointments');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' });
    });
  });

  it('switches between tabbar views', () => {
    render(<MainScreen initialVisit={null} userEmail="maria@example.com" />);

    fireEvent.click(screen.getByTestId('tab-pets'));
    expect(screen.getByTestId('pets-tab-content')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tab-booking'));
    expect(screen.getByTestId('booking-tab-content')).toBeInTheDocument();
    expect(screen.getByTestId('quick-schedule-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('quick-book-button'));
    expect(screen.getByTestId('booking-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tab-profile'));
    expect(screen.getByTestId('profile-tab-content')).toBeInTheDocument();
  });

  it('calls onLogout when logout button is pressed in profile tab', () => {
    const onLogout = vi.fn();
    render(<MainScreen initialVisit={null} onLogout={onLogout} userEmail="maria@example.com" />);

    fireEvent.click(screen.getByTestId('tab-profile'));
    fireEvent.click(screen.getByTestId('logout-button'));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders shampoo advice card with concentrated linear gradient overlay', () => {
    render(<MainScreen initialVisit={null} userEmail="maria@example.com" />);

    const gradient = screen.getByTestId('advice-shampoo-gradient');
    expect(gradient).toBeInTheDocument();
  });

  it('renders pets tab in dedicated container outside outer ScrollView to avoid nested scrolling and double padding', () => {
    render(<MainScreen initialVisit={null} userEmail="maria@example.com" />);

    fireEvent.click(screen.getByTestId('tab-pets'));
    expect(screen.getByTestId('pets-tab-container')).toBeInTheDocument();
    expect(screen.getByTestId('pets-tab-content')).toBeInTheDocument();
  });

  it('renders profile tab in dedicated container outside outer ScrollView', () => {
    render(<MainScreen initialVisit={null} userEmail="maria@example.com" />);

    fireEvent.click(screen.getByTestId('tab-profile'));
    expect(screen.getByTestId('profile-tab-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('profile-tab-content')).toBeInTheDocument();
  });

  it('loads upcoming appointment from database with explicit foreign key relation and displays visit details', async () => {
    const mockDbVisit = {
      id: 'db-visit-1',
      starts_at: '2026-10-10T11:00:00.000Z',
      status: 'confirmed',
      pet: { name: 'Чарлі' },
      service: { name: 'Стрижка кота' },
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'appointments') {
        return {
          select: vi.fn().mockImplementation((queryStr: string) => {
            expect(queryStr).toContain('service:services!appointments_service_id_fkey(name)');
            return {
              eq: vi.fn().mockReturnThis(),
              neq: vi.fn().mockReturnThis(),
              gte: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: mockDbVisit, error: null }),
            };
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<MainScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('visit-card')).toBeInTheDocument();
      expect(screen.getByText('Тваринка: Чарлі')).toBeInTheDocument();
      expect(screen.getByText('Стрижка кота')).toBeInTheDocument();
    });
  });

  it('opens corresponding promo info page when promo cards are clicked', () => {
    const onPromoClick = vi.fn();
    render(<MainScreen initialVisit={null} onPromoClick={onPromoClick} />);

    fireEvent.click(screen.getByTestId('promo-detail-button'));
    expect(onPromoClick).toHaveBeenCalledWith('first-grooming');
    expect(screen.getByTestId('home-promo-detail-container')).toBeInTheDocument();
    expect(screen.getByTestId('promo-detail-screen')).toBeInTheDocument();
    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.getByText('на перший грумінг')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('promo-detail-back-button'));
    expect(screen.queryByTestId('promo-detail-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('promo-discount-card')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('promo-seasonal-card'));
    expect(onPromoClick).toHaveBeenCalledWith('free-nail-trimming');
    expect(screen.getByTestId('promo-detail-screen')).toBeInTheDocument();
    expect(
      screen.getByText('підстригання кігтів при комплексному грумінгу')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('promo-detail-back-button'));
    expect(screen.queryByTestId('promo-detail-screen')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('promo-weekday-card'));
    expect(onPromoClick).toHaveBeenCalledWith('weekday-grooming');
    expect(screen.getByTestId('promo-detail-screen')).toBeInTheDocument();
    expect(screen.getByText('-20%')).toBeInTheDocument();
    expect(screen.getByText('на комплексний грумінг у будні')).toBeInTheDocument();
  });

  it('navigates from promo detail to booking when quick book button is clicked', () => {
    render(<MainScreen initialVisit={null} />);

    fireEvent.click(screen.getByTestId('promo-seasonal-card'));
    expect(screen.getByTestId('promo-detail-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('promo-quick-book-button'));
    expect(screen.queryByTestId('promo-detail-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('booking-tab-content')).toBeInTheDocument();
  });

  it('opens corresponding article info page when expert advice cards are clicked', () => {
    const onArticleClick = vi.fn();
    render(<MainScreen initialVisit={null} onArticleClick={onArticleClick} />);

    fireEvent.click(screen.getByTestId('advice-card-shampoo'));
    expect(onArticleClick).toHaveBeenCalledWith('shampoo-guide');
    expect(screen.getByTestId('home-article-detail-container')).toBeInTheDocument();
    expect(screen.getByTestId('article-detail-screen')).toBeInTheDocument();
    expect(screen.getByText('Як обрати правильний шампунь?')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('article-detail-back-button'));
    expect(screen.queryByTestId('article-detail-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('advice-card-shampoo')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('advice-card-paws'));
    expect(onArticleClick).toHaveBeenCalledWith('paws-care');
    expect(screen.getByTestId('article-detail-screen')).toBeInTheDocument();
    expect(screen.getByText('5 порад для здорових лап')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('article-detail-back-button'));
    expect(screen.queryByTestId('article-detail-screen')).not.toBeInTheDocument();
  });
});
