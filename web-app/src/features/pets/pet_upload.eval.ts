import { describe, it, expect } from 'vitest';
import { getNormalizedImageContentType } from './pet_media_utils';

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
  ];

  for (const tc of testCases) {
    it(`normalizes ${tc.name} with input type "${tc.type}" to "${tc.expected}"`, () => {
      const file = new File(['content'], tc.name, { type: tc.type });
      const normalized = getNormalizedImageContentType(file);
      expect(normalized).toBe(tc.expected);
      expect(allowedStorageMimeTypes.has(normalized)).toBe(true);
    });
  }
});
