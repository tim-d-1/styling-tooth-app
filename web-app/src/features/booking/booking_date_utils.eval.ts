import { describe, it, expect } from 'vitest';
import { getKyivISOString, getInitialBookingDate } from './booking_date_utils';

describe('Booking Date and Timezone Resilience Eval', () => {
  const timeSlots = ['09:00', '10:30', '12:00', '14:15', '16:00', '17:45'];

  it('evaluates that all generated ISO strings are strictly parseable and preserve Kyiv hour', () => {
    const date = '2026-10-08';
    for (const slot of timeSlots) {
      const iso = getKyivISOString(date, slot);
      const parsed = new Date(iso);
      expect(isNaN(parsed.getTime())).toBe(false);

      const formattedHour = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Kyiv',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(parsed);

      expect(formattedHour).toBe(slot);
    }
  });

  it('evaluates date formatting consistency across all 12 months', () => {
    for (let month = 0; month < 12; month++) {
      const sample = new Date(2026, month, 15, 11, 0, 0);
      const res = getInitialBookingDate(sample);
      expect(res.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(res.dateFormatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
      expect(res.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('evaluates leap year handling', () => {
    const leapSample = new Date(2028, 1, 28, 10, 0, 0);
    const res = getInitialBookingDate(leapSample);
    expect(res.date).toBe('2028-02-28');
    expect(res.dateFormatted).toBe('28.02.2028');
  });
});
