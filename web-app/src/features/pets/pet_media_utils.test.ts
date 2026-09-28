import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveStorageUrl, fetchPetsAvatarMap, fetchPetAvatarUrl } from './pet_media_utils';
import { supabase } from '@/lib/supabase';

describe('pet_media_utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveStorageUrl', () => {
    it('returns null for null, empty or undefined paths', async () => {
      expect(await resolveStorageUrl(null)).toBeNull();
      expect(await resolveStorageUrl('')).toBeNull();
      expect(await resolveStorageUrl('   ')).toBeNull();
    });

    it('returns direct URL when storagePath starts with http, https, or /', async () => {
      expect(await resolveStorageUrl('https://example.com/pet.jpg')).toBe('https://example.com/pet.jpg');
      expect(await resolveStorageUrl('http://example.com/pet.jpg')).toBe('http://example.com/pet.jpg');
      expect(await resolveStorageUrl('/assets/images/pet.png')).toBe('/assets/images/pet.png');
    });

    it('creates signed URL from Supabase storage for relative storage path', async () => {
      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://supabase.co/signed/pet.jpg' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://supabase.co/public/pet.jpg' },
        }),
      } as never);

      const url = await resolveStorageUrl('pet-123/avatar.jpg');
      expect(url).toBe('https://supabase.co/signed/pet.jpg');
    });

    it('falls back to public URL when createSignedUrl errors or returns null', async () => {
      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Permission denied'),
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://supabase.co/public/pet.jpg' },
        }),
      } as never);

      const url = await resolveStorageUrl('pet-123/avatar.jpg');
      expect(url).toBe('https://supabase.co/public/pet.jpg');
    });
  });

  describe('fetchPetsAvatarMap', () => {
    it('returns empty object when petIds array is empty', async () => {
      const res = await fetchPetsAvatarMap([]);
      expect(res).toEqual({});
    });

    it('prioritizes general photo over after and before photos for each pet', async () => {
      const mockMediaRows = [
        {
          id: 'm-before',
          pet_id: 'pet-1',
          storage_path: 'https://example.com/pet1-before.jpg',
          photo_type: 'before',
          created_at: '2026-08-01T10:00:00Z',
        },
        {
          id: 'm-after',
          pet_id: 'pet-1',
          storage_path: 'https://example.com/pet1-after.jpg',
          photo_type: 'after',
          created_at: '2026-08-01T12:00:00Z',
        },
        {
          id: 'm-general',
          pet_id: 'pet-1',
          storage_path: 'https://example.com/pet1-general.jpg',
          photo_type: 'general',
          created_at: '2026-08-02T10:00:00Z',
        },
        {
          id: 'm-after-2',
          pet_id: 'pet-2',
          storage_path: 'https://example.com/pet2-after.jpg',
          photo_type: 'after',
          created_at: '2026-08-03T10:00:00Z',
        },
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockMediaRows,
          error: null,
        }),
      } as never);

      const avatarMap = await fetchPetsAvatarMap(['pet-1', 'pet-2']);
      expect(avatarMap['pet-1']).toBe('https://example.com/pet1-general.jpg');
      expect(avatarMap['pet-2']).toBe('https://example.com/pet2-after.jpg');
    });

    it('picks the newest general avatar when multiple general avatars exist', async () => {
      const mockMediaRows = [
        {
          id: 'm-general-new',
          pet_id: '70000000-0000-0000-0000-000000000001',
          storage_path: 'https://example.com/new-avatar.jpg',
          photo_type: 'general',
          created_at: '2026-09-28T16:00:00Z',
        },
        {
          id: 'm-general-old',
          pet_id: '70000000-0000-0000-0000-000000000001',
          storage_path: 'https://example.com/old-avatar.jpg',
          photo_type: 'general',
          created_at: '2026-08-01T10:00:00Z',
        },
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockMediaRows,
          error: null,
        }),
      } as never);

      const avatarMap = await fetchPetsAvatarMap(['70000000-0000-0000-0000-000000000001']);
      expect(avatarMap['70000000-0000-0000-0000-000000000001']).toBe('https://example.com/new-avatar.jpg');
    });
  });

  describe('fetchPetAvatarUrl', () => {
    it('returns null when petId is null or empty', async () => {
      expect(await fetchPetAvatarUrl(null)).toBeNull();
      expect(await fetchPetAvatarUrl('')).toBeNull();
    });

    it('returns resolved avatar for a single pet', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'm-1',
              pet_id: 'p-single',
              storage_path: 'https://example.com/single.webp',
              photo_type: 'general',
              created_at: '2026-09-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      } as never);

      const avatar = await fetchPetAvatarUrl('p-single');
      expect(avatar).toBe('https://example.com/single.webp');
    });
  });
});
