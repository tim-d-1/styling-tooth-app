import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingProcedureStep from './BookingProcedureStep';
import { PROCEDURES_CATALOG } from '../booking_types';

describe('BookingProcedureStep (Figma Node 539:2046 Procedure Modal)', () => {
  it('opens modal on clicking procedure, shows details, and advances on Записатися click', () => {
    const handleSelectProcedure = vi.fn();
    const handleNext = vi.fn();

    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        onSelectProcedure={handleSelectProcedure}
        onNext={handleNext}
      />
    );

    const targetProc = PROCEDURES_CATALOG[0];
    const procButton = screen.getByRole('radio', { name: targetProc.name });
    fireEvent.click(procButton);

    expect(handleSelectProcedure).toHaveBeenCalledWith(targetProc);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: targetProc.name })).toBeDefined();
    expect(screen.getByText(targetProc.duration)).toBeDefined();
    expect(screen.getByText(targetProc.description)).toBeDefined();
    expect(screen.getByText(targetProc.priceFormatted)).toBeDefined();

    const bookBtn = screen.getByRole('button', { name: 'Записатися' });
    fireEvent.click(bookBtn);

    expect(handleNext).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes modal when clicking Додати ще процедуру or close button', () => {
    const handleSelect = vi.fn();
    const handleNext = vi.fn();

    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        onSelectProcedure={handleSelect}
        onNext={handleNext}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[1].name }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Додати ще процедуру' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(handleNext).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[1].name }));
    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
