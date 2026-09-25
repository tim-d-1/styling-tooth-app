import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage onToast={handleToast} />
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
    await act(async () => {
      render(
        <MemoryRouter>
          <PetCareSchedulePage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Захист від паразитів')).toBeDefined();
    expect(screen.getByText('Вакцинація')).toBeDefined();

    fireEvent.click(screen.getByRole('tab', { name: 'Паразити' }));
    expect(screen.getByText('Захист від паразитів')).toBeDefined();
    expect(screen.queryByText('Вакцинація')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Вакцини' }));
    expect(screen.queryByText('Захист від паразитів')).toBeNull();
    expect(screen.getByText('Вакцинація')).toBeDefined();

    fireEvent.click(screen.getByRole('tab', { name: 'Всі' }));
    expect(screen.getByText('Захист від паразитів')).toBeDefined();
    expect(screen.getByText('Вакцинація')).toBeDefined();
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
});
