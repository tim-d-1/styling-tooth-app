import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookingPage from './BookingPage';
import BookingPetStep from './steps/BookingPetStep';
import { supabase } from '@/lib/supabase';
import { PROCEDURES_CATALOG, DEMO_MASTERS } from './booking_types';

describe('BookingPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderBooking = (props = {}) => {
    return render(
      <MemoryRouter>
        <BookingPage {...props} />
      </MemoryRouter>
    );
  };

  it('renders stage 1 pet selection with add pet card and default pets', () => {
    renderBooking({ initialStage: 'pet' });

    expect(screen.getByRole('heading', { level: 1, name: 'Оберіть улюбленця' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Додати нового улюбленця' })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Барон/i })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Далі' })).toBeDefined();
    expect(screen.getByRole('progressbar', { name: 'Крок 1 з 5' })).toBeDefined();
  });

  it('triggers onAddPetClick when clicking add pet button', () => {
    const handleAddPet = vi.fn();
    renderBooking({ initialStage: 'pet', onAddPetClick: handleAddPet });

    fireEvent.click(screen.getByRole('button', { name: 'Додати нового улюбленця' }));
    expect(handleAddPet).toHaveBeenCalledTimes(1);
  });

  it('renders loading skeleton in pet step when isLoading is true', () => {
    render(
      <BookingPetStep
        pets={[]}
        isLoading={true}
        onSelectPet={vi.fn()}
        onAddPetClick={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(screen.getByRole('status', { name: 'Завантаження улюбленців' })).toBeDefined();
  });

  it('allows selecting another pet and advances to procedure stage', () => {
    renderBooking({ initialStage: 'pet' });

    const secondPet = screen.getByRole('radio', { name: /Альфа/i });
    fireEvent.click(secondPet);

    const nextBtn = screen.getByRole('button', { name: 'Далі' });
    fireEvent.click(nextBtn);

    expect(screen.getByRole('heading', { level: 1, name: 'Обери процедуру' })).toBeDefined();
    expect(screen.getByRole('progressbar', { name: 'Крок 2 з 5' })).toBeDefined();
  });

  it('renders stage 2 procedure selection with catalog items and selects procedure', () => {
    renderBooking({ initialStage: 'procedure' });

    expect(screen.getByRole('heading', { level: 1, name: 'Обери процедуру' })).toBeDefined();
    expect(screen.getByRole('radio', { name: PROCEDURES_CATALOG[0].name })).toBeDefined();
    expect(screen.getByRole('radio', { name: PROCEDURES_CATALOG[1].name })).toBeDefined();

    fireEvent.click(screen.getByRole('radio', { name: PROCEDURES_CATALOG[1].name }));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));

    expect(screen.getByRole('heading', { level: 2, name: DEMO_MASTERS[0].name })).toBeDefined();
    expect(screen.getByRole('progressbar', { name: 'Крок 3 з 5' })).toBeDefined();
  });

  it('renders stage 3 master selection and handles carousel navigation', () => {
    renderBooking({ initialStage: 'master' });

    expect(screen.getByRole('heading', { level: 2, name: DEMO_MASTERS[0].name })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Обрати майстра' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Будь-який вільний майстер' })).toBeDefined();

    const nextMasterBtn = screen.getByRole('button', { name: 'Наступний майстер' });
    fireEvent.click(nextMasterBtn);

    expect(screen.getByRole('heading', { level: 2, name: DEMO_MASTERS[1].name })).toBeDefined();

    const prevMasterBtn = screen.getByRole('button', { name: 'Попередній майстер' });
    fireEvent.click(prevMasterBtn);

    expect(screen.getByRole('heading', { level: 2, name: DEMO_MASTERS[0].name })).toBeDefined();
  });

  it('advances from stage 3 to stage 4 when choosing specific master', () => {
    renderBooking({ initialStage: 'master' });

    fireEvent.click(screen.getByRole('button', { name: 'Обрати майстра' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Коли вам зручно?' })).toBeDefined();
    expect(screen.getByRole('progressbar', { name: 'Крок 4 з 5' })).toBeDefined();
  });

  it('advances from stage 3 to stage 4 when choosing any master', () => {
    renderBooking({ initialStage: 'master' });

    fireEvent.click(screen.getByRole('button', { name: 'Будь-який вільний майстер' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Коли вам зручно?' })).toBeDefined();
  });

  it('renders stage 4 datetime selection, selects slot and advances to stage 5', () => {
    renderBooking({ initialStage: 'datetime' });

    expect(screen.getByRole('heading', { level: 1, name: 'Коли вам зручно?' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Серпень' })).toBeDefined();

    const thursdayBtn = screen.getByRole('button', { name: 'Чт12' });
    fireEvent.click(thursdayBtn);

    const slotBtn = screen.getByRole('radio', { name: '12:00' });
    fireEvent.click(slotBtn);

    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Додаткові побажання' })).toBeDefined();
    expect(screen.getByRole('progressbar', { name: 'Крок 5 з 5' })).toBeDefined();
  });

  it('renders stage 5 remarks, toggles transfer switch, and fills notes', () => {
    renderBooking({ initialStage: 'remarks' });

    expect(screen.getByRole('heading', { level: 1, name: 'Додаткові побажання' })).toBeDefined();
    expect(screen.queryByPlaceholderText('Введіть адресу подачі')).toBeNull();

    const commentInput = screen.getByPlaceholderText('Ваші побажання або деталі');
    fireEvent.change(commentInput, { target: { value: 'Будь ласка, обережно з вухами' } });

    const transferSwitch = screen.getByRole('switch', { name: 'Трансфер улюбленця' });
    fireEvent.click(transferSwitch);

    const addressInput = screen.getByPlaceholderText('Введіть адресу подачі');
    expect(addressInput).toBeDefined();
    fireEvent.change(addressInput, { target: { value: 'вул. Соборна, 45' } });

    const behaviorInput = screen.getByPlaceholderText('Боязкість, агресія, реакція на фен тощо');
    fireEvent.change(behaviorInput, { target: { value: 'Спокійний, боїться гучних звуків' } });

    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Деталі запису' })).toBeDefined();
  });

  it('renders stage 6 confirmation details with edit links that return to confirmation', () => {
    renderBooking({ initialStage: 'confirmation' });

    expect(screen.getByRole('heading', { level: 1, name: 'Деталі запису' })).toBeDefined();
    expect(screen.getByText('Улюбленець')).toBeDefined();
    expect(screen.getByText('Процедура')).toBeDefined();
    expect(screen.getByText('Майстер')).toBeDefined();
    expect(screen.getByText('Дата')).toBeDefined();
    expect(screen.getByText('Час')).toBeDefined();
    expect(screen.getByText('Вартість обраних процедур')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Підтвердити запис' })).toBeDefined();

    const editProcedureBtn = screen.getByRole('button', { name: 'Редагувати: Процедура' });
    fireEvent.click(editProcedureBtn);

    expect(screen.getByRole('heading', { level: 1, name: 'Обери процедуру' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Деталі запису' })).toBeDefined();
  });

  it('advances from confirmation to payment step', () => {
    renderBooking({ initialStage: 'confirmation' });

    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити запис' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Способи оплати' })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Apple Pay/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Оплатити/i })).toBeDefined();
  });

  it('processes payment with Apple Pay and invokes onComplete and Supabase appointment creation', async () => {
    const handleComplete = vi.fn();
    const handleToast = vi.fn();

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-booking-1', email: 'booker@example.com' },
        },
      },
      error: null,
    } as never);

    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      if (table === 'appointments') {
        return { insert: mockInsert };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }) as never);

    renderBooking({
      initialStage: 'payment',
      onComplete: handleComplete,
      onToast: handleToast,
    });

    const payBtn = screen.getByRole('button', { name: /Оплатити/i });
    await act(async () => {
      fireEvent.click(payBtn);
    });

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledTimes(1);
    });
    expect(handleToast).toHaveBeenCalledWith('Візит успішно заброньовано!');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('handles step back navigation through all stages', () => {
    const handleBackClick = vi.fn();
    renderBooking({ initialStage: 'payment', onBackClick: handleBackClick });

    expect(screen.getByRole('heading', { level: 1, name: 'Способи оплати' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Деталі запису' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Додаткові побажання' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Коли вам зручно?' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('heading', { level: 2, name: DEMO_MASTERS[0].name })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Обери процедуру' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Оберіть улюбленця' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(handleBackClick).toHaveBeenCalledTimes(1);
  });

  it('loads user pets from Supabase when logged in and applies them', async () => {
    const mockUserPets = [
      {
        id: 'real-pet-1',
        name: 'Барсик',
        species: 'cat',
        breed: 'Британський',
        avatar_url: 'https://images.unsplash.com/cat.jpg',
      },
    ];

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'owner-1', email: 'owner@example.com' },
        },
      },
      error: null,
    } as never);

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({ data: mockUserPets, error: null });

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      if (table === 'pets') {
        return {
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
        };
      }
      return {};
    }) as never);

    await act(async () => {
      renderBooking({ isLoggedIn: true });
    });

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Барсик/i })).toBeDefined();
    });
  });

  it('loads user pet 70000000-0000-0000-0000-000000000001 with custom avatar from pet_media on stage 1', async () => {
    const mockUserPets = [
      {
        id: '70000000-0000-0000-0000-000000000001',
        name: 'Барні',
        species: 'dog',
        breed: 'Йоркширський тер\'єр',
      },
    ];

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'owner-777', email: 'owner@example.com' },
        },
      },
      error: null,
    } as never);

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://storage.supabase.co/signed-barni-avatar.jpg' },
        error: null,
      }),
    } as never);

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      if (table === 'pets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockUserPets, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'pet_media') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'media-777',
                    pet_id: '70000000-0000-0000-0000-000000000001',
                    storage_path: '70000000-0000-0000-0000-000000000001/new-avatar.jpg',
                    photo_type: 'general',
                    created_at: '2026-09-28T12:00:00Z',
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    }) as never);

    await act(async () => {
      renderBooking({ isLoggedIn: true });
    });

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Барні/i })).toBeDefined();
    });

    const petImage = screen.getByRole('img', { name: 'Барні' }) as HTMLImageElement;
    expect(petImage).toBeDefined();
    expect(petImage.src).toBe('https://storage.supabase.co/signed-barni-avatar.jpg');
  });

  it('renders loading skeleton while pets are loading for authenticated user', () => {
    vi.spyOn(supabase.auth, 'getSession').mockReturnValueOnce(new Promise(() => {}) as never);

    renderBooking({ isLoggedIn: true });
    expect(screen.getByRole('status', { name: 'Завантаження улюбленців' })).toBeDefined();
  });

  it('renders zero pets and disabled next button when authenticated user has no pets in database', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'empty-user-1', email: 'empty@example.com' },
        },
      },
      error: null,
    } as never);

    vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      if (table === 'pets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    }) as never);

    const handleAddPet = vi.fn();

    await act(async () => {
      renderBooking({ isLoggedIn: true, onAddPetClick: handleAddPet });
    });

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Завантаження улюбленців' })).toBeNull();
    });

    expect(screen.queryByRole('radio', { name: /Барон/i })).toBeNull();
    expect(screen.queryByRole('radio', { name: /Альфа/i })).toBeNull();
    expect(screen.queryByRole('radio', { name: /Рекс/i })).toBeNull();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);

    const nextBtn = screen.getByRole('button', { name: 'Далі' });
    expect(nextBtn).toBeDefined();
    expect(nextBtn.hasAttribute('disabled')).toBe(true);

    const addPetBtn = screen.getByRole('button', { name: 'Додати нового улюбленця' });
    fireEvent.click(addPetBtn);
    expect(handleAddPet).toHaveBeenCalledTimes(1);
  });
});
