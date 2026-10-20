import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StaffHeader from './StaffHeader';
import { StaffAuthProvider } from '@/features/auth/StaffAuthProvider';

describe('StaffHeader Component', () => {
  it('renders branding, active tabs, and user info', async () => {
    const handleNavigate = vi.fn();
    const handleLogout = vi.fn();

    await act(async () => {
      render(
        <StaffAuthProvider
          initialRole="receptionist"
          initialProfile={{
            id: 'user-1',
            email: 'maria@example.com',
            fullName: 'Марія Коваль',
            role: 'receptionist',
            phone: null,
            avatarUrl: null,
          }}
        >
          <StaffHeader
            activeTab="requests"
            onNavigateTab={handleNavigate}
            onLogout={handleLogout}
          />
        </StaffAuthProvider>
      );
    });

    expect(screen.getByText('Стильний Зубець')).toBeDefined();
    expect(screen.getByText('Staff Portal')).toBeDefined();
    expect(screen.getByText('Марія Коваль')).toBeDefined();
    expect(screen.getByText('maria@example.com')).toBeDefined();

    const requestsTab = screen.getByRole('button', { name: /Заявки/i });
    const supportTab = screen.getByRole('button', { name: /Підтримка/i });

    expect(requestsTab.getAttribute('aria-current')).toBe('page');
    expect(supportTab.getAttribute('aria-current')).toBeNull();

    await act(async () => {
      fireEvent.click(supportTab);
    });
    expect(handleNavigate).toHaveBeenCalledWith('support');

    const logoutBtn = screen.getByRole('button', { name: /Вийти/i });
    await act(async () => {
      fireEvent.click(logoutBtn);
    });
    expect(handleLogout).toHaveBeenCalled();
  });

  it('does not render role badge or link to client app', async () => {
    await act(async () => {
      render(
        <StaffAuthProvider
          initialRole="receptionist"
          initialProfile={{
            id: 'user-2',
            email: 'admin@example.com',
            fullName: 'Оксана Петренко',
            role: 'receptionist',
            phone: null,
            avatarUrl: null,
          }}
        >
          <StaffHeader
            activeTab="support"
            onNavigateTab={vi.fn()}
            onLogout={vi.fn()}
          />
        </StaffAuthProvider>
      );
    });

    expect(screen.queryByText('Рецепція')).toBeNull();
    expect(screen.queryByText('Адміністратор')).toBeNull();
    expect(screen.queryByText('Майстер')).toBeNull();
    expect(screen.queryByText('Клієнтський сайт')).toBeNull();
    expect(document.querySelector('.bg-amber-50')).toBeNull();
    expect(document.querySelector('.border-amber-200')).toBeNull();
  });
});
