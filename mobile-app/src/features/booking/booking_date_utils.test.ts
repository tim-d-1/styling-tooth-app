import { describe, it, expect } from 'vitest';
import { getKyivISOString, getInitialBookingDate } from './booking_date_utils';

describe('booking_date_utils', () => {
  it('formats Kyiv date and time into UTC ISO string correctly', () => {
    const isoString = getKyivISOString('2026-08-11', '16:00');
    expect(isoString).toBeDefined();
    expect(isoString.endsWith('Z')).toBe(true);

    const d = new Date(isoString);
    const kyivFormatted = new Intl.DateTimeFormat('uk-UA', {
      timeZone: 'Europe/Kyiv',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);

    expect(kyivFormatted).toContain('16:00');
  });

  it('calculates initial booking date and formatted values', () => {
    const fixedDate = new Date('2026-08-11T10:00:00Z');
    const result = getInitialBookingDate(fixedDate);

    expect(result.date).toBe('2026-08-11');
    expect(result.dateFormatted).toBe('11.08.2026');
    expect(result.weekStartDate).toBe('2026-08-10');
  });

  it('rolls over to next day when hour is past 17:00', () => {
    const eveningDate = new Date('2026-08-11T18:00:00');
    const result = getInitialBookingDate(eveningDate);

    expect(result.date).toBe('2026-08-12');
    expect(result.dateFormatted).toBe('12.08.2026');
  });
});
