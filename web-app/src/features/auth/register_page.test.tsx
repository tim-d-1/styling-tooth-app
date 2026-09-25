import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RegisterPage from './RegisterPage';
import { validateRegisterForm, type RegisterFormData } from './register_utils';

describe('RegisterPage and Register Utilities', () => {
  describe('validateRegisterForm', () => {
    const validData: RegisterFormData = {
      firstName: 'Maria',
      lastName: 'Bulakh',
      username: 'marichka',
      identifier: 'maria@example.com',
      password: 'password123',
      city: 'м. Київ',
    };

    it('requires first name', () => {
      const result = validateRegisterForm({ ...validData, firstName: '  ' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть ім’я');
    });

    it('requires last name', () => {
      const result = validateRegisterForm({ ...validData, lastName: '' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть прізвище');
    });

    it('requires username', () => {
      const result = validateRegisterForm({ ...validData, username: '' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть ім’я користувача');
    });

    it('requires username minimum length', () => {
      const result = validateRegisterForm({ ...validData, username: 'ab' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Ім’я користувача повинно містити не менше 3 символів');
    });

    it('requires identifier', () => {
      const result = validateRegisterForm({ ...validData, identifier: '' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть Email або номер телефону');
    });

    it('requires password', () => {
      const result = validateRegisterForm({ ...validData, password: '   ' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть пароль');
    });

    it('requires password minimum length', () => {
      const result = validateRegisterForm({ ...validData, password: '12345' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Пароль повинен містити не менше 6 символів');
    });

    it('requires city', () => {
      const result = validateRegisterForm({ ...validData, city: '' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Вкажіть місто');
    });

    it('passes for complete valid data', () => {
      const result = validateRegisterForm(validData);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('RegisterPage Component', () => {
    it('renders all form fields without placeholders', () => {
      render(<RegisterPage />);

      const firstNameInput = screen.getByLabelText('ім’я');
      const lastNameInput = screen.getByLabelText('Прізвище');
      const usernameInput = screen.getByLabelText('ім’я користувача');
      const identifierInput = screen.getByLabelText('Email/номер телефону');
      const passwordInput = screen.getByLabelText('Пароль');
      const cityInput = screen.getByLabelText('місто');

      expect(firstNameInput.getAttribute('placeholder')).toBeNull();
      expect(lastNameInput.getAttribute('placeholder')).toBeNull();
      expect(usernameInput.getAttribute('placeholder')).toBeNull();
      expect(identifierInput.getAttribute('placeholder')).toBeNull();
      expect(passwordInput.getAttribute('placeholder')).toBeNull();
      expect(cityInput.getAttribute('placeholder')).toBeNull();

      expect((cityInput as HTMLInputElement).value).toBe('м. Київ');
      expect(screen.getByText('Фото тваринки')).toBeDefined();
    });

    it('renders centered legal footer text', () => {
      render(<RegisterPage />);

      expect(
        screen.getByText(
          'Входячи в акаунт або створюючи новий, ви погоджуєтеся з нашими Правилами й умовами та Політикою конфіденційності'
        )
      ).toBeDefined();

      expect(
        screen.getByText(/Усі права захищено\.\s*© 2026 Стильний зубець\./)
      ).toBeDefined();
    });

    it('toggles password visibility and handles language switch', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Пароль') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleBtn = screen.getByRole('button', { name: 'Показати пароль' });
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe('text');

      const hideBtn = screen.getByRole('button', { name: 'Сховати пароль' });
      fireEvent.click(hideBtn);
      expect(passwordInput.type).toBe('password');

      const langBtn = screen.getByRole('button', { name: /Змінити мову інтерфейсу/i });
      expect(langBtn.textContent).toContain('UA');
      fireEvent.click(langBtn);
      expect(langBtn.textContent).toContain('EN');
    });

    it('navigates on back and on login click', () => {
      const handleBack = vi.fn();
      const handleLogin = vi.fn();
      render(<RegisterPage onBack={handleBack} onNavigateLogin={handleLogin} />);

      const backBtn = screen.getByRole('button', { name: /Повернутися назад/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);

      const loginBtn = screen.getByRole('button', { name: /Вже маєте акаунт\? Увійти/i });
      fireEvent.click(loginBtn);
      expect(handleLogin).toHaveBeenCalledTimes(1);
    });

    it('handles photo upload selection and clear', () => {
      const { container } = render(<RegisterPage />);

      const file = new File(['test-image'], 'mypet.png', { type: 'image/png' });
      const fileInput = container.querySelector('#register-pet-photo') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText('mypet.png')).toBeDefined();
      expect(screen.getByRole('button', { name: 'Видалити фото' })).toBeDefined();

      const deleteBtn = screen.getByRole('button', { name: 'Видалити фото' });
      fireEvent.click(deleteBtn);

      expect(screen.queryByText('mypet.png')).toBeNull();
      expect(screen.getByText('Завантажити фото')).toBeDefined();
    });

    it('shows validation error when fields are empty', async () => {
      render(<RegisterPage />);

      const submitBtn = screen.getByRole('button', { name: 'Далі' });
      fireEvent.click(submitBtn);

      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert.textContent).toBe('Введіть ім’я');
    });

    it('submits valid form and calls onSuccess on successful signup', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: { user: { id: 'user-new' }, session: null },
        error: null,
      } as never);

      const handleSuccess = vi.fn();
      render(<RegisterPage onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByLabelText('ім’я'), { target: { value: 'Maria' } });
      fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Bulakh' } });
      fireEvent.change(screen.getByLabelText('ім’я користувача'), { target: { value: 'marichka' } });
      fireEvent.change(screen.getByLabelText('Email/номер телефону'), { target: { value: 'maria@example.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret123' } });

      const submitBtn = screen.getByRole('button', { name: 'Далі' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });

    it('displays error when signup fails', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { name: 'AuthError', message: 'User already exists' } as never,
      });

      const handleSuccess = vi.fn();
      render(<RegisterPage onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByLabelText('ім’я'), { target: { value: 'Maria' } });
      fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Bulakh' } });
      fireEvent.change(screen.getByLabelText('ім’я користувача'), { target: { value: 'marichka' } });
      fireEvent.change(screen.getByLabelText('Email/номер телефону'), { target: { value: 'maria@example.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret123' } });

      const submitBtn = screen.getByRole('button', { name: 'Далі' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert.textContent).toBe('User already exists');
      expect(handleSuccess).not.toHaveBeenCalled();
    });

    it('handles social login buttons', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
        data: { provider: 'google', url: 'https://accounts.google.com' },
        error: null,
      });

      render(<RegisterPage />);

      const googleBtn = screen.getByRole('button', { name: /Увійти за допомогою Google/i });
      await act(async () => {
        fireEvent.click(googleBtn);
      });

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      );
    });

    it('registers user with normalized phone number and triggers onSuccess on success', async () => {
      const { supabase } = await import('@/lib/supabase');
      const signUpSpy = vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: { user: { id: 'user-new' }, session: {} } as never,
        error: null,
      });

      const handleSuccess = vi.fn();
      render(<RegisterPage onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByLabelText('ім’я'), { target: { value: 'Оксана' } });
      fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Лисенко' } });
      fireEvent.change(screen.getByLabelText('ім’я користувача'), { target: { value: 'oksana' } });
      fireEvent.change(screen.getByLabelText('Email/номер телефону'), { target: { value: '0501234567' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });

      const submitBtn = screen.getByRole('button', { name: 'Далі' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(signUpSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+380501234567',
          password: 'password123',
          options: expect.objectContaining({
            data: expect.objectContaining({
              first_name: 'Оксана',
              last_name: 'Лисенко',
              full_name: 'Оксана Лисенко',
              phone: '+380501234567',
            }),
          }),
        })
      );
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });

    it('blocks phone registration on error and does NOT trigger onSuccess (auth bypass regression test)', async () => {
      const { supabase } = await import('@/lib/supabase');
      const signUpSpy = vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { name: 'AuthError', message: 'Phone number already registered' } as never,
      });

      const handleSuccess = vi.fn();
      render(<RegisterPage onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByLabelText('ім’я'), { target: { value: 'Оксана' } });
      fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Лисенко' } });
      fireEvent.change(screen.getByLabelText('ім’я користувача'), { target: { value: 'oksana' } });
      fireEvent.change(screen.getByLabelText('Email/номер телефону'), { target: { value: '+380501234567' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });

      const submitBtn = screen.getByRole('button', { name: 'Далі' });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(signUpSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+380501234567',
          password: 'password123',
        })
      );
      expect(handleSuccess).not.toHaveBeenCalled();
      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert.textContent).toBe('Phone number already registered');
    });
  });
});
