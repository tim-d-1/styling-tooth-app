import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PetOnboardingScreen } from '../features/pets/PetOnboardingScreen';
import {
  parsePetBirthDateInput,
  validatePetRegisterForm,
} from '../features/pets/pet_register_utils';
import { supabase } from '../lib/supabase';

describe('Pet Creation Screen Age Parity Eval Suite', () => {
  const refDate = new Date(2026, 9, 1);

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'test-user-eval-1' } } },
      error: null,
    });
  });

  it('Eval 1: renders single age input with web-app parity label "ДАТА НАРОДЖЕННЯ / ВІК"', () => {
    render(<PetOnboardingScreen />);

    expect(screen.getByTestId('pet-age-input')).toBeInTheDocument();
    expect(screen.getByLabelText('Дата народження / Вік')).toBeInTheDocument();
    expect(screen.getByText('ДАТА НАРОДЖЕННЯ / ВІК')).toBeInTheDocument();
  });

  it('Eval 2: confirms absence of segmented day/month/year inputs', () => {
    render(<PetOnboardingScreen />);

    expect(screen.queryByTestId('birth-day-input')).toBeNull();
    expect(screen.queryByTestId('birth-month-input')).toBeNull();
    expect(screen.queryByTestId('birth-year-input')).toBeNull();
  });

  it('Eval 3: verifies inputs have no placeholder attributes', () => {
    render(<PetOnboardingScreen />);

    expect(screen.getByTestId('pet-name-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('pet-age-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('medical-notes-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('behavior-notes-input')).not.toHaveAttribute('placeholder');
  });

  it('Eval 4: evaluates submission with Ukrainian age string "3 роки" calculates correct birth_date payload', async () => {
    const onSuccess = vi.fn();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'pet-eval-123', name: 'Рекс' },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    render(<PetOnboardingScreen onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('pet-name-input'), {
      target: { value: 'Рекс' },
    });
    fireEvent.change(screen.getByTestId('pet-age-input'), {
      target: { value: '3 роки' },
    });

    fireEvent.click(screen.getByTestId('submit-pet-button'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_id: 'test-user-eval-1',
          name: 'Рекс',
          birth_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('Eval 5: evaluates European calendar date "15.05.2022" normalizes to ISO date', async () => {
    const onSuccess = vi.fn();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'pet-eval-456', name: 'Мурчик' },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    render(<PetOnboardingScreen onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('pet-name-input'), {
      target: { value: 'Мурчик' },
    });
    fireEvent.change(screen.getByTestId('pet-age-input'), {
      target: { value: '15.05.2022' },
    });

    fireEvent.click(screen.getByTestId('submit-pet-button'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          birth_date: '2022-05-15',
        })
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('Eval 6: validates age input matrix for various numeric and textual formats', () => {
    const cases = [
      { input: '1', expected: '2025-10-01' },
      { input: '2', expected: '2024-10-01' },
      { input: '4 роки', expected: '2022-10-01' },
      { input: '6 місяців', expected: '2026-04-01' },
      { input: '1 рік 2 місяці', expected: '2025-08-01' },
      { input: '2021-08-10', expected: '2021-08-10' },
    ];

    for (const c of cases) {
      const parsed = parsePetBirthDateInput(c.input, refDate);
      expect(parsed.error).toBeNull();
      expect(parsed.dateString).toBe(c.expected);
    }
  });

  it('Eval 7: allows empty age input when pet age is not specified', async () => {
    const onSuccess = vi.fn();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'pet-eval-789', name: 'Лаки' },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    render(<PetOnboardingScreen onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('pet-name-input'), {
      target: { value: 'Лаки' },
    });

    fireEvent.click(screen.getByTestId('submit-pet-button'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Лаки',
          birth_date: null,
        })
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
