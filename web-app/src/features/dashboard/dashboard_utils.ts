export function formatVisitDateDetails(isoString: string): {
  dayOfWeek: string;
  dayNumber: string;
  timeSlot: string;
} {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return { dayOfWeek: 'СЕР', dayNumber: '10', timeSlot: '16:00' };
  }

  const rawDayOfWeek = date.toLocaleDateString('uk-UA', { weekday: 'short' });
  const dayOfWeek = rawDayOfWeek.toUpperCase().replace('.', '').trim();
  const dayNumber = date.toLocaleDateString('uk-UA', { day: 'numeric' });
  const timeSlot = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  return { dayOfWeek, dayNumber, timeSlot };
}
