export function toKyivISOString(dateTimeInput: string, timeStr?: string): string {
  if (!dateTimeInput) return '';

  let datePart = dateTimeInput;
  let timePart = timeStr || '00:00';

  if (dateTimeInput.includes('T')) {
    const [d, t] = dateTimeInput.split('T');
    datePart = d;
    timePart = timeStr || t.slice(0, 5);
  } else if (dateTimeInput.includes(' ')) {
    const [d, t] = dateTimeInput.split(' ');
    datePart = d;
    timePart = timeStr || t.slice(0, 5);
  }

  const dummyUtc = new Date(`${datePart}T${timePart}:00Z`);
  if (isNaN(dummyUtc.getTime())) {
    return new Date().toISOString();
  }

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

export function formatUkrainianDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const months = [
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

    const kyivFormatter = new Intl.DateTimeFormat('uk-UA', {
      timeZone: 'Europe/Kyiv',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = kyivFormatter.formatToParts(d);
    let day = d.getDate();
    let monthIdx = d.getMonth();
    let hours = String(d.getHours()).padStart(2, '0');
    let minutes = String(d.getMinutes()).padStart(2, '0');

    for (const part of parts) {
      if (part.type === 'day') day = parseInt(part.value, 10);
      if (part.type === 'month') monthIdx = parseInt(part.value, 10) - 1;
      if (part.type === 'hour') hours = part.value.padStart(2, '0');
      if (part.type === 'minute') minutes = part.value.padStart(2, '0');
    }

    const month = months[monthIdx] || '';
    return `${day} ${month}, ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

export function isAppointmentPast(dateString: string, baseDate?: Date): boolean {
  try {
    const apptTime = new Date(dateString).getTime();
    if (isNaN(apptTime)) return false;
    const nowTime = (baseDate || new Date()).getTime();
    return apptTime < nowTime - 60 * 1000;
  } catch {
    return false;
  }
}

export function isAppointmentToday(dateString: string, baseDate?: Date): boolean {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;

    const now = baseDate || new Date();

    const getKyivDateStr = (date: Date) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Kyiv',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);
      const m: Record<string, string> = {};
      for (const p of parts) m[p.type] = p.value;
      return `${m.year}-${m.month}-${m.day}`;
    };

    return getKyivDateStr(d) === getKyivDateStr(now);
  } catch {
    return false;
  }
}

export function formatCardDate(
  dateString: string,
  baseDate?: Date
): {
  label: string;
  isPast: boolean;
  isToday: boolean;
} {
  const isPast = isAppointmentPast(dateString, baseDate);
  const isToday = isAppointmentToday(dateString, baseDate);

  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return { label: dateString, isPast: false, isToday: false };
    }

    const kyivTime = new Intl.DateTimeFormat('uk-UA', {
      timeZone: 'Europe/Kyiv',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);

    if (isToday) {
      return {
        label: `Сьогодні, ${kyivTime}`,
        isPast,
        isToday: true,
      };
    }

    const shortMonths = [
      'січ.',
      'лют.',
      'бер.',
      'квіт.',
      'трав.',
      'черв.',
      'лип.',
      'серп.',
      'вер.',
      'жовт.',
      'лист.',
      'груд.',
    ];

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Kyiv',
      day: 'numeric',
      month: 'numeric',
    }).formatToParts(d);

    let day = d.getDate();
    let monthIdx = d.getMonth();
    for (const p of parts) {
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'month') monthIdx = parseInt(p.value, 10) - 1;
    }

    const shortMonth = shortMonths[monthIdx] || '';

    if (isPast) {
      return {
        label: `Минуло: ${day} ${shortMonth}, ${kyivTime}`,
        isPast: true,
        isToday: false,
      };
    }

    return {
      label: `${day} ${shortMonth}, ${kyivTime}`,
      isPast: false,
      isToday: false,
    };
  } catch {
    return { label: dateString, isPast, isToday };
  }
}

export function formatInputDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Kyiv',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);

    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;

    const year = map.year;
    const month = map.month;
    const day = map.day;
    const hours = map.hour === '24' ? '00' : map.hour;
    const minutes = map.minute;

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}
