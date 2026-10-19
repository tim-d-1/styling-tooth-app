import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProcedureDetailCard from './ProcedureDetailCard';
import { PROCEDURES_CATALOG } from '../booking_types';

describe('ProcedureDetailCard (Figma Frame 1060:4180)', () => {
  it.each(PROCEDURES_CATALOG)(
    'renders procedure details for $name matching Figma frame 1060:4180 layout',
    (proc) => {
      const handleBook = vi.fn();
      const handleAddMore = vi.fn();

      render(
        <ProcedureDetailCard
          procedure={proc}
          onBook={handleBook}
          onAddMore={handleAddMore}
        />
      );

      expect(screen.getByRole('heading', { level: 2, name: proc.name })).toBeDefined();
      expect(screen.getByText(proc.duration)).toBeDefined();
      expect(screen.getByText(proc.description)).toBeDefined();
      expect(screen.getByText(proc.priceFormatted)).toBeDefined();

      const bookBtn = screen.getByRole('button', { name: 'Записатись' });
      fireEvent.click(bookBtn);
      expect(handleBook).toHaveBeenCalledTimes(1);

      const addMoreBtn = screen.getByRole('button', { name: 'Додати ще процедуру' });
      fireEvent.click(addMoreBtn);
      expect(handleAddMore).toHaveBeenCalledTimes(1);
    }
  );
});
