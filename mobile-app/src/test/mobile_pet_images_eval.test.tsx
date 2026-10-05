import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { resolveStorageUrl, fetchPetsAvatarMap } from '../features/pets/pet_media_utils';
import { MyPetScreen } from '../features/pets/MyPetScreen';
import { BookingScreen } from '../features/booking/BookingScreen';
import { supabase } from '../lib/supabase';

describe('Mobile Pet Images Parity & Private Storage Eval Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Eval 1: Private storage bucket URLs are signed instead of leaking unauthenticated public URLs', async () => {
    const createSignedUrlSpy = vi.fn().mockImplementation((path: string, expiresIn: number) => {
      expect(expiresIn).toBe(3600);
      return Promise.resolve({
        data: { signedUrl: `https://supabase.co/storage/v1/object/sign/pet-media/${path}?token=auth123` },
        error: null,
      });
    });

    const getPublicUrlSpy = vi.fn().mockImplementation((path: string) => ({
      data: { publicUrl: `https://supabase.co/storage/v1/object/public/pet-media/${path}` },
    }));

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: createSignedUrlSpy,
      getPublicUrl: getPublicUrlSpy,
    } as never);

    const signedResult = await resolveStorageUrl('pet-uuid/1723456789.jpg');
    expect(createSignedUrlSpy).toHaveBeenCalledWith('pet-uuid/1723456789.jpg', 3600);
    expect(signedResult).toBe('https://supabase.co/storage/v1/object/sign/pet-media/pet-uuid/1723456789.jpg?token=auth123');
    expect(signedResult).not.toContain('/object/public/');

    const directHttp = await resolveStorageUrl('https://images.unsplash.com/pet.jpg');
    expect(directHttp).toBe('https://images.unsplash.com/pet.jpg');
    expect(createSignedUrlSpy).toHaveBeenCalledTimes(1);
  });

  it('Eval 2: Multi-pet avatar map resolves prioritized media into signed URLs', async () => {
    const mockMedia = [
      {
        id: 'm-1-before',
        pet_id: 'pet-alpha',
        storage_path: 'pet-alpha/before.jpg',
        photo_type: 'before',
        created_at: '2026-08-01T10:00:00Z',
      },
      {
        id: 'm-1-gen',
        pet_id: 'pet-alpha',
        storage_path: 'pet-alpha/general.jpg',
        photo_type: 'general',
        created_at: '2026-08-02T10:00:00Z',
      },
      {
        id: 'm-2-after',
        pet_id: 'pet-beta',
        storage_path: 'pet-beta/after.jpg',
        photo_type: 'after',
        created_at: '2026-08-03T10:00:00Z',
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'pet_media') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockMedia, error: null }),
        } as never;
      }
      return { select: vi.fn().mockReturnThis() } as never;
    });

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: vi.fn().mockImplementation((path: string) =>
        Promise.resolve({
          data: { signedUrl: `https://supabase.co/signed/${path}` },
          error: null,
        })
      ),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as never);

    const avatarMap = await fetchPetsAvatarMap(['pet-alpha', 'pet-beta', 'pet-gamma']);
    expect(avatarMap['pet-alpha']).toBe('https://supabase.co/signed/pet-alpha/general.jpg');
    expect(avatarMap['pet-beta']).toBe('https://supabase.co/signed/pet-beta/after.jpg');
    expect(avatarMap['pet-gamma']).toBeUndefined();
  });

  it('Eval 3: MyPetScreen fetches and renders signed pet avatar from pet_media on initial mount', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'owner-eval-1' } } },
      error: null,
    });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'pets') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'pet-golden-1',
                name: 'Барон',
                species: 'dog',
                breed: 'Ретривер',
                birth_date: '2024-01-01',
                weight_kg: 24,
                is_active: true,
              },
            ],
            error: null,
          }),
        } as never;
      }
      if (table === 'pet_media') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'media-golden-1',
                pet_id: 'pet-golden-1',
                storage_path: 'pet-golden-1/avatar.webp',
                photo_type: 'general',
                created_at: '2026-08-01T12:00:00Z',
              },
            ],
            error: null,
          }),
        } as never;
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as never;
      }
      if (table === 'pet_care_schedules') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as never;
      }
      return { select: vi.fn().mockReturnThis() } as never;
    });

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://supabase.co/signed/pet-golden-1/avatar.webp?token=sig' },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as never);

    render(<MyPetScreen />);

    await waitFor(() => {
      const avatarContainer = screen.getByTestId('pet-avatar-image');
      expect(avatarContainer).toBeInTheDocument();
      const img = avatarContainer.querySelector('img');
      expect(img).not.toBeNull();
      expect(img?.src).toBe(
        'https://supabase.co/signed/pet-golden-1/avatar.webp?token=sig'
      );
    });
  });

  it('Eval 4: MyPetScreen updates avatar image reactively when user switches pets', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'owner-eval-2' } } },
      error: null,
    });

    const petsData = [
      { id: 'pet-dog', name: 'Рекс', species: 'dog', is_active: true },
      { id: 'pet-cat', name: 'Мурчик', species: 'cat', is_active: true },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'pets') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: petsData, error: null }),
        } as never;
      }
      if (table === 'pet_media') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((_col: string, val: string) => {
            const petPath = val === 'pet-cat' ? 'pet-cat/cat.png' : 'pet-dog/dog.png';
            return {
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: `m-${val}`,
                    pet_id: val,
                    storage_path: petPath,
                    photo_type: 'general',
                  },
                ],
                error: null,
              }),
            };
          }),
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'm-1', pet_id: 'pet-dog', storage_path: 'pet-dog/dog.png', photo_type: 'general' },
              { id: 'm-2', pet_id: 'pet-cat', storage_path: 'pet-cat/cat.png', photo_type: 'general' },
            ],
            error: null,
          }),
        } as never;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never;
    });

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: vi.fn().mockImplementation((path: string) =>
        Promise.resolve({
          data: { signedUrl: `https://supabase.co/signed/${path}?auth=1` },
          error: null,
        })
      ),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as never);

    render(<MyPetScreen />);

    await waitFor(() => {
      const avatarContainer = screen.getByTestId('pet-avatar-image');
      const img = avatarContainer.querySelector('img');
      expect(img?.src).toBe('https://supabase.co/signed/pet-dog/dog.png?auth=1');
    });

    fireEvent.click(screen.getByTestId('pet-switcher-item-pet-cat'));

    await waitFor(() => {
      const avatarContainer = screen.getByTestId('pet-avatar-image');
      const img = avatarContainer.querySelector('img');
      expect(img?.src).toBe('https://supabase.co/signed/pet-cat/cat.png?auth=1');
    });
  });

  it('Eval 5: BookingScreen loads real user pets with signed avatar URLs matching web-app parity', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'client-user-1' } } },
      error: null,
    });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'pets') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'booking-pet-1',
                name: 'Чарлі',
                species: 'dog',
                breed: 'Шпіц',
              },
            ],
            error: null,
          }),
        } as never;
      }
      if (table === 'pet_media') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'media-charlie',
                pet_id: 'booking-pet-1',
                storage_path: 'booking-pet-1/charlie.png',
                photo_type: 'general',
              },
            ],
            error: null,
          }),
        } as never;
      }
      if (table === 'services') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as never;
      }
      return { select: vi.fn().mockReturnThis() } as never;
    });

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://supabase.co/signed/booking-pet-1/charlie.png?token=valid' },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as never);

    render(<BookingScreen />);

    await waitFor(() => {
      expect(screen.getByText('Чарлі')).toBeInTheDocument();
      const petCard = screen.getByTestId('pet-card-booking-pet-1');
      const img = petCard.querySelector('img');
      expect(img).not.toBeNull();
      expect(img?.src).toBe('https://supabase.co/signed/booking-pet-1/charlie.png?token=valid');
    });
  });

  it('Eval 6: Gracefully degrades to PawIcon placeholder when image fails to load', async () => {
    // @ts-expect-error internal react-native-web ImageLoader module
    const ImageLoaderModule = await import('react-native-web/dist/cjs/modules/ImageLoader');
    const ImageLoader = ImageLoaderModule.default;
    vi.spyOn(ImageLoader, 'load').mockImplementation((...args: unknown[]) => {
      const onError = args[2] as (() => void) | undefined;
      if (typeof onError === 'function') {
        onError();
      }
      return 1 as any;
    });

    const mockPetDetail = {
      id: 'pet-broken',
      name: 'Бобік',
      species: 'dog',
      visitsCount: 1,
      avatarUrl: 'https://broken.invalid/not-found.jpg',
    };

    render(
      <MyPetScreen
        initialPets={[{ id: 'pet-broken', name: 'Бобік', species: 'dog', isActive: true }]}
        initialPetDetail={mockPetDetail}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('pet-avatar-image')).toBeNull();
      expect(screen.getByTestId('default-pet-avatar')).toBeInTheDocument();
    });
  });
});
