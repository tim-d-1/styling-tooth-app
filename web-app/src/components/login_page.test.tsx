import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './LoginPage';
import { validateLoginForm, isEmailIdentifier } from './login_utils';

describe('LoginPage and Login Utilities', () => {
  describe('validateLoginForm', () => {
    it('validates minimum username length', () => {
      const result = validateLoginForm('ab', 'test@example.com', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Ім’я користувача повинно містити не менше 3 символів');
    });

    it('validates empty identifier', () => {
      const result = validateLoginForm('user123', '', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть Email або номер телефону');
    });

    it('validates empty password', () => {
      const result = validateLoginForm('user123', 'test@example.com', '   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Введіть пароль');
    });

    it('validates password length', () => {
      const result = validateLoginForm('user123', 'test@example.com', '12345');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Пароль повинен містити не менше 6 символів');
    });

    it('approves valid form inputs', () => {
      const result = validateLoginForm('Marichka_bkk', 'bulakhmaria@gmail.com', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('allows empty optional username if identifier and password are valid', () => {
      const result = validateLoginForm('', 'bulakhmaria@gmail.com', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('isEmailIdentifier', () => {
    it('correctly identifies valid emails', () => {
      expect(isEmailIdentifier('bulakhmaria@gmail.com')).toBe(true);
      expect(isEmailIdentifier('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('correctly identifies non-emails', () => {
      expect(isEmailIdentifier('+380501234567')).toBe(false);
      expect(isEmailIdentifier('Marichka_bkk')).toBe(false);
      expect(isEmailIdentifier('invalid-email@')).toBe(false);
    });
  });

  describe('LoginPage Component', () => {
    it('renders form elements, handles inputs and language toggle', () => {
      const handleBack = vi.fn();
      const handleRegister = vi.fn();
      render(
        <LoginPage
          onBack={handleBack}
          onNavigateRegister={handleRegister}
          defaultUsername=""
          defaultIdentifier=""
        />
      );

      const usernameInput = screen.getByLabelText('ім’я користувача');
      const identifierInput = screen.getByLabelText('Email/номер телефону');
      const passwordInput = screen.getByLabelText('Пароль');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(identifierInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'secret123' } });

      expect((usernameInput as HTMLInputElement).value).toBe('testuser');
      expect((identifierInput as HTMLInputElement).value).toBe('user@example.com');
      expect((passwordInput as HTMLInputElement).value).toBe('secret123');

      const langBtn = screen.getByRole('button', { name: /Змінити мову інтерфейсу/i });
      expect(langBtn.textContent).toContain('UA');
      fireEvent.click(langBtn);
      expect(langBtn.textContent).toContain('EN');

      const backBtn = screen.getByRole('button', { name: /Повернутися назад/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalled();

      const registerBtn = screen.getByRole('button', { name: /Ще не маєте акаунту/i });
      fireEvent.click(registerBtn);
      expect(handleRegister).toHaveBeenCalled();
    });

    it('shows validation error when submitted with invalid password', async () => {
      render(
        <LoginPage
          defaultUsername="testuser"
          defaultIdentifier="user@example.com"
        />
      );

      const submitBtn = screen.getByRole('button', { name: 'Далі' });
      fireEvent.click(submitBtn);

      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert.textContent).toBe('Введіть пароль');
    });

    it('toggles password visibility', () => {
      render(<LoginPage />);
      const passwordInput = screen.getByLabelText('Пароль') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleBtn = screen.getByRole('button', { name: 'Показати пароль' });
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe('text');

      const hideBtn = screen.getByRole('button', { name: 'Сховати пароль' });
      fireEvent.click(hideBtn);
      expect(passwordInput.type).toBe('password');
    });

    it('handles social login error without calling onSuccess', async () => {
      const { supabase } = await import('../lib/supabase');
      vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
        data: { provider: 'google', url: null },
        error: { name: 'AuthError', message: 'OAuth failed' } as never,
      });

      const handleSuccess = vi.fn();
      render(<LoginPage onSuccess={handleSuccess} />);

      const googleBtn = screen.getByRole('button', { name: /Увійти за допомогою Google/i });
      fireEvent.click(googleBtn);

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toBe('OAuth failed');
      expect(handleSuccess).not.toHaveBeenCalled();
    });

    it('handles social login exception without calling onSuccess', async () => {
      const { supabase } = await import('../lib/supabase');
      vi.spyOn(supabase.auth, 'signInWithOAuth').mockRejectedValueOnce(new Error('Network error'));

      const handleSuccess = vi.fn();
      render(<LoginPage onSuccess={handleSuccess} />);

      const appleBtn = screen.getByRole('button', { name: /Увійти за допомогою Apple/i });
      fireEvent.click(appleBtn);

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toBe('Network error');
      expect(handleSuccess).not.toHaveBeenCalled();
    });

    it('handles password login error without calling onSuccess', async () => {
      const { supabase } = await import('../lib/supabase');
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { name: 'AuthError', message: 'Invalid login credentials' } as never,
      });

      const handleSuccess = vi.fn();
      render(
        <LoginPage
          onSuccess={handleSuccess}
          defaultUsername="testuser"
          defaultIdentifier="user@example.com"
        />
      );

      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'wrongpass123' } });

      const submitBtn = screen.getByRole('button', { name: 'Далі' });
      fireEvent.click(submitBtn);

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toBe('Невірний логін або пароль');
      expect(handleSuccess).not.toHaveBeenCalled();
    });

    it('handles password login exception without calling onSuccess', async () => {
      const { supabase } = await import('../lib/supabase');
      vi.spyOn(supabase.auth, 'signInWithPassword').mockRejectedValueOnce(new Error('Connection timed out'));

      const handleSuccess = vi.fn();
      render(
        <LoginPage
          onSuccess={handleSuccess}
          defaultUsername="testuser"
          defaultIdentifier="user@example.com"
        />
      );

      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'secretpass123' } });

      const submitBtn = screen.getByRole('button', { name: 'Далі' });
      fireEvent.click(submitBtn);

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toBe('Connection timed out');
      expect(handleSuccess).not.toHaveBeenCalled();
    });
  });
});
