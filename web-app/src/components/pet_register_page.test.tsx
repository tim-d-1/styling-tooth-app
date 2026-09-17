import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PetRegisterPage from './PetRegisterPage';
import { validatePetRegisterForm } from './pet_register_utils';

describe('PetRegisterPage and Pet Register Utilities', () => {
  describe('validatePetRegisterForm', () => {
    it('requires pet name', () => {
      const result = validatePetRegisterForm({
        name: '   ',
        species: 'dog',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть кличку тваринки');
    });

    it('validates invalid weight format', () => {
      const result = validatePetRegisterForm({
        name: 'Барсік',
        species: 'cat',
        weight: 'invalid-number',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Вкажіть коректну вагу (наприклад, 4.5)');
    });

    it('validates negative weight', () => {
      const result = validatePetRegisterForm({
        name: 'Барсік',
        species: 'cat',
        weight: '-2',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Вкажіть коректну вагу (наприклад, 4.5)');
    });

    it('approves valid pet data', () => {
      const result = validatePetRegisterForm({
        name: 'Сімба',
        species: 'cat',
        breed: 'Мейн-кун',
        sex: 'male',
        weight: '7.2',
        notes: 'Дуже пухнастий',
      });
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('PetRegisterPage Component', () => {
    it('renders all form fields without placeholders', () => {
      render(<PetRegisterPage />);

      const nameInput = screen.getByLabelText('Кличка тваринки');
      const breedInput = screen.getByLabelText('Порода');
      const birthDateInput = screen.getByLabelText('Дата народження / Вік');
      const weightInput = screen.getByLabelText('Вага (кг)');
      const notesInput = screen.getByLabelText('Особливості та застереження');

      expect(nameInput.getAttribute('placeholder')).toBeNull();
      expect(breedInput.getAttribute('placeholder')).toBeNull();
      expect(birthDateInput.getAttribute('placeholder')).toBeNull();
      expect(weightInput.getAttribute('placeholder')).toBeNull();
      expect(notesInput.getAttribute('placeholder')).toBeNull();

      expect(screen.getByRole('button', { name: 'Собака' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Кіт' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Інше' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Хлопчик' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Дівчинка' })).toBeDefined();
      expect(screen.getByText('Фото тваринки')).toBeDefined();
    });

    it('renders centered legal footer text', () => {
      render(<PetRegisterPage />);

      expect(
        screen.getByText(
          'Входячи в акаунт або створюючи новий, ви погоджуєтеся з нашими Правилами й умовами та Політикою конфіденційності'
        )
      ).toBeDefined();

      expect(
        screen.getByText(/Усі права захищено\.\s*© 2026 Стильний зубець\./)
      ).toBeDefined();
    });

    it('handles species and sex selection', () => {
      render(<PetRegisterPage />);

      const catBtn = screen.getByRole('button', { name: 'Кіт' });
      fireEvent.click(catBtn);
      expect(catBtn.className).toContain('bg-terracotta');

      const femaleBtn = screen.getByRole('button', { name: 'Дівчинка' });
      fireEvent.click(femaleBtn);
      expect(femaleBtn.className).toContain('bg-terracotta');
    });

    it('handles navigation triggers onBack and onSkip', () => {
      const handleBack = vi.fn();
      const handleSkip = vi.fn();
      render(<PetRegisterPage onBack={handleBack} onSkip={handleSkip} />);

      const backBtn = screen.getByRole('button', { name: /Повернутися назад/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);

      const skipBtn = screen.getByRole('button', { name: 'Пропустити' });
      fireEvent.click(skipBtn);
      expect(handleSkip).toHaveBeenCalledTimes(1);
    });

    it('handles photo upload selection and clear', () => {
      const { container } = render(<PetRegisterPage />);

      const file = new File(['mainecoon-photo'], 'cat.jpg', { type: 'image/jpeg' });
      const fileInput = container.querySelector('#pet-photo-upload') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText('cat.jpg')).toBeDefined();
      expect(screen.getByRole('button', { name: 'Видалити фото' })).toBeDefined();

      const deleteBtn = screen.getByRole('button', { name: 'Видалити фото' });
      fireEvent.click(deleteBtn);

      expect(screen.queryByText('cat.jpg')).toBeNull();
      expect(screen.getByText('Завантажити фото')).toBeDefined();
    });

    it('shows validation error when submitted with empty name', async () => {
      render(<PetRegisterPage />);

      const submitBtn = screen.getByRole('button', { name: 'Зберегти' });
      fireEvent.click(submitBtn);

      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert.textContent).toBe('Введіть кличку тваринки');
    });

    it('saves pet and triggers onSuccess for valid submission', async () => {
      const { supabase } = await import('../lib/supabase');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { user: { id: 'user-789' } } },
        error: null,
      } as never);

      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: insertMock,
      } as never);

      const handleSuccess = vi.fn();
      render(<PetRegisterPage onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByLabelText('Кличка тваринки'), { target: { value: 'Арчі' } });
      fireEvent.change(screen.getByLabelText('Порода'), { target: { value: 'Коргі' } });
      fireEvent.change(screen.getByLabelText('Вага (кг)'), { target: { value: '11.5' } });

      const submitBtn = screen.getByRole('button', { name: 'Зберегти' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_id: 'user-789',
          name: 'Арчі',
          breed: 'Коргі',
          weight_kg: 11.5,
        })
      );
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
