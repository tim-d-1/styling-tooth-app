import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PetCareSchedulePage from './PetCareSchedulePage';
import { supabase } from '@/lib/supabase';
import type { CareScheduleItem } from './pet_types';

describe('PetCareSchedulePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-kate-1',
            email: 'kate@example.com',
            user_metadata: {
              full_name: 'Катерина',
              avatar_url: null,
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
                  full_name: 'Катерина',
                  avatar_url: 'https://images.example.com/avatar.webp',
                },
              }),
            }),
          }),
        } as never;
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      } as never;
    });

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://storage.example.com/${path}` },
      }),
    } as never);
  });

  it('renders breadcrumbs and triggers navigation callbacks', async () => {
    const handleHome = vi.fn();
    const handleProfile = vi.fn();
    const handlePets = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage
            onHomeClick={handleHome}
            onProfileClick={handleProfile}
            onPetsClick={handlePets}
          />
        </MemoryRouter>
      );
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Графік профілактичних обробок' })
    ).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Головна' }));
    expect(handleHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Особистий кабінет' }));
    expect(handleProfile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Мої улюбленці' }));
    expect(handlePets).toHaveBeenCalledTimes(1);
  });

  it('renders upcoming treatment card and marks it as read', async () => {
    const handleToast = vi.fn();
    const testNotification = {
      id: 'notif-1',
      title: 'Найближча обробка',
      drugInfo: 'Обробка від кліщів (Bravecto)',
      dueDateText: 'через 14 днів — 15 Серпня 2026',
      isRead: false,
    };

    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage
            onToast={handleToast}
            initialNotification={testNotification}
          />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Найближча обробка')).toBeDefined();
    expect(screen.getByText('Обробка від кліщів (Bravecto)')).toBeDefined();
    expect(screen.getByText(/через 14 днів/i)).toBeDefined();

    const markReadBtn = screen.getByRole('button', {
      name: 'Позначити прочитаним',
    });
    await act(async () => {
      fireEvent.click(markReadBtn);
    });

    expect(handleToast).toHaveBeenCalledWith('Сповіщення позначено як прочитане');
    expect(screen.queryByRole('button', { name: 'Позначити прочитаним' })).toBeNull();
  });

  it('handles medical documents add button with callback', async () => {
    const handleAddDoc = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage
            onAddDocumentClick={handleAddDoc}
            initialDocumentsCount={3}
          />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Медичні документи')).toBeDefined();
    expect(screen.getByText('Завантажено 3 файли')).toBeDefined();

    const addBtn = screen.getByRole('button', { name: 'Додати' });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(handleAddDoc).toHaveBeenCalledTimes(1);
  });

  it('updates documents count and shows toast when add button is clicked without callback', async () => {
    const handleToast = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage
            onToast={handleToast}
            initialDocumentsCount={3}
          />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Завантажено 3 файли')).toBeDefined();

    const addBtn = screen.getByRole('button', { name: 'Додати' });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(screen.getByText('Завантажено 4 файли')).toBeDefined();
    expect(handleToast).toHaveBeenCalledWith('Додано новий документ');
  });

  it('filters schedule cards by tab selection', async () => {
    const filterItems: CareScheduleItem[] = [
      {
        id: 'p-1',
        title: 'Захист від бліх',
        category: 'parasites',
        badgeText: 'В нормі',
        iconName: 'fi-rr-shield-check',
      },
      {
        id: 'v-1',
        title: 'Комплексна вакцинація',
        category: 'vaccines',
        badgeText: 'В нормі',
        iconName: 'fi-rr-syringe',
      },
    ];

    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage initialItems={filterItems} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Захист від бліх')).toBeDefined();
    expect(screen.getByText('Комплексна вакцинація')).toBeDefined();

    fireEvent.click(screen.getByRole('tab', { name: 'Паразити' }));
    expect(screen.getByText('Захист від бліх')).toBeDefined();
    expect(screen.queryByText('Комплексна вакцинація')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Вакцини' }));
    expect(screen.queryByText('Захист від бліх')).toBeNull();
    expect(screen.getByText('Комплексна вакцинація')).toBeDefined();

    fireEvent.click(screen.getByRole('tab', { name: 'Всі' }));
    expect(screen.getByText('Захист від бліх')).toBeDefined();
    expect(screen.getByText('Комплексна вакцинація')).toBeDefined();
  });

  it('renders custom care schedule items', async () => {
    const customItems: CareScheduleItem[] = [
      {
        id: 'cust-1',
        title: 'Захист від бліх краплями',
        category: 'parasites',
        badgeText: 'Терміново',
        statusType: 'warning',
        drugName: 'Advantix',
        validUntilFormatted: 'до 10 Червня 2026',
        iconName: 'fi-rr-shield-check',
      },
    ];

    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage initialItems={customItems} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Захист від бліх краплями')).toBeDefined();
    expect(screen.getByText('Терміново')).toBeDefined();
    expect(screen.getByText('Advantix')).toBeDefined();
    expect(screen.getByText('до 10 Червня 2026')).toBeDefined();
  });

  it('loads user profile data on mount and updates header', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage />
        </MemoryRouter>
      );
    });

    expect(screen.getByAltText('Катерина')).toBeDefined();
  });

  it('loads cat care schedule for petId route parameter', async () => {
    const catPetId = '70000000-0000-0000-0000-000000000002';
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'pet_care_schedules') {
        return {
          select: () => ({
            eq: () => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: '80000000-0000-0000-0000-000000000001',
                    pet_id: catPetId,
                    category: 'parasites',
                    title: 'Від кліщів та бліх',
                    drug_name: 'Bravecto Plus',
                    badge_text: '✓ Захищено',
                    valid_until_formatted: 'Наступна: 15 серп.',
                    icon_name: 'fi-rr-shield-check',
                    status_text: '✓ Захищено',
                    status_type: 'success',
                    sort_order: 1,
                  },
                  {
                    id: '80000000-0000-0000-0000-000000000002',
                    pet_id: catPetId,
                    category: 'parasites',
                    title: 'Дегельмінтизація',
                    drug_name: 'Milbemax',
                    badge_text: 'Через 1 міс.',
                    valid_until_formatted: 'Наступна: 10 вер.',
                    icon_name: 'fi-rr-medicine',
                    status_text: 'Через 1 міс.',
                    status_type: 'neutral',
                    sort_order: 2,
                  },
                ],
              }),
            }),
          }),
        } as never;
      }
      return {
        select: () => ({
          eq: () => ({
            order: vi.fn().mockResolvedValue({ data: [] }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      } as never;
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/pets/${catPetId}/schedule`]}>
          <Routes>
            <Route path="/pets/:petId/schedule" element={<PetCareSchedulePage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Дегельмінтизація')).toBeDefined();
    expect(screen.getByText('Через 1 міс.')).toBeDefined();
    expect(screen.getByText('Bravecto Plus')).toBeDefined();
  });

  it('renders clean empty states when pet has no care schedules in database', async () => {
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'pet_care_schedules') {
        return {
          select: () => ({
            eq: () => ({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        } as never;
      }
      return {
        select: () => ({
          eq: () => ({
            order: vi.fn().mockResolvedValue({ data: [] }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      } as never;
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/pets/pet-empty/schedule']}>
          <Routes>
            <Route path="/pets/:petId/schedule" element={<PetCareSchedulePage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId('empty-parasites')).toBeDefined();
    expect(screen.getByText('Немає запланованих обробок від паразитів')).toBeDefined();
    expect(screen.getByTestId('empty-vaccines')).toBeDefined();
    expect(screen.getByText('Немає даних про вакцинацію')).toBeDefined();
    expect(screen.queryByTestId('upcoming-treatment-notification')).toBeNull();
  });

  it('handles document drag and drop on medical documents card', async () => {
    const handleToast = vi.fn();
    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage
            initialDocumentsCount={1}
            onToast={handleToast}
          />
        </MemoryRouter>
      );
    });

    const card = screen.getByTestId('medical-documents-card');
    const pdfFile = new File(['%PDF-1.4'], 'vet-passport.pdf', { type: 'application/pdf' });

    fireEvent.dragEnter(card, {
      dataTransfer: { items: [{ kind: 'file' }] },
    });

    fireEvent.drop(card, {
      dataTransfer: { files: [pdfFile] },
    });

    expect(screen.getByText('Завантажено 2 файли')).toBeDefined();
    expect(handleToast).toHaveBeenCalledWith('Додано новий документ');
  });

  it('handles document clipboard paste on medical documents card', async () => {
    const handleToast = vi.fn();
    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage
            initialDocumentsCount={0}
            onToast={handleToast}
          />
        </MemoryRouter>
      );
    });

    const card = screen.getByTestId('medical-documents-card');
    const docFile = new File(['document-data'], 'record.png', { type: 'image/png' });

    fireEvent.paste(card, {
      clipboardData: {
        items: [
          {
            kind: 'file',
            getAsFile: () => docFile,
          },
        ],
      },
    });

    expect(screen.getByText('Завантажено 1 файл')).toBeDefined();
    expect(handleToast).toHaveBeenCalledWith('Додано новий документ');
  });
});

