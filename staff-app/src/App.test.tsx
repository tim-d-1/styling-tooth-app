import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StaffAppRoutes } from './App';
import { supabase } from '@/lib/supabase';
import { StaffAuthProvider } from '@/features/auth/StaffAuthProvider';
import { MemoryRouter } from 'react-router-dom';

describe('Staff App Routing & Access Control', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(supabase, 'channel').mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn().mockResolvedValue('ok'),
    } as never);
    vi.spyOn(supabase, 'removeChannel').mockResolvedValue('ok' as never);
  });

  it('redirects unauthenticated user visiting /requests to /login', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    render(
      <StaffAuthProvider>
        <MemoryRouter initialEntries={['/requests']}>
          <StaffAppRoutes />
        </MemoryRouter>
      </StaffAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Вхід для співробітників')).toBeDefined();
    });
  });

  it('redirects unauthenticated user visiting /support to /login', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    render(
      <StaffAuthProvider>
        <MemoryRouter initialEntries={['/support']}>
          <StaffAppRoutes />
        </MemoryRouter>
      </StaffAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Вхід для співробітників')).toBeDefined();
    });
  });

  it('renders RequestProcessingPage for authenticated receptionist', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'staff-receptionist-1', email: 'reception@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: {
        user: {
          id: 'staff-receptionist-1',
          email: 'reception@example.com',
          user_metadata: { role: 'receptionist' },
        },
      },
      error: null,
    } as never);

    render(
      <StaffAuthProvider initialRole="receptionist" initialProfile={{
        id: 'staff-receptionist-1',
        email: 'reception@example.com',
        role: 'receptionist',
        fullName: 'Рецепція Головна',
        phone: '+380501112233',
        avatarUrl: null,
      }}>
        <MemoryRouter initialEntries={['/requests']}>
          <StaffAppRoutes />
        </MemoryRouter>
      </StaffAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Обробка заявок')).toBeDefined();
      expect(screen.getByText('Рецепція')).toBeDefined();
    });
  });

  it('renders AdminSupportPage for authenticated admin', async () => {
    render(
      <StaffAuthProvider initialRole="admin" initialProfile={{
        id: 'staff-admin-1',
        email: 'admin@example.com',
        role: 'admin',
        fullName: 'Головний Адміністратор',
        phone: '+380509998877',
        avatarUrl: null,
      }}>
        <MemoryRouter initialEntries={['/support']}>
          <StaffAppRoutes />
        </MemoryRouter>
      </StaffAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Служба підтримки')).toBeDefined();
      expect(screen.getByText('Адміністратор')).toBeDefined();
    });
  });

  it('allows tab switching between Requests and Support', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'staff-receptionist-1', email: 'reception@example.com' },
        },
      },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: {
        user: {
          id: 'staff-receptionist-1',
          email: 'reception@example.com',
          user_metadata: { role: 'receptionist' },
        },
      },
      error: null,
    } as never);

    render(
      <StaffAuthProvider initialRole="receptionist" initialProfile={{
        id: 'staff-receptionist-1',
        email: 'reception@example.com',
        role: 'receptionist',
        fullName: 'Рецепція',
        phone: '+380501112233',
        avatarUrl: null,
      }}>
        <MemoryRouter initialEntries={['/requests']}>
          <StaffAppRoutes />
        </MemoryRouter>
      </StaffAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Обробка заявок')).toBeDefined();
    });

    const supportNavBtn = screen.getByRole('button', { name: /Підтримка/i });
    fireEvent.click(supportNavBtn);

    await waitFor(() => {
      expect(screen.getByText('Служба підтримки')).toBeDefined();
    });
  });
});
