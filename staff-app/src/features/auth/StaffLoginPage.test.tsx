import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffLoginPage from './StaffLoginPage';
import { supabase } from '@/lib/supabase';

describe('StaffLoginPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders staff portal login form correctly', () => {
    render(<StaffLoginPage />);

    expect(screen.getByText('Вхід для співробітників')).toBeDefined();
    expect(screen.getByText('Адміністратори, Рецепція, Майстри')).toBeDefined();
    expect(screen.getByLabelText(/Email або номер телефону/i)).toBeDefined();
    expect(screen.getByLabelText('Пароль')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Увійти до панелі' })).toBeDefined();
  });

  it('toggles password visibility', () => {
    render(<StaffLoginPage />);

    const passwordInput = screen.getByLabelText('Пароль') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText('Показати пароль');
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(screen.getByLabelText('Сховати пароль'));
    expect(passwordInput.type).toBe('password');
  });

  it('validates empty inputs on submit', async () => {
    render(<StaffLoginPage />);

    const submitBtn = screen.getByRole('button', { name: 'Увійти до панелі' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Введіть email або номер телефону')).toBeDefined();
  });

  it('validates empty password when identifier is provided', async () => {
    render(<StaffLoginPage />);

    const idInput = screen.getByLabelText(/Email або номер телефону/i);
    fireEvent.change(idInput, { target: { value: 'staff@example.com' } });

    const submitBtn = screen.getByRole('button', { name: 'Увійти до панелі' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Введіть пароль')).toBeDefined();
  });

  it('rejects client users with informative message and link to customer app', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: {
        user: {
          id: 'client-user-123',
          email: 'client@example.com',
          user_metadata: { role: 'client' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });

    render(<StaffLoginPage clientAppUrl="http://localhost:3000" />);

    fireEvent.change(screen.getByLabelText(/Email або номер телефону/i), {
      target: { value: 'client@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'Secret123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Увійти до панелі' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Цей портал призначений виключно для персоналу (адміністраторів, рецепції та майстрів).'
        )
      ).toBeDefined();
    });

    expect(screen.getByText('Перейти до клієнтського сайту')).toBeDefined();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('successfully logs in authorized staff (receptionist)', async () => {
    const handleSuccess = vi.fn();
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: {
        user: {
          id: 'staff-receptionist-1',
          email: 'reception@example.com',
          user_metadata: { role: 'receptionist' },
        },
      },
      error: null,
    } as never);

    render(<StaffLoginPage onSuccess={handleSuccess} />);

    fireEvent.change(screen.getByLabelText(/Email або номер телефону/i), {
      target: { value: 'reception@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StaffSecret123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Увійти до панелі' }));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('handles invalid credentials error message', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    } as never);

    render(<StaffLoginPage />);

    fireEvent.change(screen.getByLabelText(/Email або номер телефону/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'WrongPass!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Увійти до панелі' }));

    await waitFor(() => {
      expect(screen.getByText('Невірний логін або пароль')).toBeDefined();
    });
  });
});
