export function formatAppointmentDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }

  const weekday = date.toLocaleDateString('uk-UA', { weekday: 'long' });
  const day = date.toLocaleDateString('uk-UA', { day: 'numeric' });
  const month = date.toLocaleDateString('uk-UA', { month: 'long' });
  const time = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

  return `${capitalizedWeekday}, ${day} ${capitalizedMonth} • ${time}`;
}

export function formatPetAge(birthDateString?: string | null): string | null {
  if (!birthDateString) return null;

  const birthDate = new Date(birthDateString);
  if (Number.isNaN(birthDate.getTime())) return null;

  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0 && months <= 0) {
    return 'менше місяця';
  }

  const parts: string[] = [];

  if (years > 0) {
    let yearWord = 'років';
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;
    if (lastTwoDigits < 10 || lastTwoDigits > 20) {
      if (lastDigit === 1) yearWord = 'рік';
      else if (lastDigit >= 2 && lastDigit <= 4) yearWord = 'роки';
    }
    parts.push(`${years} ${yearWord}`);
  }

  if (months > 0 && years < 3) {
    let monthWord = 'місяців';
    const lastDigit = months % 10;
    if (months === 1) monthWord = 'місяць';
    else if (lastDigit >= 2 && lastDigit <= 4) monthWord = 'місяці';
    parts.push(`${months} ${monthWord}`);
  }

  return parts.join(' ');
}
