import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveStorageUrl,
  fetchPetsAvatarMap,
  fetchPetAvatarUrl,
  uploadPetMediaFromUri,
} from './pet_media_utils';
import { supabase } from '../../lib/supabase';

describe('pet_media_utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveStorageUrl', () => {
    it('returns null for null, empty or whitespace strings', async () => {
      expect(await resolveStorageUrl(null)).toBeNull();
      expect(await resolveStorageUrl(undefined)).toBeNull();
      expect(await resolveStorageUrl('')).toBeNull();
      expect(await resolveStorageUrl('   ')).toBeNull();
    });

    it('returns direct URL when storagePath starts with http, https, data:, or file://', async () => {
      expect(await resolveStorageUrl('https://example.com/pet.jpg')).toBe('https://example.com/pet.jpg');
      expect(await resolveStorageUrl('http://example.com/pet.jpg')).toBe('http://example.com/pet.jpg');
      expect(await resolveStorageUrl('data:image/png;base64,abc123==')).toBe('data:image/png;base64,abc123==');
      expect(await resolveStorageUrl('file:///data/user/0/app/pet.jpg')).toBe('file:///data/user/0/app/pet.jpg');
    });

    it('creates signed URL from Supabase storage for relative storage path', async () => {
      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://supabase.co/storage/v1/object/sign/pet-media/pet-1/photo.jpg?token=secret' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://supabase.co/storage/v1/object/public/pet-media/pet-1/photo.jpg' },
        }),
      } as never);

      const url = await resolveStorageUrl('pet-1/photo.jpg');
      expect(url).toBe('https://supabase.co/storage/v1/object/sign/pet-media/pet-1/photo.jpg?token=secret');
    });

    it('falls back to public URL when createSignedUrl errors or returns null', async () => {
      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Permission denied'),
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://supabase.co/storage/v1/object/public/pet-media/pet-fallback.jpg' },
        }),
      } as never);

      const url = await resolveStorageUrl('pet-fallback.jpg');
      expect(url).toBe('https://supabase.co/storage/v1/object/public/pet-media/pet-fallback.jpg');
    });

    it('handles unexpected storage exception gracefully', async () => {
      vi.spyOn(supabase.storage, 'from').mockImplementation(() => {
        throw new Error('Network failure');
      });

      const url = await resolveStorageUrl('pet-exception.jpg');
      expect(url).toBeNull();
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
          storage_path: 'pet-1/before.jpg',
          photo_type: 'before',
          created_at: '2026-08-01T10:00:00Z',
        },
        {
          id: 'm-after',
          pet_id: 'pet-1',
          storage_path: 'pet-1/after.jpg',
          photo_type: 'after',
          created_at: '2026-08-01T12:00:00Z',
        },
        {
          id: 'm-general',
          pet_id: 'pet-1',
          storage_path: 'pet-1/general.jpg',
          photo_type: 'general',
          created_at: '2026-08-02T10:00:00Z',
        },
        {
          id: 'm-after-2',
          pet_id: 'pet-2',
          storage_path: 'pet-2/after.jpg',
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

      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        createSignedUrl: vi.fn().mockImplementation((path: string) =>
          Promise.resolve({
            data: { signedUrl: `https://signed.supabase.co/${path}?token=valid` },
            error: null,
          })
        ),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      } as never);

      const avatarMap = await fetchPetsAvatarMap(['pet-1', 'pet-2']);
      expect(avatarMap['pet-1']).toBe('https://signed.supabase.co/pet-1/general.jpg?token=valid');
      expect(avatarMap['pet-2']).toBe('https://signed.supabase.co/pet-2/after.jpg?token=valid');
    });

    it('returns empty object when query returns error or null rows', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      } as never);

      const avatarMap = await fetchPetsAvatarMap(['pet-error']);
      expect(avatarMap).toEqual({});
    });
  });

  describe('fetchPetAvatarUrl', () => {
    it('returns null for empty or null petId', async () => {
      expect(await fetchPetAvatarUrl(null)).toBeNull();
      expect(await fetchPetAvatarUrl('')).toBeNull();
    });

    it('returns single pet avatar url when media exists', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'm-single',
              pet_id: 'pet-single',
              storage_path: 'pet-single/main.jpg',
              photo_type: 'general',
              created_at: '2026-08-01T10:00:00Z',
            },
          ],
          error: null,
        }),
      } as never);

      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://signed.supabase.co/pet-single/main.jpg?token=ok' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      } as never);

      const avatar = await fetchPetAvatarUrl('pet-single');
      expect(avatar).toBe('https://signed.supabase.co/pet-single/main.jpg?token=ok');
    });
  });

  describe('uploadPetMediaFromUri', () => {
    it('returns null if petId or localUri is empty', async () => {
      expect(await uploadPetMediaFromUri('', 'file:///photo.jpg')).toBeNull();
      expect(await uploadPetMediaFromUri('pet-1', '')).toBeNull();
    });

    it('uploads blob to storage and inserts record into pet_media', async () => {
      const mockBlob = new Blob(['bytes'], { type: 'image/jpeg' });
      const globalFetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        blob: vi.fn().mockResolvedValue(mockBlob),
      } as unknown as Response);

      const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'uploaded' }, error: null });
      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: uploadMock,
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://signed.supabase.co/new.jpg?token=ok' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      } as never);

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: insertMock,
      } as never);

      const result = await uploadPetMediaFromUri('pet-123', 'file:///local/photo.jpg', 'general', 'user-456');

      expect(globalFetchSpy).toHaveBeenCalledWith('file:///local/photo.jpg');
      expect(uploadMock).toHaveBeenCalled();
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pet_id: 'pet-123',
          photo_type: 'general',
          created_by: 'user-456',
        })
      );
      expect(result).toBe('https://signed.supabase.co/new.jpg?token=ok');
    });
  });
});
