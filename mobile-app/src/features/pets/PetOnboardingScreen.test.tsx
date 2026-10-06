import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PetOnboardingScreen } from './PetOnboardingScreen';
import { supabase } from '../../lib/supabase';

describe('PetOnboardingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'owner-uuid-1' } } },
      error: null,
    });
  });

  it('renders matching Figma frame 197:1169 without чутливість and without placeholders, asking for age', () => {
    render(<PetOnboardingScreen />);

    expect(screen.getByTestId('pet-onboarding-screen')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByText('Стильний зубець')).toBeInTheDocument();
    expect(screen.getByText('Реєстрація тваринки')).toBeInTheDocument();

    expect(screen.getByTestId('species-cat-button')).toBeInTheDocument();
    expect(screen.getByTestId('species-dog-button')).toBeInTheDocument();
    expect(screen.getByTestId('pet-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('pet-age-input')).toBeInTheDocument();
    expect(screen.getByLabelText('Дата народження / Вік')).toBeInTheDocument();
    expect(screen.getByText('ДАТА НАРОДЖЕННЯ / ВІК')).toBeInTheDocument();
    expect(screen.queryByTestId('birth-day-input')).toBeNull();
    expect(screen.queryByTestId('birth-month-input')).toBeNull();
    expect(screen.queryByTestId('birth-year-input')).toBeNull();

    expect(screen.getByTestId('medical-notes-input')).toBeInTheDocument();
    expect(screen.getByTestId('behavior-notes-input')).toBeInTheDocument();
    expect(screen.getByTestId('pet-photo-picker-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-pet-button')).toBeInTheDocument();
    expect(screen.getByTestId('skip-pet-button')).toBeInTheDocument();

    expect(screen.queryByText(/чутливість/i)).toBeNull();
    expect(screen.queryByTestId('sensitivity-input')).toBeNull();

    expect(screen.getByTestId('pet-name-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('pet-age-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('medical-notes-input')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('behavior-notes-input')).not.toHaveAttribute('placeholder');
  });

  it('navigates back when back button is pressed', () => {
    const onBack = vi.fn();
    render(<PetOnboardingScreen onBack={onBack} />);

    fireEvent.click(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('navigates on skip when skip button is pressed', () => {
    const onSkip = vi.fn();
    render(<PetOnboardingScreen onSkip={onSkip} />);

    fireEvent.click(screen.getByTestId('skip-pet-button'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('shows validation error when pet name is empty', async () => {
    render(<PetOnboardingScreen />);

    fireEvent.click(screen.getByTestId('submit-pet-button'));

    expect(await screen.findByText('Введіть кличку тваринки')).toBeInTheDocument();
  });

  it('submits pet details with age string and calls onSuccess on valid input', async () => {
    const onSuccess = vi.fn();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'pet-new-1', name: 'Барон' },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    render(<PetOnboardingScreen onSuccess={onSuccess} />);

    fireEvent.click(screen.getByTestId('species-dog-button'));

    fireEvent.change(screen.getByTestId('pet-name-input'), {
      target: { value: 'Барон' },
    });
    fireEvent.change(screen.getByTestId('pet-age-input'), {
      target: { value: '2 роки' },
    });
    fireEvent.change(screen.getByTestId('medical-notes-input'), {
      target: { value: 'Немає' },
    });
    fireEvent.change(screen.getByTestId('behavior-notes-input'), {
      target: { value: 'Спокійний' },
    });

    fireEvent.click(screen.getByTestId('submit-pet-button'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('pets');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_id: 'owner-uuid-1',
          name: 'Барон',
          species: 'dog',
          sex: 'unknown',
          birth_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          medical_notes: 'Немає',
          behavior_notes: 'Спокійний',
        })
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('submits pet details with calendar date and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'pet-new-1', name: 'Барон' },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    render(<PetOnboardingScreen onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('pet-name-input'), {
      target: { value: 'Барон' },
    });
    fireEvent.change(screen.getByTestId('pet-age-input'), {
      target: { value: '16.03.2023' },
    });

    fireEvent.click(screen.getByTestId('submit-pet-button'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          birth_date: '2023-03-16',
        })
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error when invalid age / birth date is entered', async () => {
    render(<PetOnboardingScreen />);

    fireEvent.change(screen.getByTestId('pet-name-input'), {
      target: { value: 'Барон' },
    });
    fireEvent.change(screen.getByTestId('pet-age-input'), {
      target: { value: 'невідомо' },
    });

    fireEvent.click(screen.getByTestId('submit-pet-button'));

    expect(
      await screen.findByText(
        'Вкажіть коректну дату народження або вік (наприклад, 16.03.2023)'
      )
    ).toBeInTheDocument();
  });

  it('allows toggling between cat and dog species', () => {
    render(<PetOnboardingScreen />);

    fireEvent.click(screen.getByTestId('species-cat-button'));
    expect(screen.getByTestId('species-cat-button')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('species-dog-button'));
    expect(screen.getByTestId('species-dog-button')).toBeInTheDocument();
  });
});
