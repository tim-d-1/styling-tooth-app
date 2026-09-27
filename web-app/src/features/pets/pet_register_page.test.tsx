import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PetRegisterPage from './PetRegisterPage';
import {
  validatePetRegisterForm,
  parsePetBirthDateInput,
} from './pet_register_utils';

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

    it('approves valid age input "2"', () => {
      const result = validatePetRegisterForm({
        name: 'Барон',
        species: 'dog',
        birthDate: '2',
      });
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('rejects invalid birth date text', () => {
      const result = validatePetRegisterForm({
        name: 'Барон',
        species: 'dog',
        birthDate: 'невідомо',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Вкажіть коректну дату народження або вік (наприклад, 15.05.2022 або 2 роки)');
    });
  });

  describe('parsePetBirthDateInput', () => {
    const fixedNow = new Date('2026-09-27T12:00:00Z');

    it('converts plain age string "2" to ISO date corresponding to 2 years ago', () => {
      const result = parsePetBirthDateInput('2', fixedNow);
      expect(result.error).toBeNull();
      expect(result.dateString).toBe('2024-09-27');
    });

    it('converts decimal age string "0.5" and "1.5"', () => {
      expect(parsePetBirthDateInput('0.5', fixedNow)).toEqual({
        dateString: '2026-03-27',
        error: null,
      });
      expect(parsePetBirthDateInput('1.5', fixedNow)).toEqual({
        dateString: '2025-03-27',
        error: null,
      });
    });

    it('converts Ukrainian age strings: "2 роки", "1 рік", "5 років", "2 р"', () => {
      expect(parsePetBirthDateInput('2 роки', fixedNow)).toEqual({
        dateString: '2024-09-27',
        error: null,
      });
      expect(parsePetBirthDateInput('1 рік', fixedNow)).toEqual({
        dateString: '2025-09-27',
        error: null,
      });
      expect(parsePetBirthDateInput('5 років', fixedNow)).toEqual({
        dateString: '2021-09-27',
        error: null,
      });
      expect(parsePetBirthDateInput('2 р', fixedNow)).toEqual({
        dateString: '2024-09-27',
        error: null,
      });
    });

    it('converts months: "6 місяців", "3 місяці", "1 місяць", "6 міс"', () => {
      expect(parsePetBirthDateInput('6 місяців', fixedNow)).toEqual({
        dateString: '2026-03-27',
        error: null,
      });
      expect(parsePetBirthDateInput('3 місяці', fixedNow)).toEqual({
        dateString: '2026-06-27',
        error: null,
      });
      expect(parsePetBirthDateInput('1 місяць', fixedNow)).toEqual({
        dateString: '2026-08-27',
        error: null,
      });
      expect(parsePetBirthDateInput('6 міс', fixedNow)).toEqual({
        dateString: '2026-03-27',
        error: null,
      });
    });

    it('converts combined age: "2 роки 3 місяці"', () => {
      expect(parsePetBirthDateInput('2 роки 3 місяці', fixedNow)).toEqual({
        dateString: '2024-06-27',
        error: null,
      });
    });

    it('converts year string "2023" to "2023-01-01"', () => {
      expect(parsePetBirthDateInput('2023', fixedNow)).toEqual({
        dateString: '2023-01-01',
        error: null,
      });
    });

    it('converts standard date formats DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD', () => {
      expect(parsePetBirthDateInput('15.05.2024', fixedNow)).toEqual({
        dateString: '2024-05-15',
        error: null,
      });
      expect(parsePetBirthDateInput('15/05/2024', fixedNow)).toEqual({
        dateString: '2024-05-15',
        error: null,
      });
      expect(parsePetBirthDateInput('2024-05-15', fixedNow)).toEqual({
        dateString: '2024-05-15',
        error: null,
      });
    });

    it('returns null dateString for empty or whitespace inputs', () => {
      expect(parsePetBirthDateInput('', fixedNow)).toEqual({ dateString: null, error: null });
      expect(parsePetBirthDateInput('   ', fixedNow)).toEqual({ dateString: null, error: null });
      expect(parsePetBirthDateInput(null, fixedNow)).toEqual({ dateString: null, error: null });
      expect(parsePetBirthDateInput(undefined, fixedNow)).toEqual({ dateString: null, error: null });
    });

    it('flags invalid calendar dates, future dates, and unrealistic ages', () => {
      expect(parsePetBirthDateInput('32.05.2024', fixedNow).error).toBe(
        'Вкажіть коректну дату (день від 1 до 31, місяць від 1 до 12)'
      );
      expect(parsePetBirthDateInput('2030-01-01', fixedNow).error).toBe(
        'Дата народження не може бути в майбутньому'
      );
      expect(parsePetBirthDateInput('2030', fixedNow).error).toBe(
        'Рік народження не може бути в майбутньому'
      );
      expect(parsePetBirthDateInput('100', fixedNow).error).toBe(
        'Вкажіть реалістичний вік тваринки (до 40 років)'
      );
      expect(parsePetBirthDateInput('невідомо', fixedNow).error).toBe(
        'Вкажіть коректну дату народження або вік (наприклад, 15.05.2022 або 2 роки)'
      );
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
      const { supabase } = await import('@/lib/supabase');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { user: { id: 'user-789' } } },
        error: null,
      } as never);

      const selectMock = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'pet-123' }, error: null }),
      });
      const insertMock = vi.fn().mockReturnValue({
        select: selectMock,
      });
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

    it('blocks submission when unauthenticated and displays error', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      } as never);

      const handleSuccess = vi.fn();
      render(<PetRegisterPage onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByLabelText('Кличка тваринки'), { target: { value: 'Арчі' } });
      fireEvent.change(screen.getByLabelText('Порода'), { target: { value: 'Коргі' } });

      const submitBtn = screen.getByRole('button', { name: 'Зберегти' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert.textContent).toBe('Необхідно авторизуватися для реєстрації тваринки');
      expect(handleSuccess).not.toHaveBeenCalled();
    });

    it('normalizes age input "2" to valid ISO date string on submit and sends to Supabase', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { user: { id: 'user-789' } } },
        error: null,
      } as never);

      const selectMock = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'pet-123' }, error: null }),
      });
      const insertMock = vi.fn().mockReturnValue({
        select: selectMock,
      });
      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: insertMock,
      } as never);

      const handleSuccess = vi.fn();
      render(<PetRegisterPage onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByLabelText('Кличка тваринки'), { target: { value: 'Барон' } });
      fireEvent.change(screen.getByLabelText('Дата народження / Вік'), { target: { value: '2' } });

      const submitBtn = screen.getByRole('button', { name: 'Зберегти' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_id: 'user-789',
          name: 'Барон',
          birth_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );

      const calledBirthDate = insertMock.mock.calls[0][0].birth_date;
      expect(calledBirthDate).not.toBe('2');
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });

    it('displays validation error and prevents insert when invalid birth date is entered', async () => {
      const { supabase } = await import('@/lib/supabase');
      const insertMock = vi.fn();
      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: insertMock,
      } as never);

      render(<PetRegisterPage />);

      fireEvent.change(screen.getByLabelText('Кличка тваринки'), { target: { value: 'Барон' } });
      fireEvent.change(screen.getByLabelText('Дата народження / Вік'), { target: { value: 'невідомо' } });

      const submitBtn = screen.getByRole('button', { name: 'Зберегти' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert.textContent).toBe('Вкажіть коректну дату народження або вік (наприклад, 15.05.2022 або 2 роки)');
      expect(insertMock).not.toHaveBeenCalled();
    });

    it('displays error and stops when storage upload fails', async () => {
      const { supabase } = await import('@/lib/supabase');
      const handleSuccess = vi.fn();
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'user-789' } as never },
        error: null,
      });

      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'pet-123' },
              error: null,
            }),
          }),
        }),
      } as never);

      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage policy violation' },
        }),
      } as never);

      render(<PetRegisterPage onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByLabelText('Кличка тваринки'), { target: { value: 'Барон' } });
      const file = new File(['dummy'], 'dog.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole('button', { name: 'Зберегти' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert.textContent).toBe('Storage policy violation');
      expect(handleSuccess).not.toHaveBeenCalled();
    });

    it('uploads photo to storage and inserts row into pet_media on success', async () => {
      const { supabase } = await import('@/lib/supabase');
      const handleSuccess = vi.fn();
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'user-789' } as never },
        error: null,
      });

      const mediaInsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pets') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'pet-123' },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        if (table === 'pet_media') {
          return {
            insert: mediaInsertMock,
          } as never;
        }
        return {} as never;
      });

      const storageUploadMock = vi.fn().mockResolvedValue({
        data: { path: 'pet-123/file.jpg' },
        error: null,
      });
      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: storageUploadMock,
      } as never);

      render(<PetRegisterPage onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByLabelText('Кличка тваринки'), { target: { value: 'Барон' } });
      const file = new File(['dummy'], 'dog.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole('button', { name: 'Зберегти' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(storageUploadMock).toHaveBeenCalledTimes(1);
      expect(mediaInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pet_id: 'pet-123',
          photo_type: 'general',
          created_by: 'user-789',
        })
      );
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
