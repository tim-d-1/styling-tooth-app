import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingProcedureStep from './BookingProcedureStep';
import { PROCEDURES_CATALOG } from '../booking_types';

describe('BookingProcedureStep (Figma 1060:4133 & 1060:4180)', () => {
  it('opens modal on clicking procedure, shows details, and advances on Записатись click', () => {
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

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: targetProc.name })).toBeDefined();
    expect(screen.getByText(targetProc.duration)).toBeDefined();
    expect(screen.getByText(targetProc.description)).toBeDefined();
    expect(screen.getByText(targetProc.priceFormatted)).toBeDefined();

    const bookBtn = screen.getByRole('button', { name: /Записатись/i });
    fireEvent.click(bookBtn);

    expect(handleSelectProcedure).toHaveBeenCalledWith(targetProc);
    expect(handleNext).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes modal when clicking Додати ще процедуру and returns to selector screen', () => {
    const handleAdd = vi.fn();
    const handleNext = vi.fn();

    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        onSelectProcedure={vi.fn()}
        onAddProcedure={handleAdd}
        onNext={handleNext}
      />
    );

    const targetProc = PROCEDURES_CATALOG[1];
    fireEvent.click(screen.getByRole('radio', { name: targetProc.name }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Додати ще процедуру' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(handleNext).not.toHaveBeenCalled();
    expect(handleAdd).toHaveBeenCalledWith(targetProc);
  });

  it('does not render inline detail card or next button on selector screen matching Figma 1060:4133', () => {
    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        selectedProcedureIds={[PROCEDURES_CATALOG[0].id, PROCEDURES_CATALOG[1].id]}
        onSelectProcedure={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(screen.getByRole('radiogroup', { name: 'Оберіть процедуру' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Далі' })).toBeNull();
    expect(screen.queryByText('Вартість послуги')).toBeNull();
    expect(screen.queryByText('Обрано послуг:')).toBeNull();
    expect(screen.getByRole('progressbar', { name: 'Крок 2 з 5' })).toBeDefined();
  });

  it('allows sequential multi-service selection via Додати ще процедуру and then Записатись', () => {
    const handleAdd = vi.fn();
    const handleNext = vi.fn();

    const { rerender } = render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        selectedProcedureIds={[]}
        onSelectProcedure={vi.fn()}
        onAddProcedure={handleAdd}
        onNext={handleNext}
      />
    );

    // 1. Open first procedure modal and click Додати ще процедуру
    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[0].name }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Додати ще процедуру' }));
    expect(handleAdd).toHaveBeenCalledWith(PROCEDURES_CATALOG[0]);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Re-render with first procedure selected
    rerender(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        selectedProcedureIds={[PROCEDURES_CATALOG[0].id]}
        onSelectProcedure={vi.fn()}
        onAddProcedure={handleAdd}
        onNext={handleNext}
      />
    );

    // 2. Open second procedure modal and click Записатись
    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[1].name }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Записатись/i }));
    expect(handleAdd).toHaveBeenCalledWith(PROCEDURES_CATALOG[1]);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it('closes modal when clicking backdrop without advancing', () => {
    const handleNext = vi.fn();

    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        onSelectProcedure={vi.fn()}
        onNext={handleNext}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[0].name }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();

    fireEvent.click(dialog);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(handleNext).not.toHaveBeenCalled();
  });
});
