import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import BookingDateTimeStep from './BookingDateTimeStep';
import { supabase } from '@/lib/supabase';

describe('BookingDateTimeStep', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial dates, month title, and time slots', () => {
    const handleSelect = vi.fn();
    const handleNext = vi.fn();

    render(
      <BookingDateTimeStep
        selectedDate="2026-08-11"
        selectedTimeSlot="16:00"
        onSelectDateTime={handleSelect}
        onNext={handleNext}
      />
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Коли вам зручно?' })
    ).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Серпень' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Чт12' })).toBeDefined();
    expect(screen.getByRole('radio', { name: '16:00' })).toBeDefined();
  });

  it('updates selected day and invokes onSelectDateTime', () => {
    const handleSelect = vi.fn();
    const handleNext = vi.fn();

    render(
      <BookingDateTimeStep
        selectedDate="2026-08-11"
        selectedTimeSlot="16:00"
        onSelectDateTime={handleSelect}
        onNext={handleNext}
      />
    );

    const fridayBtn = screen.getByRole('button', { name: 'Пт13' });
    fireEvent.click(fridayBtn);

    expect(handleSelect).toHaveBeenCalledWith('2026-08-13', '16:00', '13.08.2026');
  });

  it('updates selected slot and invokes onSelectDateTime', () => {
    const handleSelect = vi.fn();
    const handleNext = vi.fn();

    render(
      <BookingDateTimeStep
        selectedDate="2026-08-11"
        selectedTimeSlot="16:00"
        onSelectDateTime={handleSelect}
        onNext={handleNext}
      />
    );

    const slotBtn = screen.getByRole('radio', { name: '12:00' });
    fireEvent.click(slotBtn);

    expect(handleSelect).toHaveBeenCalledWith('2026-08-11', '12:00', '11.08.2026');
  });

  it('navigates weeks using week navigation buttons', () => {
    const handleSelect = vi.fn();
    const handleNext = vi.fn();

    render(
      <BookingDateTimeStep
        selectedDate="2026-08-11"
        selectedTimeSlot="16:00"
        onSelectDateTime={handleSelect}
        onNext={handleNext}
      />
    );

    const nextWeekBtn = screen.getByRole('button', { name: 'Наступний тиждень' });
    fireEvent.click(nextWeekBtn);

    expect(screen.getByRole('button', { name: 'Пн16' })).toBeDefined();

    const prevWeekBtn = screen.getByRole('button', { name: 'Попередній тиждень' });
    fireEvent.click(prevWeekBtn);

    expect(screen.getByRole('button', { name: 'Пн9' })).toBeDefined();
  });

  it('calls onNext when clicking continue button', () => {
    const handleSelect = vi.fn();
    const handleNext = vi.fn();

    render(
      <BookingDateTimeStep
        selectedDate="2026-08-11"
        selectedTimeSlot="16:00"
        onSelectDateTime={handleSelect}
        onNext={handleNext}
      />
    );

    const continueBtn = screen.getByRole('button', { name: 'Далі' });
    fireEvent.click(continueBtn);

    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it('fetches dynamic slots via RPC when masterId and procedureId UUIDs are passed', async () => {
    const handleSelect = vi.fn();
    const handleNext = vi.fn();

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: [
        { slot_start: '2026-08-11T10:00:00Z', slot_end: '2026-08-11T11:00:00Z' },
        { slot_start: '2026-08-11T11:30:00Z', slot_end: '2026-08-11T12:30:00Z' },
      ],
      error: null,
    } as never);

    await act(async () => {
      render(
        <BookingDateTimeStep
          selectedDate="2026-08-11"
          selectedTimeSlot="16:00"
          masterId="11111111-1111-1111-1111-111111111111"
          procedureId="50000000-0000-0000-0000-000000000001"
          onSelectDateTime={handleSelect}
          onNext={handleNext}
        />
      );
    });

    expect(rpcSpy).toHaveBeenCalledWith('get_available_slots', {
      p_master_id: '11111111-1111-1111-1111-111111111111',
      p_service_id: '50000000-0000-0000-0000-000000000001',
      p_date: '2026-08-11',
    });
  });
});
