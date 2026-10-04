export interface FormattedVisitDate {
  dayOfWeek: string;
  dayNumber: string;
  monthName: string;
  time: string;
}

const UKRAINIAN_DAYS = ['Нд', 'Пн', 'Вів', 'Сер', 'Чт', 'Пт', 'Сб'];

const UKRAINIAN_MONTHS = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
];

export function formatVisitDateDetails(isoString?: string | null): FormattedVisitDate | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;

  const dayOfWeek = UKRAINIAN_DAYS[date.getDay()] || '';
  const dayNumber = date.getDate().toString();
  const monthName = UKRAINIAN_MONTHS[date.getMonth()] || '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return {
    dayOfWeek,
    dayNumber,
    monthName,
    time,
  };
}

export function formatVisitStatusText(status?: string | null): string {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'Запланований візит';
    case 'pending':
      return 'Очікує підтвердження';
    case 'in_progress':
      return 'Виконується';
    case 'completed':
      return 'Завершено';
    case 'cancelled':
      return 'Скасовано';
    default:
      return 'Візит';
  }
}

export interface MobileVisit {
  id: string;
  startsAt: string;
  petName?: string;
  serviceName?: string;
  masterName?: string;
  status: string;
  price?: number;
}
