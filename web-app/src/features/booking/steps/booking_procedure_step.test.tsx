import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingProcedureStep from './BookingProcedureStep';
import { PROCEDURES_CATALOG } from '../booking_types';

describe('BookingProcedureStep (Figma 1060:4133 & 1060:4180)', () => {
  it('switches article content to procedure details on clicking procedure, and advances on Записатись click', () => {
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

    expect(screen.getByRole('heading', { level: 2, name: targetProc.name })).toBeDefined();
    expect(screen.getByText(targetProc.duration)).toBeDefined();
    expect(screen.getByText(targetProc.description)).toBeDefined();
    expect(screen.getByText(targetProc.priceFormatted)).toBeDefined();

    const bookBtn = screen.getByRole('button', { name: /Записатись/i });
    fireEvent.click(bookBtn);

    expect(handleSelectProcedure).toHaveBeenCalledWith(targetProc);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it('switches back to selector screen when clicking Додати ще процедуру and invokes onAddProcedure', () => {
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
    expect(screen.getByRole('heading', { level: 2, name: targetProc.name })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Додати ще процедуру' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Обери процедуру' })).toBeDefined();
    expect(screen.getByRole('radiogroup', { name: 'Оберіть процедуру' })).toBeDefined();
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

    // 1. Open first procedure details and click Додати ще процедуру
    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[0].name }));
    expect(screen.getByRole('heading', { level: 2, name: PROCEDURES_CATALOG[0].name })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Додати ще процедуру' }));
    expect(handleAdd).toHaveBeenCalledWith(PROCEDURES_CATALOG[0]);
    expect(screen.getByRole('heading', { level: 1, name: 'Обери процедуру' })).toBeDefined();

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

    // 2. Open second procedure details and click Записатись
    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[1].name }));
    expect(screen.getByRole('heading', { level: 2, name: PROCEDURES_CATALOG[1].name })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Записатись/i }));
    expect(handleAdd).toHaveBeenCalledWith(PROCEDURES_CATALOG[1]);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it('supports controlled viewingProcedure prop', () => {
    const handleViewChange = vi.fn();

    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        onSelectProcedure={vi.fn()}
        onNext={vi.fn()}
        viewingProcedure={PROCEDURES_CATALOG[2]}
        onViewProcedureChange={handleViewChange}
      />
    );

    expect(screen.getByRole('heading', { level: 2, name: PROCEDURES_CATALOG[2].name })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Додати ще процедуру' }));
    expect(handleViewChange).toHaveBeenCalledWith(null);
  });

  it('renders all procedure buttons unselected by default when no procedure is selected', () => {
    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        selectedProcedureIds={[]}
        onSelectProcedure={vi.fn()}
        onNext={vi.fn()}
      />
    );

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(PROCEDURES_CATALOG.length);
    for (const radio of radioButtons) {
      expect(radio.getAttribute('aria-checked')).toBe('false');
      expect(radio.className).toContain('bg-white');
      expect(radio.className).not.toContain('bg-terracotta');
    }
  });

  it('deselects already selected procedure without opening procedure details', () => {
    const handleRemove = vi.fn();
    const handleSelect = vi.fn();
    const targetProc = PROCEDURES_CATALOG[0];

    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        selectedProcedureIds={[targetProc.id]}
        onSelectProcedure={handleSelect}
        onRemoveProcedure={handleRemove}
        onNext={vi.fn()}
      />
    );

    const button = screen.getByRole('radio', { name: targetProc.name });
    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(button.className).toContain('bg-terracotta');

    fireEvent.click(button);

    // Should invoke onRemoveProcedure and NOT open details
    expect(handleRemove).toHaveBeenCalledWith(targetProc.id);
    expect(screen.queryByRole('heading', { level: 2, name: targetProc.name })).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Обери процедуру' })).toBeDefined();
  });

  it('opens procedure details when clicking an unselected procedure', () => {
    const handleRemove = vi.fn();
    const handleSelect = vi.fn();
    const firstProc = PROCEDURES_CATALOG[0];
    const secondProc = PROCEDURES_CATALOG[1];

    render(
      <BookingProcedureStep
        procedures={PROCEDURES_CATALOG}
        selectedProcedureIds={[firstProc.id]}
        onSelectProcedure={handleSelect}
        onRemoveProcedure={handleRemove}
        onNext={vi.fn()}
      />
    );

    const unselectedButton = screen.getByRole('radio', { name: secondProc.name });
    expect(unselectedButton.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(unselectedButton);

    expect(handleRemove).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 2, name: secondProc.name })).toBeDefined();
  });
});
