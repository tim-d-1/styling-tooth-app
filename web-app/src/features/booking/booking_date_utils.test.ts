import { describe, it, expect } from 'vitest';
import { getKyivISOString, getInitialBookingDate } from './booking_date_utils';

describe('booking_date_utils', () => {
  it('converts Kyiv daylight time (UTC+3) correctly to UTC ISO string', () => {
    const iso = getKyivISOString('2026-10-06', '10:00');
    expect(iso).toBe('2026-10-06T07:00:00.000Z');
  });

  it('converts Kyiv standard time (UTC+2) correctly to UTC ISO string', () => {
    const iso = getKyivISOString('2026-12-15', '14:30');
    expect(iso).toBe('2026-12-15T12:30:00.000Z');
  });

  it('calculates initial booking date for morning hours', () => {
    const morning = new Date('2026-10-06T10:00:00Z');
    const result = getInitialBookingDate(morning);
    expect(result.date).toBe('2026-10-06');
    expect(result.dateFormatted).toBe('06.10.2026');
  });

  it('rolls over to next day when booking after 17:00 local time', () => {
    const evening = new Date(2026, 9, 6, 18, 0, 0);
    const result = getInitialBookingDate(evening);
    expect(result.date).toBe('2026-10-07');
    expect(result.dateFormatted).toBe('07.10.2026');
  });

  it('calculates the Monday of the current week as weekStartDate', () => {
    const wednesday = new Date(2026, 9, 7, 12, 0, 0);
    const result = getInitialBookingDate(wednesday);
    expect(result.weekStartDate).toBe('2026-10-05');
  });
});
