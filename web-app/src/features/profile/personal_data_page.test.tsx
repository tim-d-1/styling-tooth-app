import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PersonalDataPage from './PersonalDataPage';
import { supabase } from '@/lib/supabase';

describe('PersonalDataPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders breadcrumbs and triggers navigation callbacks', async () => {
    const handleHome = vi.fn();
    const handleProfile = vi.fn();

    render(
      <MemoryRouter>
        <PersonalDataPage
          onHomeClick={handleHome}
          onProfileClick={handleProfile}
          initialData={{ fullName: 'Олена Петренко' }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Навігація по сайту' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Особисті дані' })).toBeDefined();

    fireEvent.click(screen.getByText('Головна'));
    expect(handleHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Особистий кабінет'));
    expect(handleProfile).toHaveBeenCalledTimes(1);
  });

  it('renders mini profile card with user avatar, name, and VIP badge', async () => {
    render(
      <MemoryRouter>
        <PersonalDataPage
          initialData={{
            fullName: 'Катерина Ковальчук',
            avatarUrl: 'https://example.com/kateryna.jpg',
            isVip: true,
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('region', { name: 'Картка користувача' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Катерина' })).toBeDefined();
    expect(screen.getByTestId('vip-badge')).toBeDefined();

    const avatar = screen.getByRole('img', { name: 'Катерина Ковальчук' });
    expect(avatar.getAttribute('src')).toBe('https://example.com/kateryna.jpg');

    fireEvent.error(avatar);
    expect(avatar.getAttribute('src')).toBe('/assets/images/default-avatar.svg');
  });

  it('triggers avatar upload when edit button is clicked and handles file change', async () => {
    const handleToast = vi.fn();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-avatar-url');

    const { container } = render(
      <MemoryRouter>
        <PersonalDataPage onToast={handleToast} initialData={{ fullName: 'Катерина' }} />
      </MemoryRouter>
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();

    const clickSpy = vi.spyOn(fileInput, 'click');
    const editBtn = screen.getByRole('button', { name: 'Змінити аватар' });
    fireEvent.click(editBtn);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const testFile = new File(['mock-image-bytes'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(createObjectURLSpy).toHaveBeenCalledWith(testFile);
    expect(handleToast).toHaveBeenCalledWith('Аватар оновлено');

    createObjectURLSpy.mockRestore();
  });

  it('renders sidebar navigation items and handles clicks', async () => {
    const handleAddresses = vi.fn();
    const handlePaymentMethods = vi.fn();
    const handleLogout = vi.fn();
    const handleToast = vi.fn();
    const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <PersonalDataPage
          onAddressesClick={handleAddresses}
          onPaymentMethodsClick={handlePaymentMethods}
          onLogout={handleLogout}
          onToast={handleToast}
          initialData={{ fullName: 'Катерина' }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Меню профілю' })).toBeDefined();

    fireEvent.click(screen.getByText('Мої адреси'));
    expect(handleAddresses).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Способи оплати'));
    expect(handlePaymentMethodsClick(handlePaymentMethods));
    expect(handlePaymentMethods).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Вийти з акаунту' }));
    });

    expect(signOutSpy).toHaveBeenCalledTimes(1);
    expect(handleLogout).toHaveBeenCalledTimes(1);
    expect(handleToast).toHaveBeenCalledWith('Ви вийшли з акаунту');
  });

  function handlePaymentMethodsClick(fn: () => void) {
    return fn;
  }

  it('toggles and edits form fields: name, gender, email, and birth date', async () => {
    render(
      <MemoryRouter>
        <PersonalDataPage
          initialData={{
            fullName: 'Катерина Ковальчук',
            gender: 'Жіноча',
            email: 'kateryna@example.com',
            birthDate: '14 Травня 1995',
            phone: '+380 (97) 123 45 67',
            isPhoneVerified: true,
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Катерина Ковальчук')).toBeDefined();
    expect(screen.getByText('Жіноча')).toBeDefined();
    expect(screen.getByText('+380 (97) 123 45 67')).toBeDefined();
    expect(screen.getByTestId('phone-verified-badge')).toBeDefined();
    expect(screen.getByText('kateryna@example.com')).toBeDefined();
    expect(screen.getByText('14 Травня 1995')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: "Редагувати Ім'я та Прізвище" }));
    const nameInput = screen.getByLabelText("Ім'я та Прізвище") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Катерина Шевченко' } });
    expect(nameInput.value).toBe('Катерина Шевченко');

    fireEvent.click(screen.getByRole('button', { name: 'Редагувати Стать' }));
    const genderSelect = screen.getByLabelText('Стать') as HTMLSelectElement;
    fireEvent.change(genderSelect, { target: { value: 'Не вказано' } });
    expect(genderSelect.value).toBe('Не вказано');

    fireEvent.click(screen.getByRole('button', { name: 'Редагувати Електронну пошту' }));
    const emailInput = screen.getByLabelText('Електронна пошта') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'new.email@example.com' } });
    expect(emailInput.value).toBe('new.email@example.com');

    fireEvent.click(screen.getByRole('button', { name: 'Редагувати Дату народження' }));
    const birthDateInput = screen.getByLabelText('Дата народження') as HTMLInputElement;
    fireEvent.change(birthDateInput, { target: { value: '15 Червня 1996' } });
    expect(birthDateInput.value).toBe('15 Червня 1996');
  });

  it('saves changes and updates user in Supabase and triggers onSave callback', async () => {
    const handleSave = vi.fn();
    const handleToast = vi.fn();

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'usr-save-1' },
        },
      },
      error: null,
    } as never);

    const updateProfileMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      update: updateProfileMock,
    } as never);

    const updateUserSpy = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    render(
      <MemoryRouter>
        <PersonalDataPage
          onSave={handleSave}
          onToast={handleToast}
          initialData={{
            fullName: 'Олена Сидоренко',
            gender: 'Жіноча',
            email: 'olena@example.com',
            birthDate: '20 Січня 1998',
            phone: '+380 (50) 999 88 77',
            isPhoneVerified: true,
          }}
        />
      </MemoryRouter>
    );

    const saveButton = screen.getByRole('button', { name: 'Зберегти зміни' });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(updateProfileMock).toHaveBeenCalled();
    expect(updateUserSpy).toHaveBeenCalledWith({
      data: {
        full_name: 'Олена Сидоренко',
        gender: 'Жіноча',
        birth_date: '20 Січня 1998',
      },
    });

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Олена Сидоренко',
        gender: 'Жіноча',
        email: 'olena@example.com',
      })
    );

    expect(handleToast).toHaveBeenCalledWith('Зміни успішно збережено');
  });

  it('loads user data automatically from supabase when initialData is not provided', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'usr-fetch-1',
            email: 'fetched.auth@example.com',
            user_metadata: {
              full_name: 'Наталія Мельник',
              gender: 'Жіноча',
              birth_date: '01 Травня 1992',
              avatar_url: 'https://example.com/avatar.jpg',
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
                  full_name: 'Наталія Мельник',
                  email: 'fetched.profile@example.com',
                  phone: '+380 (67) 555 44 33',
                  avatar_url: 'https://example.com/avatar.jpg',
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
          <PersonalDataPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Наталія Мельник')).toBeDefined();
    expect(screen.getByText('fetched.profile@example.com')).toBeDefined();
    expect(screen.getByText('+380 (67) 555 44 33')).toBeDefined();
  });
});
