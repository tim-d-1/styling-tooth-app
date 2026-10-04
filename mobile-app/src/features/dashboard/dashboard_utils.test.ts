import { describe, it, expect } from 'vitest';
import {
  formatVisitDateDetails,
  formatVisitStatusText,
} from './dashboard_utils';

describe('dashboard_utils', () => {
  it('formats valid ISO date into day of week, day number, and time', () => {
    const fixedDate = '2026-08-12T14:30:00.000Z';
    const result = formatVisitDateDetails(fixedDate);
    expect(result).not.toBeNull();
    expect(result?.dayNumber).toBeDefined();
    expect(result?.dayOfWeek).toBeDefined();
    expect(result?.monthName).toBeDefined();
    expect(result?.time).toBeDefined();
  });

  it('returns null for null or invalid date', () => {
    expect(formatVisitDateDetails(null)).toBeNull();
    expect(formatVisitDateDetails('invalid-date')).toBeNull();
  });

  it('formats statuses accurately in Ukrainian', () => {
    expect(formatVisitStatusText('confirmed')).toBe('Запланований візит');
    expect(formatVisitStatusText('pending')).toBe('Очікує підтвердження');
    expect(formatVisitStatusText('cancelled')).toBe('Скасовано');
    expect(formatVisitStatusText('unknown')).toBe('Візит');
  });
});
