export function getKyivISOString(dateStr: string, timeStr: string): string {
  const dummyUtc = new Date(`${dateStr}T${timeStr}:00Z`);
  const kyivFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = kyivFormatter.formatToParts(dummyUtc);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }
  const kyivAsUtc = new Date(
    `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}Z`
  );
  const offsetMs = kyivAsUtc.getTime() - dummyUtc.getTime();
  return new Date(dummyUtc.getTime() - offsetMs).toISOString();
}

export function getInitialBookingDate(baseDate?: Date): {
  date: string;
  dateFormatted: string;
  weekStartDate: string;
} {
  const now = baseDate || new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  const targetDate = new Date(now.getTime() + (now.getHours() >= 17 ? 86400000 : 0));
  const y = targetDate.getFullYear();
  const m = pad(targetDate.getMonth() + 1);
  const d = pad(targetDate.getDate());
  const date = `${y}-${m}-${d}`;
  const dateFormatted = `${d}.${m}.${y}`;

  const dayOfWeek = (targetDate.getDay() + 6) % 7;
  const monday = new Date(targetDate.getTime() - dayOfWeek * 86400000);
  const my = monday.getFullYear();
  const mm = pad(monday.getMonth() + 1);
  const md = pad(monday.getDate());
  const weekStartDate = `${my}-${mm}-${md}`;

  return { date, dateFormatted, weekStartDate };
}
