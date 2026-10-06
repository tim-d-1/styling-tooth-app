import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BookingScreen } from '../features/booking/BookingScreen';
import {
  PROCEDURES_CATALOG,
  DEMO_PETS,
  TIME_SLOTS,
} from '../features/booking/booking_types';
import {
  getKyivISOString,
  getInitialBookingDate,
} from '../features/booking/booking_date_utils';
import { supabase } from '../lib/supabase';
import { MainScreen } from '../features/dashboard/MainScreen';
import { formatVisitDateDetails } from '../features/dashboard/dashboard_utils';

describe('Mobile Booking Parity Eval Suite', () => {
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
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null, data: [{ id: 'appt-1' }] }),
    }));
  });

  it('Eval 1: Procedures Catalog Parity with Web App', () => {
    expect(PROCEDURES_CATALOG.length).toBe(7);
    const ids = PROCEDURES_CATALOG.map((p) => p.id);
    expect(ids).toEqual([
      'express-grooming',
      'spa-complex',
      'ozone-therapy',
      'hygiene-care',
      'combing',
      'breed-haircut',
      'nail-trimming',
    ]);

    PROCEDURES_CATALOG.forEach((proc) => {
      expect(proc.price).toBeGreaterThan(0);
      expect(proc.durationMin).toBeGreaterThan(0);
      expect(proc.priceFormatted).toContain('₴');
      expect(proc.description.length).toBeGreaterThan(10);
    });
  });

  it('Eval 2: Time Slots and Kyiv Timezone ISO String Generation', () => {
    expect(TIME_SLOTS).toEqual([
      '12:00',
      '14:20',
      '15:10',
      '16:00',
      '16:40',
      '17:50',
      '18:30',
    ]);

    const iso = getKyivISOString('2026-08-11', '16:00');
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    const initial = getInitialBookingDate(new Date('2026-08-11T12:00:00Z'));
    expect(initial.date).toBe('2026-08-11');
    expect(initial.dateFormatted).toBe('11.08.2026');
  });

  it('Eval 3: Dynamic Price Calculation with Transfer Add-on', async () => {
    render(<BookingScreen initialStage="confirmation" initialPets={DEMO_PETS} />);

    expect(screen.getAllByText('850 ₴').length).toBe(2);
    expect(screen.getByText('Не замовлено')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-transfer-button'));
    expect(screen.getByTestId('step-remarks')).toBeInTheDocument();

    const transferSwitch = screen.getByTestId('transfer-switch');
    fireEvent.click(transferSwitch);
    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-confirmation')).toBeInTheDocument();
    expect(screen.getByText('100 ₴')).toBeInTheDocument();
    expect(screen.getByText('950 ₴')).toBeInTheDocument();
  });

  it('Eval 4: MainScreen Tab Navigation Integration into Booking Tab', () => {
    render(<MainScreen initialVisit={null} userEmail="maria@example.com" />);

    expect(screen.getByTestId('tab-booking')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tab-booking'));

    expect(screen.getByTestId('booking-tab-content')).toBeInTheDocument();
    expect(screen.getByTestId('quick-schedule-screen')).toBeInTheDocument();
    expect(screen.getByTestId('quick-schedule-banner')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('quick-book-button'));
    expect(screen.getByTestId('booking-screen')).toBeInTheDocument();
    expect(screen.getByText('Оберіть улюбленця')).toBeInTheDocument();
  });

  it('Eval 5: Payment Stage Creation & Submittal Contract', async () => {
    const onComplete = vi.fn();
    render(
      <BookingScreen
        initialStage="payment"
        initialPets={DEMO_PETS}
        onComplete={onComplete}
      />
    );

    expect(screen.getByTestId('step-payment')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-method-apple-pay')).not.toBeInTheDocument();
    expect(screen.getByTestId('payment-method-card')).toBeInTheDocument();
    expect(screen.getByTestId('payment-method-cash')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('payment-method-cash'));
    fireEvent.click(screen.getByTestId('submit-payment-button'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('Eval 6: Docked Bottom Bar Contract with Next CTA and Stage Indicator', () => {
    const { rerender } = render(<BookingScreen initialStage="pet" initialPets={DEMO_PETS} />);

    const bottomBar = screen.getByTestId('booking-bottom-bar');
    expect(bottomBar).toBeInTheDocument();

    const nextBtn = screen.getByTestId('next-step-button');
    expect(nextBtn).toBeInTheDocument();
    expect(nextBtn).toHaveTextContent('Далі');

    const progressBar = screen.getByTestId('booking-progress-bar');
    expect(progressBar).toBeInTheDocument();

    const stages: Array<{ stage: 'pet' | 'procedure' | 'master' | 'datetime' | 'remarks'; expectedDot: number }> = [
      { stage: 'pet', expectedDot: 1 },
      { stage: 'procedure', expectedDot: 2 },
      { stage: 'master', expectedDot: 3 },
      { stage: 'datetime', expectedDot: 4 },
      { stage: 'remarks', expectedDot: 5 },
    ];

    stages.forEach(({ stage, expectedDot }) => {
      rerender(<BookingScreen initialStage={stage} initialPets={DEMO_PETS} />);
      expect(screen.getByTestId('booking-bottom-bar')).toBeInTheDocument();
      expect(screen.getByTestId(`progress-dot-${expectedDot}`)).toBeInTheDocument();
    });

    rerender(<BookingScreen initialStage="confirmation" initialPets={DEMO_PETS} />);
    expect(screen.queryByTestId('booking-bottom-bar')).not.toBeInTheDocument();
  });

  it('Eval 7: Procedure Description Excluded from 2nd Page (Modal Window Isolation)', async () => {
    render(<BookingScreen initialStage="procedure" initialPets={DEMO_PETS} />);

    expect(screen.getByTestId('step-procedure')).toBeInTheDocument();
    expect(screen.queryByTestId('procedure-detail-card')).not.toBeInTheDocument();

    PROCEDURES_CATALOG.forEach((proc) => {
      expect(screen.queryByText(proc.description)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('procedure-option-express-grooming'));
    await waitFor(() => {
      expect(screen.getByTestId('procedure-modal-sheet')).toBeInTheDocument();
    });
  });

  it('Eval 8: QuickSchedule Screen Parity with Figma 121:1236 & QuickSchedulePage', () => {
    const mockVisit = {
      id: 'visit-999',
      startsAt: '2026-08-10T16:00:00.000Z',
      masterName: 'Марія Шевченко',
      serviceName: 'Комплексний грумінг',
      status: 'confirmed',
    };

    render(
      <MainScreen
        initialTab="booking"
        initialBookingSubScreen="schedule"
        initialVisit={mockVisit}
      />
    );

    const dateDetails = formatVisitDateDetails(mockVisit.startsAt)!;
    expect(screen.getByTestId('quick-schedule-screen')).toBeInTheDocument();
    expect(screen.getByTestId('visit-card')).toBeInTheDocument();
    expect(screen.getByText(dateDetails.dayNumber)).toBeInTheDocument();
    expect(screen.getByText(dateDetails.time)).toBeInTheDocument();
    expect(screen.getByText('Марія Шевченко')).toBeInTheDocument();
    expect(screen.getByText('Комплексний грумінг')).toBeInTheDocument();
    expect(screen.getByTestId('reschedule-visit-button')).toHaveTextContent('Перенести');
    expect(screen.getByTestId('cancel-visit-button')).toHaveTextContent('Скасувати');

    expect(screen.getByTestId('quick-schedule-banner')).toBeInTheDocument();
    expect(screen.getByTestId('quick-book-button')).toHaveTextContent('Швидкий запис');

    fireEvent.click(screen.getByTestId('reschedule-visit-button'));
    expect(screen.getByTestId('booking-screen')).toBeInTheDocument();
  });
});
