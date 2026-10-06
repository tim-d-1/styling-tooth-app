import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QuickScheduleScreen } from './QuickScheduleScreen';
import { supabase } from '../../lib/supabase';
import { formatVisitDateDetails } from '../dashboard/dashboard_utils';

describe('QuickScheduleScreen (Figma 121:1236 / QuickSchedulePage mobile)', () => {
  const mockVisit = {
    id: 'visit-101',
    startsAt: '2026-08-10T16:00:00.000Z',
    masterName: 'Марія Шевченко',
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
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }));
  });

  it('renders header, heading, banner, and quick booking CTA in empty state', () => {
    const onNavigateBooking = vi.fn();
    render(
      <QuickScheduleScreen
        initialVisit={null}
        onNavigateBooking={onNavigateBooking}
      />
    );

    expect(screen.getByTestId('quick-schedule-screen')).toBeInTheDocument();
    expect(screen.getByTestId('location-indicator')).toBeInTheDocument();
    expect(screen.getByText('м. Київ')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-button')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-heading')).toHaveTextContent('Запланований візит');

    expect(screen.getByTestId('empty-visit-card')).toBeInTheDocument();
    expect(screen.getByText('Немає запланованих візитів')).toBeInTheDocument();

    const emptyBookBtn = screen.getByTestId('empty-book-button');
    expect(emptyBookBtn).toBeInTheDocument();
    fireEvent.click(emptyBookBtn);
    expect(onNavigateBooking).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId('quick-schedule-banner')).toBeInTheDocument();
    expect(screen.getByTestId('quick-schedule-banner-text')).toBeInTheDocument();

    const quickBookBtn = screen.getByTestId('quick-book-button');
    expect(quickBookBtn).toBeInTheDocument();
    expect(quickBookBtn).toHaveTextContent('Швидкий запис');
    fireEvent.click(quickBookBtn);
    expect(onNavigateBooking).toHaveBeenCalledTimes(2);
  });

  it('renders scheduled visit card with master, procedure, date badge, and actions', () => {
    const onNavigateBooking = vi.fn();
    render(
      <QuickScheduleScreen
        initialVisit={mockVisit}
        onNavigateBooking={onNavigateBooking}
      />
    );

    const dateDetails = formatVisitDateDetails(mockVisit.startsAt)!;
    expect(screen.getByTestId('visit-card')).toBeInTheDocument();
    expect(screen.getByTestId('visit-date-badge')).toBeInTheDocument();
    expect(screen.getByText(dateDetails.dayNumber)).toBeInTheDocument();
    expect(screen.getByText(dateDetails.time)).toBeInTheDocument();
    expect(screen.getByText('Марія Шевченко')).toBeInTheDocument();
    expect(screen.getByText('Комплексний грумінг')).toBeInTheDocument();

    const rescheduleBtn = screen.getByTestId('reschedule-visit-button');
    expect(rescheduleBtn).toHaveTextContent('Перенести');
    fireEvent.click(rescheduleBtn);
    expect(onNavigateBooking).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId('cancel-visit-button')).toHaveTextContent('Скасувати');
  });

  it('cancels scheduled visit via custom callback and updates state', async () => {
    const onCancelVisit = vi.fn().mockResolvedValue(undefined);
    render(
      <QuickScheduleScreen
        initialVisit={mockVisit}
        onCancelVisit={onCancelVisit}
      />
    );

    fireEvent.click(screen.getByTestId('cancel-visit-button'));

    await waitFor(() => {
      expect(onCancelVisit).toHaveBeenCalledWith('visit-101');
      expect(screen.queryByTestId('visit-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('empty-visit-card')).toBeInTheDocument();
    });
  });

  it('loads upcoming visit asynchronously from supabase when initialVisit is undefined', async () => {
    const mockDbVisit = {
      id: 'db-visit-99',
      starts_at: '2026-08-10T16:00:00.000Z',
      status: 'confirmed',
      master: { display_name: 'Марія Шевченко' },
      service: { name: 'Комплексний грумінг' },
      pet: { name: 'Арчі' },
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockDbVisit, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<QuickScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('visit-card')).toBeInTheDocument();
      expect(screen.getByText('Марія Шевченко')).toBeInTheDocument();
      expect(screen.getByText('Комплексний грумінг')).toBeInTheDocument();
      expect(screen.getByText('Тваринка: Арчі')).toBeInTheDocument();
    });
  });
});
