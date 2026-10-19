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

  it('renders summary box when multiple procedures are selected and allows removing items', () => {
    const handleRemove = vi.fn();
    const handleNext = vi.fn();

    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        selectedProcedureIds={[PROCEDURES_CATALOG[0].id, PROCEDURES_CATALOG[1].id]}
        onSelectProcedure={vi.fn()}
        onRemoveProcedure={handleRemove}
        onNext={handleNext}
      />
    );

    expect(screen.getByText('Обрано послуг: 2')).toBeDefined();
    // 850 + 700 = 1550, 75 + 60 = 135
    expect(screen.getByText('1 550 ₴ • 135 хв')).toBeDefined();

    const removeBtn = screen.getByRole('button', {
      name: `Видалити послугу ${PROCEDURES_CATALOG[0].name}`,
    });
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith(PROCEDURES_CATALOG[0].id);

    const nextBtn = screen.getByRole('button', { name: 'Далі' });
    expect(nextBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it('switches to multi-mode after clicking Додати ще процедуру and invokes onAddProcedure on subsequent procedure click', () => {
    const handleSelect = vi.fn();
    const handleAdd = vi.fn();

    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        selectedProcedureIds={[PROCEDURES_CATALOG[0].id]}
        onSelectProcedure={handleSelect}
        onAddProcedure={handleAdd}
        onNext={vi.fn()}
      />
    );

    // Open first procedure modal
    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[0].name }));
    expect(screen.getByRole('dialog')).toBeDefined();

    // Click "Додати ще процедуру" to enter multi-mode
    fireEvent.click(screen.getByRole('button', { name: 'Додати ще процедуру' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    // Now click second procedure
    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[1].name }));
    expect(handleAdd).toHaveBeenCalledWith(PROCEDURES_CATALOG[1]);
  });
});
