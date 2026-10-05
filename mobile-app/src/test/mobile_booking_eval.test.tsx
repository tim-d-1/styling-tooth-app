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
});
