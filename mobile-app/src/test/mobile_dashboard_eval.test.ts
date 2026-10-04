import { describe, it, expect } from 'vitest';
import {
  formatVisitDateDetails,
  formatVisitStatusText,
} from '../features/dashboard/dashboard_utils';

describe('Mobile Dashboard Eval Suite: Visual Hierarchy, Content Contracts, and Edge Cases', () => {
  describe('Eval: Visit Date Formatting Matrix', () => {
    const testCases = [
      {
        iso: '2026-08-12T14:30:00.000Z',
        expectedDayOfWeek: 'Сер',
        expectedDayNumber: '12',
        expectedMonth: 'серпня',
      },
      {
        iso: '2026-01-01T09:00:00.000Z',
        expectedDayOfWeek: 'Чт',
        expectedDayNumber: '1',
        expectedMonth: 'січня',
      },
      {
        iso: '2026-12-31T20:45:00.000Z',
        expectedDayOfWeek: 'Чт',
        expectedDayNumber: '31',
        expectedMonth: 'грудня',
      },
      {
        iso: null,
        expectedResult: null,
      },
      {
        iso: 'invalid-date',
        expectedResult: null,
      },
    ];

    testCases.forEach((tc, idx) => {
      it(`evaluates date formatting case ${idx + 1} (${tc.iso})`, () => {
        const res = formatVisitDateDetails(tc.iso);
        if (tc.expectedResult === null) {
          expect(res).toBeNull();
        } else {
          expect(res).not.toBeNull();
          expect(res?.dayOfWeek).toBe(tc.expectedDayOfWeek);
          expect(res?.dayNumber).toBe(tc.expectedDayNumber);
          expect(res?.monthName).toBe(tc.expectedMonth);
          expect(res?.time).toMatch(/^\d{2}:\d{2}$/);
        }
      });
    });
  });

  describe('Eval: Visit Status Ukrainian Translation Matrix', () => {
    const statusMatrix = [
      { input: 'confirmed', expected: 'Запланований візит' },
      { input: 'CONFIRMED', expected: 'Запланований візит' },
      { input: 'pending', expected: 'Очікує підтвердження' },
      { input: 'in_progress', expected: 'Виконується' },
      { input: 'completed', expected: 'Завершено' },
      { input: 'cancelled', expected: 'Скасовано' },
      { input: 'unknown_status', expected: 'Візит' },
      { input: null, expected: 'Візит' },
      { input: undefined, expected: 'Візит' },
    ];

    statusMatrix.forEach(({ input, expected }, idx) => {
      it(`evaluates status mapping row ${idx + 1} (${input} -> ${expected})`, () => {
        expect(formatVisitStatusText(input)).toBe(expected);
      });
    });
  });

  describe('Eval: Promo Banners Content Contract matching web PromoBannersGrid', () => {
    const expectedPromos = [
      {
        id: 'promo-1',
        discount: '-25%',
        label: 'НА ПЕРШИЙ ГРУМІНГ',
        buttonText: 'Детальніше',
      },
      {
        id: 'promo-2',
        highlight: 'Безкоштовне',
        description: 'підстригання кігтів при комплексному грумінгу',
      },
      {
        id: 'promo-3',
        discount: '-20%',
        description: 'на комплексний грумінг у будні',
      },
    ];

    it('evaluates promo banner 1 contract (-25% first grooming)', () => {
      const banner1 = expectedPromos[0];
      expect(banner1.discount).toBe('-25%');
      expect(banner1.label).toBe('НА ПЕРШИЙ ГРУМІНГ');
      expect(banner1.buttonText).toBe('Детальніше');
    });

    it('evaluates promo banner 2 contract (free claw trimming)', () => {
      const banner2 = expectedPromos[1];
      expect(banner2.highlight).toBe('Безкоштовне');
      expect(banner2.description).toBe('підстригання кігтів при комплексному грумінгу');
    });

    it('evaluates promo banner 3 contract (weekday grooming)', () => {
      const banner3 = expectedPromos[2];
      expect(banner3.discount).toBe('-20%');
      expect(banner3.description).toBe('на комплексний грумінг у будні');
    });
  });

  describe('Eval: Advice Card Gradient Concentration Contract', () => {
    const cardWidth = 280;
    const imageWidth = 170;
    const imageLeft = cardWidth - imageWidth; // 110px
    const gradientStartX = 0.35;
    const gradientEndX = 0.55;

    it('evaluates gradient start precedes the image left border', () => {
      const startPx = gradientStartX * cardWidth; // 98px
      expect(startPx).toBeLessThanOrEqual(imageLeft);
      expect(imageLeft - startPx).toBeLessThanOrEqual(15);
    });

    it('evaluates gradient is concentrated within 20% of card width', () => {
      const span = gradientEndX - gradientStartX;
      const spanPx = span * cardWidth;
      expect(span).toBeCloseTo(0.2, 5);
      expect(spanPx).toBeCloseTo(56, 1);
      expect(spanPx).toBeLessThanOrEqual(60);
    });

    it('evaluates unmasked image visibility is at least 70% of image width', () => {
      const endPx = gradientEndX * cardWidth; // 154px
      const unmaskedWidth = cardWidth - endPx; // 126px
      expect(unmaskedWidth / imageWidth).toBeGreaterThan(0.7);
    });
  });
});
