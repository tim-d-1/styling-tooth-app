import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProcedureDetailCard from './ProcedureDetailCard';
import { PROCEDURES_CATALOG } from '../booking_types';

describe('ProcedureDetailCard', () => {
  it.each(PROCEDURES_CATALOG)(
    'renders procedure details for $name matching Figma frame 1060:4180 layout',
    (proc) => {
      render(<ProcedureDetailCard procedure={proc} />);

      expect(screen.getByRole('heading', { level: 2, name: proc.name })).toBeDefined();
      expect(screen.getByText(proc.duration)).toBeDefined();
      expect(screen.getByText(proc.description)).toBeDefined();
      expect(screen.getByText(proc.priceFormatted)).toBeDefined();
      expect(screen.getByText('Вартість послуги')).toBeDefined();
    }
  );
});
