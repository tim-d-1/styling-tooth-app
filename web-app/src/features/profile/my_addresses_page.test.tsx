import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyAddressesPage from './MyAddressesPage';
import { supabase } from '@/lib/supabase';

describe('MyAddressesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders breadcrumbs and triggers navigation callbacks', async () => {
    const handleHome = vi.fn();
    const handleProfile = vi.fn();

    render(
      <MemoryRouter>
        <MyAddressesPage
          onHomeClick={handleHome}
          onProfileClick={handleProfile}
          initialUserData={{ fullName: 'Олена Петренко' }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Навігація по сайту' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Мої Адреси' })).toBeDefined();

    fireEvent.click(screen.getByText('Головна'));
    expect(handleHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Особистий кабінет'));
    expect(handleProfile).toHaveBeenCalledTimes(1);
  });

  it('renders sidebar with active addresses item and mini profile card', async () => {
    const handlePersonalData = vi.fn();
    const handleLogout = vi.fn();
    const handleToast = vi.fn();
    const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <MyAddressesPage
          onPersonalDataClick={handlePersonalData}
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

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Вийти з акаунту' }));
    });

    expect(signOutSpy).toHaveBeenCalledTimes(1);
    expect(handleLogout).toHaveBeenCalledTimes(1);
    expect(handleToast).toHaveBeenCalledWith('Ви вийшли з акаунту');
  });

  it('renders pet taxi map card', async () => {
    render(
      <MemoryRouter>
        <MyAddressesPage />
      </MemoryRouter>
    );

    const mapCard = screen.getByTestId('pet-taxi-map-card');
    expect(mapCard).toBeDefined();
    const mapImg = screen.getByRole('img', { name: 'Маршрут Pet-таксі' });
    expect(mapImg.getAttribute('src')).toBe('/assets/images/pet-taxi-route-map.webp');
  });

  it('handles address form inputs and checkbox toggle', async () => {
    render(
      <MemoryRouter>
        <MyAddressesPage
          initialAddress={{
            street: 'вул. Хрещатик, 15',
            apartment: '42',
            entranceFloor: "1 під'їзд, 3 пов.",
            isDefaultTransfer: true,
            label: 'Дім',
          }}
        />
      </MemoryRouter>
    );

    const streetInput = screen.getByLabelText('Вулиця та будинок') as HTMLInputElement;
    expect(streetInput.value).toBe('вул. Хрещатик, 15');
    fireEvent.change(streetInput, { target: { value: 'вул. Велика Васильківська, 20' } });
    expect(streetInput.value).toBe('вул. Велика Васильківська, 20');

    const aptInput = screen.getByLabelText('Кв. / Офіс') as HTMLInputElement;
    expect(aptInput.value).toBe('42');
    fireEvent.change(aptInput, { target: { value: '105' } });
    expect(aptInput.value).toBe('105');

    const entranceInput = screen.getByLabelText("Під'їзд / Поверх") as HTMLInputElement;
    expect(entranceInput.value).toBe("1 під'їзд, 3 пов.");
    fireEvent.change(entranceInput, { target: { value: "2 під'їзд, 5 пов." } });
    expect(entranceInput.value).toBe("2 під'їзд, 5 пов.");

    const checkbox = screen.getByRole('checkbox', {
      name: 'Зробити основною адресою для трансферу',
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('switches address labels and adds a new custom label', async () => {
    render(
      <MemoryRouter>
        <MyAddressesPage />
      </MemoryRouter>
    );

    const officeBtn = screen.getByRole('button', { name: /Офіс/i });
    fireEvent.click(officeBtn);

    const addLabelBtn = screen.getByRole('button', { name: 'Додати назву адреси' });
    fireEvent.click(addLabelBtn);

    const labelInput = screen.getByLabelText('Нова назва адреси') as HTMLInputElement;
    fireEvent.change(labelInput, { target: { value: 'Дача' } });

    const confirmBtn = screen.getByRole('button', { name: 'Підтвердити додавання мітки' });
    fireEvent.click(confirmBtn);

    expect(screen.getByRole('button', { name: /Дача/i })).toBeDefined();
  });

  it('saves address to supabase and fires callbacks and toast', async () => {
    const handleSelectAddress = vi.fn();
    const handleToast = vi.fn();

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'usr-address-1' },
        },
      },
      error: null,
    } as never);

    const updateUserSpy = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    render(
      <MemoryRouter>
        <MyAddressesPage
          onSelectAddress={handleSelectAddress}
          onToast={handleToast}
          initialAddress={{
            street: 'вул. Мечникова, 5',
            apartment: '12',
            entranceFloor: '1 пов.',
            label: 'Дім',
            isDefaultTransfer: true,
          }}
        />
      </MemoryRouter>
    );

    const saveButton = screen.getByRole('button', { name: 'Обрати адресу' });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(updateUserSpy).toHaveBeenCalledWith({
      data: {
        address: expect.objectContaining({
          street: 'вул. Мечникова, 5',
          apartment: '12',
        }),
        addresses: [
          expect.objectContaining({
            street: 'вул. Мечникова, 5',
            apartment: '12',
          }),
        ],
      },
    });

    expect(handleSelectAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        street: 'вул. Мечникова, 5',
        apartment: '12',
      })
    );

    expect(handleToast).toHaveBeenCalledWith('Адресу успішно збережено');
  });

  it('loads user and address data from supabase when initialData is not provided', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'usr-address-fetch',
            user_metadata: {
              full_name: 'Ольга Іванова',
              avatar_url: 'https://example.com/olga.png',
              address: {
                street: 'вул. Саксаганського, 10',
                apartment: '3',
                entranceFloor: '2 пов.',
                label: 'Офіс',
                isDefaultTransfer: false,
              },
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
                  full_name: 'Ольга Іванова',
                  avatar_url: 'https://example.com/olga.png',
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
          <MyAddressesPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Ольга' })).toBeDefined();
    const streetInput = screen.getByLabelText('Вулиця та будинок') as HTMLInputElement;
    expect(streetInput.value).toBe('вул. Саксаганського, 10');
  });
});
