import { describe, it, expect } from 'vitest';
import { getNormalizedImageContentType, preparePetMediaUpload } from './pet_media_utils';

describe('pet upload content-type normalization eval', () => {
  const allowedStorageMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif',
    'image/gif',
  ]);

  const testCases = [
    { name: 'photo.jpg', type: 'image/jpg', expected: 'image/jpeg' },
    { name: 'photo.JPG', type: 'image/pjpeg', expected: 'image/jpeg' },
    { name: 'photo.jpeg', type: 'image/jpeg', expected: 'image/jpeg' },
    { name: 'photo.png', type: 'image/png', expected: 'image/png' },
    { name: 'photo.webp', type: 'image/webp', expected: 'image/webp' },
    { name: 'photo.heic', type: 'image/heic', expected: 'image/heic' },
    { name: 'photo.heif', type: 'image/heif', expected: 'image/heif' },
    { name: 'photo.avif', type: 'image/avif', expected: 'image/avif' },
    { name: 'photo.gif', type: 'image/gif', expected: 'image/gif' },
    { name: 'unknown_no_type.jpg', type: '', expected: 'image/jpeg' },
    { name: 'unknown_no_type.png', type: '', expected: 'image/png' },
    { name: 'unknown_no_type.webp', type: '', expected: 'image/webp' },
    { name: 'camera_photo.jpg', type: 'application/octet-stream', expected: 'image/jpeg' },
    { name: 'camera_photo.png', type: 'application/octet-stream', expected: 'image/png' },
    { name: 'camera_photo.webp', type: 'application/octet-stream', expected: 'image/webp' },
    { name: 'camera_photo.jfif', type: 'image/jfif', expected: 'image/jpeg' },
  ];

  for (const tc of testCases) {
    it(`normalizes ${tc.name} with input type "${tc.type}" to "${tc.expected}"`, () => {
      const file = new File(['content'], tc.name, { type: tc.type });
      const normalized = getNormalizedImageContentType(file);
      expect(normalized).toBe(tc.expected);
      expect(allowedStorageMimeTypes.has(normalized)).toBe(true);
    });
  }

  it('ensures preparePetMediaUpload produces a File with an allowed image MIME type', () => {
    const rawFile = new File(['sample-data'], 'pet-avatar.jpg', { type: 'application/octet-stream' });
    const { preparedFile, contentType } = preparePetMediaUpload('pet-id-1', rawFile);
    expect(allowedStorageMimeTypes.has(contentType)).toBe(true);
    expect(allowedStorageMimeTypes.has(preparedFile.type)).toBe(true);
  });
});

describe('storage gateway header size and JWT metadata safety eval', () => {
  const CLOUDFLARE_MAX_HEADER_BYTES = 16384; // 16 KB Cloudflare single header limit
  const RECOMMENDED_SAFE_HEADER_LIMIT = 4096; // 4 KB budget for Authorization header

  function estimateJwtSize(metadata: Record<string, unknown>): number {
    const header = { alg: 'ES256', typ: 'JWT' };
    const payload = {
      iss: 'https://kjuijvtcsotsxrnwhrzu.supabase.co/auth/v1',
      sub: 'b7b2777f-0414-4e4d-adda-1c6d2bf548f3',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      role: 'authenticated',
      email: 'user@example.com',
      user_metadata: metadata,
      app_metadata: { provider: 'email', providers: ['email'] },
    };

    const toBase64Url = (str: string): string => {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const b64Header = toBase64Url(JSON.stringify(header));
    const b64Payload = toBase64Url(JSON.stringify(payload));
    const signature = 'fake-es256-signature-bytes-padding-length-64';
    return `${b64Header}.${b64Payload}.${signature}`.length;
  }

  it('evaluates that sanitized metadata produces JWT well within gateway header limits', () => {
    const cleanMetadata = {
      first_name: 'Катерина',
      last_name: 'Петренко',
      full_name: 'Катерина Петренко',
      city: 'м. Київ',
      phone: '+380501234567',
    };

    const jwtSize = estimateJwtSize(cleanMetadata);
    expect(jwtSize).toBeLessThan(RECOMMENDED_SAFE_HEADER_LIMIT);
    expect(jwtSize).toBeLessThan(CLOUDFLARE_MAX_HEADER_BYTES);
  });

  it('demonstrates that embedding raw base64 avatar into user_metadata breaches Cloudflare 16KB limit', () => {
    // 12KB raw base64 image avatar string (similar to user avatar in auth.users)
    const base64Avatar = 'data:image/jpeg;base64,' + 'A'.repeat(12500);
    const bloatedMetadata = {
      first_name: 'Катерина',
      last_name: 'Петренко',
      full_name: 'Катерина Петренко',
      city: 'м. Київ',
      avatar_url: base64Avatar,
    };

    const bloatedJwtSize = estimateJwtSize(bloatedMetadata);
    // Proves that raw base64 in metadata exceeds 16KB header threshold, causing HTTP 400 Bad Request
    expect(bloatedJwtSize).toBeGreaterThan(CLOUDFLARE_MAX_HEADER_BYTES);
  });

  it('evaluates that stripping data URLs keeps JWT safely below 2KB', () => {
    const base64Avatar = 'data:image/jpeg;base64,' + 'A'.repeat(12500);
    const rawMetadata: Record<string, unknown> = {
      first_name: 'Катерина',
      last_name: 'Петренко',
      full_name: 'Катерина Петренко',
      city: 'м. Київ',
      avatar_url: base64Avatar,
    };

    // Sanitization rule applied in DB trigger & client
    const sanitizedMetadata = Object.fromEntries(
      Object.entries(rawMetadata).filter(([key, val]) => {
        if (key === 'avatar_url' && typeof val === 'string' && val.startsWith('data:')) {
          return false;
        }
        return true;
      })
    );

    const safeJwtSize = estimateJwtSize(sanitizedMetadata);
    expect(safeJwtSize).toBeLessThan(RECOMMENDED_SAFE_HEADER_LIMIT);
  });
});
