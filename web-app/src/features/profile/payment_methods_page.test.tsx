import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaymentMethodsPage from './PaymentMethodsPage';
import { supabase } from '@/lib/supabase';

describe('PaymentMethodsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders breadcrumbs and triggers navigation callbacks', async () => {
    const handleHome = vi.fn();
    const handleProfile = vi.fn();

    render(
      <MemoryRouter>
        <PaymentMethodsPage
          onHomeClick={handleHome}
          onProfileClick={handleProfile}
          initialUserData={{ fullName: 'Олена Петренко' }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Навігація по сайту' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Способи оплати' })).toBeDefined();

    fireEvent.click(screen.getByText('Головна'));
    expect(handleHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Особистий кабінет'));
    expect(handleProfile).toHaveBeenCalledTimes(1);
  });

  it('renders sidebar with active payment-methods tab and handles clicks', async () => {
    const handlePersonalData = vi.fn();
    const handleAddresses = vi.fn();
    const handleLogout = vi.fn();
    const handleToast = vi.fn();
    const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <PaymentMethodsPage
          onPersonalDataClick={handlePersonalData}
          onAddressesClick={handleAddresses}
          onLogout={handleLogout}
          onToast={handleToast}
          initialUserData={{
            fullName: 'Катерина Ковальчук',
            avatarUrl: 'https://example.com/katya.png',
            isVip: true,
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('region', { name: 'Картка користувача' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Катерина' })).toBeDefined();
    expect(screen.getByTestId('vip-badge')).toBeDefined();

    fireEvent.click(screen.getByText('Особисті дані'));
    expect(handlePersonalData).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Мої адреси'));
    expect(handleAddresses).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Вийти з акаунту' }));
    });

    expect(signOutSpy).toHaveBeenCalledTimes(1);
    expect(handleLogout).toHaveBeenCalledTimes(1);
    expect(handleToast).toHaveBeenCalledWith('Ви вийшли з акаунту');
  });

  it('renders saved payment methods and allows switching default', async () => {
    const handleToast = vi.fn();
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: 'usr-pm-1' } } },
      error: null,
    } as never);
    const updateUserSpy = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    render(
      <MemoryRouter>
        <PaymentMethodsPage onToast={handleToast} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Збережені способи' })).toBeDefined();
    expect(screen.getByText('Apple Pay')).toBeDefined();
    expect(screen.getByText('Основний спосіб')).toBeDefined();
    expect(screen.getByText('•••• 4821')).toBeDefined();

    const cardMethod = screen.getByTestId('payment-method-pm-card-4821');
    await act(async () => {
      fireEvent.click(cardMethod);
    });

    expect(updateUserSpy).toHaveBeenCalled();
    expect(handleToast).toHaveBeenCalledWith('Основний спосіб оплати оновлено');
  });

  it('allows deleting a card payment method', async () => {
    const handleToast = vi.fn();
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: 'usr-pm-2' } } },
      error: null,
    } as never);
    vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    render(
      <MemoryRouter>
        <PaymentMethodsPage onToast={handleToast} />
      </MemoryRouter>
    );

    const deleteBtn = screen.getByRole('button', { name: /Видалити картку •••• 4821/i });
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(screen.queryByText('•••• 4821')).toBeNull();
    expect(handleToast).toHaveBeenCalledWith('Спосіб оплати видалено');
  });

  it('validates and adds a new card, updating Supabase user metadata', async () => {
    const handleAddCard = vi.fn();
    const handleToast = vi.fn();

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: 'usr-pm-3' } } },
      error: null,
    } as never);
    const updateUserSpy = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    render(
      <MemoryRouter>
        <PaymentMethodsPage onAddCard={handleAddCard} onToast={handleToast} />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: 'Додати картку' });

    fireEvent.click(submitBtn);
    expect(handleToast).toHaveBeenCalledWith('Введіть коректний 16-значний номер картки');

    const cardInput = screen.getByLabelText('Номер картки') as HTMLInputElement;
    fireEvent.change(cardInput, { target: { value: '4149499912345678' } });
    expect(cardInput.value).toBe('4149 4999 1234 5678');

    fireEvent.click(submitBtn);
    expect(handleToast).toHaveBeenCalledWith('Введіть термін дії у форматі MM/YY');

    const expiryInput = screen.getByLabelText('Термін (MM/YY)') as HTMLInputElement;
    fireEvent.change(expiryInput, { target: { value: '0928' } });
    expect(expiryInput.value).toBe('09/28');

    fireEvent.click(submitBtn);
    expect(handleToast).toHaveBeenCalledWith('Введіть 3 цифри CVV/CVC');

    const cvvInput = screen.getByLabelText('CVV / CVC') as HTMLInputElement;
    fireEvent.change(cvvInput, { target: { value: '789' } });
    expect(cvvInput.value).toBe('789');

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(updateUserSpy).toHaveBeenCalled();
    expect(handleAddCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '•••• 5678',
        last4: '5678',
        expiry: '09/28',
      })
    );
    expect(handleToast).toHaveBeenCalledWith('Картку успішно додано');
    expect(screen.getByText('•••• 5678')).toBeDefined();
  });

  it('renders recent transactions and triggers receipt download', async () => {
    const handleDownload = vi.fn();
    const handleToast = vi.fn();

    render(
      <MemoryRouter>
        <PaymentMethodsPage onDownloadReceipt={handleDownload} onToast={handleToast} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Останні транзакції' })).toBeDefined();
    expect(screen.getByText('СПА-комплекс (Барон)')).toBeDefined();
    expect(screen.getByText('20 Липня 2026 · 14:30')).toBeDefined();
    expect(screen.getByText('1 200 грн')).toBeDefined();
    expect(screen.getByText('Експрес-лінька (Барон)')).toBeDefined();
    expect(screen.getByText('Гігієнічний догляд (Луна)')).toBeDefined();

    const downloadButtons = screen.getAllByRole('button', { name: /Завантажити чек/i });
    fireEvent.click(downloadButtons[0]);
    expect(handleDownload).toHaveBeenCalledWith('tx-1');
    expect(handleToast).toHaveBeenCalledWith('Чек завантажено');
  });

  it('loads user data and saved methods from supabase when not provided', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'usr-pm-fetch',
            user_metadata: {
              full_name: 'Оксана Мороз',
              avatar_url: 'https://example.com/oksana.png',
              payment_methods: [
                {
                  id: 'pm-fetch-1',
                  type: 'card',
                  title: '•••• 9999',
                  subtitle: 'Термін: 11/29',
                  isDefault: true,
                },
              ],
            },
          },
        },
      },
      error: null,
    } as never);

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  full_name: 'Оксана Мороз',
                  avatar_url: 'https://example.com/oksana.png',
                },
              }),
            }),
          }),
        } as never;
      }
      return {} as never;
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <PaymentMethodsPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Оксана' })).toBeDefined();
    expect(screen.getByText('•••• 9999')).toBeDefined();
  });
});
