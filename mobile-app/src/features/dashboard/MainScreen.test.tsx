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
  });

  it('renders top bar, quick booking CTA, promo banners, and advice matching frame 211:1755', () => {
    render(<MainScreen initialVisit={null} userEmail="maria@example.com" />);

    expect(screen.getByTestId('main-screen')).toBeInTheDocument();
    expect(screen.getByTestId('location-indicator')).toBeInTheDocument();
    expect(screen.getByText('м. Київ')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-button')).toBeInTheDocument();
    expect(screen.getByTestId('quick-booking-button')).toBeInTheDocument();

    expect(screen.getByTestId('empty-visit-card')).toBeInTheDocument();
    expect(screen.getByText('Немає запланованих візитів')).toBeInTheDocument();

    expect(screen.getByTestId('promo-discount-card')).toBeInTheDocument();
    expect(screen.getByTestId('promo-seasonal-card')).toBeInTheDocument();
    expect(screen.getByTestId('advice-card-shampoo')).toBeInTheDocument();
    expect(screen.getByTestId('advice-card-paws')).toBeInTheDocument();

    expect(screen.getByTestId('bottom-tabbar')).toBeInTheDocument();
    expect(screen.getByTestId('tab-home')).toBeInTheDocument();
    expect(screen.getByTestId('tab-booking')).toBeInTheDocument();
    expect(screen.getByTestId('tab-pets')).toBeInTheDocument();
    expect(screen.getByTestId('tab-profile')).toBeInTheDocument();
  });

  it('renders visit details and action buttons when visit exists', () => {
    render(<MainScreen initialVisit={mockVisit} />);

    expect(screen.getByTestId('visit-card')).toBeInTheDocument();
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
    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
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
});
