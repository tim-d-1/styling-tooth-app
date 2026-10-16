import { describe, it, expect } from 'vitest';
import {
  toKyivISOString,
  formatUkrainianDate,
  formatCardDate,
  isAppointmentPast,
  isAppointmentToday,
  formatInputDateTime,
} from './admin_date_utils';

describe('admin_date_utils', () => {
  const mockNow = new Date('2026-10-16T10:00:00Z');

  describe('isAppointmentPast', () => {
    it('returns true when appointment is before baseDate', () => {
      expect(isAppointmentPast('2026-10-06T09:00:00Z', mockNow)).toBe(true);
      expect(isAppointmentPast('2026-08-11T13:00:00Z', mockNow)).toBe(true);
    });

    it('returns false when appointment is after baseDate', () => {
      expect(isAppointmentPast('2026-10-17T11:00:00Z', mockNow)).toBe(false);
      expect(isAppointmentPast('2026-10-20T15:00:00Z', mockNow)).toBe(false);
    });
  });

  describe('isAppointmentToday', () => {
    it('detects appointments on the same Kyiv calendar day', () => {
      expect(isAppointmentToday('2026-10-16T08:00:00Z', mockNow)).toBe(true);
      expect(isAppointmentToday('2026-10-06T09:00:00Z', mockNow)).toBe(false);
      expect(isAppointmentToday('2026-10-17T11:00:00Z', mockNow)).toBe(false);
    });
  });

  describe('formatCardDate', () => {
    it('formats past appointment with past warning prefix', () => {
      const res = formatCardDate('2026-10-06T09:00:00Z', mockNow);
      expect(res.isPast).toBe(true);
      expect(res.isToday).toBe(false);
      expect(res.label).toContain('Минуло');
      expect(res.label).toContain('6 жовт.');
    });

    it('formats today appointment with Сьогодні prefix', () => {
      const res = formatCardDate('2026-10-16T08:00:00Z', mockNow);
      expect(res.isToday).toBe(true);
      expect(res.label).toContain('Сьогодні');
    });

    it('formats future appointment without warning prefix', () => {
      const res = formatCardDate('2026-10-17T11:00:00Z', mockNow);
      expect(res.isPast).toBe(false);
      expect(res.isToday).toBe(false);
      expect(res.label).toContain('17 жовт.');
    });
  });

  describe('formatUkrainianDate', () => {
    it('formats localized date with Ukrainian month name', () => {
      const str = formatUkrainianDate('2026-10-16T11:00:00Z');
      expect(str).toContain('жовтня');
    });
  });

  describe('formatInputDateTime', () => {
    it('formats date into YYYY-MM-DDTHH:mm representation in Kyiv time', () => {
      const str = formatInputDateTime('2026-10-17T11:00:00Z');
      expect(str).toMatch(/^2026-10-17T\d{2}:\d{2}$/);
    });
  });

  describe('toKyivISOString', () => {
    it('converts local input string to valid ISO UTC string preserving Kyiv time', () => {
      const iso = toKyivISOString('2026-10-17T14:00');
      expect(iso).toContain('2026-10-17');
      expect(iso).toContain('Z');
    });
  });
});
