import { describe, it, expect } from 'vitest';
import {
  formatPetSubtitle,
  formatVisitsCount,
  getSpeciesEmoji,
  formatPetAge,
  formatDateToUkrainian,
  parseHealthNotes,
  isFigmaPetPlaceholder,
} from './pet_utils';

describe('pet_utils', () => {
  describe('formatPetSubtitle', () => {
    it('combines breed, age, and weight when all are provided', () => {
      expect(formatPetSubtitle('Лабрадор', '2 роки', 28)).toBe('Лабрадор • 2 роки • 28 кг');
    });

    it('omits missing fields gracefully', () => {
      expect(formatPetSubtitle('Британська', null, 4.5)).toBe('Британська • 4.5 кг');
      expect(formatPetSubtitle(null, '3 роки', null)).toBe('3 роки');
      expect(formatPetSubtitle(null, null, null)).toBe('');
    });
  });

  describe('formatVisitsCount', () => {
    it('inflects Ukrainian words for visit counts correctly', () => {
      expect(formatVisitsCount(0)).toBe('0 візитів');
      expect(formatVisitsCount(1)).toBe('1 візит');
      expect(formatVisitsCount(2)).toBe('2 візити');
      expect(formatVisitsCount(4)).toBe('4 візити');
      expect(formatVisitsCount(5)).toBe('5 візитів');
      expect(formatVisitsCount(11)).toBe('11 візитів');
      expect(formatVisitsCount(21)).toBe('21 візит');
      expect(formatVisitsCount(24)).toBe('24 візити');
    });
  });

  describe('getSpeciesEmoji', () => {
    it('maps dog, cat, rabbit, and fallback species to emojis', () => {
      expect(getSpeciesEmoji('dog')).toBe('🐶');
      expect(getSpeciesEmoji('собака')).toBe('🐶');
      expect(getSpeciesEmoji('cat')).toBe('🐱');
      expect(getSpeciesEmoji('кіт')).toBe('🐱');
      expect(getSpeciesEmoji('rabbit')).toBe('🐰');
      expect(getSpeciesEmoji('parrot')).toBe('🦜');
      expect(getSpeciesEmoji('unknown')).toBe('🐾');
      expect(getSpeciesEmoji(null)).toBe('🐾');
    });
  });

  describe('formatPetAge', () => {
    it('returns null for empty or invalid dates', () => {
      expect(formatPetAge(null)).toBeNull();
      expect(formatPetAge('')).toBeNull();
      expect(formatPetAge('invalid')).toBeNull();
    });

    it('formats years and months correctly', () => {
      const now = new Date();
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1).toISOString();
      const ageStr = formatPetAge(twoYearsAgo);
      expect(ageStr).toContain('2 роки');
    });
  });

  describe('formatDateToUkrainian', () => {
    it('formats ISO date to Ukrainian format', () => {
      const formatted = formatDateToUkrainian('2026-08-12T14:30:00.000Z');
      expect(formatted).toBe('12 Серпня 2026');
    });
  });

  describe('parseHealthNotes', () => {
    it('splits notes by lines and trims leading bullet symbols', () => {
      const notes = parseHealthNotes(
        '• Алергія на курку\n- Чутлива шкіра',
        '* Боїться фену'
      );
      expect(notes).toEqual([
        'Алергія на курку',
        'Чутлива шкіра',
        'Боїться фену',
      ]);
    });

    it('returns empty array when no notes provided', () => {
      expect(parseHealthNotes(null, undefined)).toEqual([]);
    });
  });

  describe('isFigmaPetPlaceholder', () => {
    it('flags dummy names from mockup', () => {
      expect(isFigmaPetPlaceholder('Барні')).toBe(true);
      expect(isFigmaPetPlaceholder('Barney')).toBe(true);
      expect(isFigmaPetPlaceholder('Чарлі')).toBe(true);
    });

    it('returns false for actual pet names', () => {
      expect(isFigmaPetPlaceholder('Рекс')).toBe(false);
      expect(isFigmaPetPlaceholder('Луна')).toBe(false);
    });
  });
});
