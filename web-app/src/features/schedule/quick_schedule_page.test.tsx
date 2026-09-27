import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import QuickSchedulePage from './QuickSchedulePage';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    }),
  },
}));

describe('QuickSchedulePage', () => {
  it('renders empty visit state when there is no appointment', () => {
    const handleBook = vi.fn();
    const handleBack = vi.fn();

    render(
      <QuickSchedulePage
        initialVisit={null}
        onBookClick={handleBook}
        onBackClick={handleBack}
      />
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Запланований візит' })).toBeDefined();
    expect(screen.getByText('Немає активних записів')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Запланувати візит' })).toBeDefined();

    const backBtn = screen.getByRole('button', { name: 'Назад' });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalled();
  });

  it('renders scheduled visit card when appointment data is provided', async () => {
    const handleReschedule = vi.fn();
    const handleCancel = vi.fn();
    const testVisit = {
      id: 'visit-123',
      dayOfWeek: 'СЕР',
      dayNumber: '10',
      timeSlot: '16:00',
      masterName: 'Марія Шевченко',
      procedureName: 'Комплексний грумінг',
      basePrice: 1300,
      transferPrice: 100,
      initialTransferEnabled: false,
    };

    render(
      <QuickSchedulePage
        initialVisit={testVisit}
        onReschedule={handleReschedule}
        onCancelVisit={handleCancel}
      />
    );

    expect(screen.getByText('СЕР')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('16:00')).toBeDefined();
    expect(screen.getByText('Марія Шевченко')).toBeDefined();
    expect(screen.getByText('Комплексний грумінг')).toBeDefined();
    expect(screen.getByText('1300 ₴')).toBeDefined();
    expect(screen.getByText('100 ₴')).toBeDefined();

    const switchBtn = screen.getByRole('switch', {
      name: /Увімкнути або вимкнути трансфер улюбленця/i,
    });
    await act(async () => {
      fireEvent.click(switchBtn);
    });
    expect(screen.getByText('1400 ₴')).toBeDefined();

    const rescheduleBtn = screen.getByRole('button', {
      name: 'Перенести запланований візит',
    });
    await act(async () => {
      fireEvent.click(rescheduleBtn);
    });
    expect(handleReschedule).toHaveBeenCalled();

    const cancelBtn = screen.getByRole('button', {
      name: 'Скасувати запланований візит',
    });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });
    expect(handleCancel).toHaveBeenCalledWith('visit-123');
  });

  it('renders quick schedule banner with image and handles quick book click', () => {
    const handleQuickBook = vi.fn();

    render(<QuickSchedulePage onQuickBookClick={handleQuickBook} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Заплануйте свій візит' })).toBeDefined();

    const bannerBookBtn = screen.getByRole('button', {
      name: 'Швидкий запис на візит',
    });
    fireEvent.click(bannerBookBtn);
    expect(handleQuickBook).toHaveBeenCalled();
  });
});
