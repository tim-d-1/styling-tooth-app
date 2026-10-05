export function formatPetSubtitle(
  breed?: string | null,
  ageFormatted?: string | null,
  weightKg?: number | null
): string {
  const parts: string[] = [];

  if (breed && breed.trim()) {
    parts.push(breed.trim());
  }

  if (ageFormatted && ageFormatted.trim()) {
    parts.push(ageFormatted.trim());
  }

  if (typeof weightKg === 'number' && !Number.isNaN(weightKg) && weightKg > 0) {
    const formattedWeight = Number.isInteger(weightKg)
      ? weightKg.toString()
      : weightKg.toFixed(1).replace(/\.0$/, '');
    parts.push(`${formattedWeight} кг`);
  }

  return parts.join(' • ');
}

export function formatVisitsCount(count: number): string {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} візитів`;
  }

  if (lastDigit === 1) {
    return `${count} візит`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} візити`;
  }

  return `${count} візитів`;
}

export function getSpeciesEmoji(species?: string | null): string {
  if (!species) return '🐾';
  const lower = species.toLowerCase();
  if (lower.includes('dog') || lower.includes('собак') || lower.includes('пес')) {
    return '🐶';
  }
  if (lower.includes('cat') || lower.includes('кіт') || lower.includes('кіш') || lower.includes('кот')) {
    return '🐱';
  }
  if (lower.includes('rabbit') || lower.includes('крол')) {
    return '🐰';
  }
  if (
    lower.includes('rodent') ||
    lower.includes('гризун') ||
    lower.includes('хом') ||
    lower.includes('hamster')
  ) {
    return '🐹';
  }
  if (
    lower.includes('bird') ||
    lower.includes('птах') ||
    lower.includes('parrot') ||
    lower.includes('папуг')
  ) {
    return '🦜';
  }
  return '🐾';
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

const UKRAINIAN_MONTHS = [
  'Січня',
  'Лютого',
  'Березня',
  'Квітня',
  'Травня',
  'Червня',
  'Липня',
  'Серпня',
  'Вересня',
  'Жовтня',
  'Листопада',
  'Грудня',
];

export function formatDateToUkrainian(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  const day = date.getDate();
  const month = UKRAINIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export function parseHealthNotes(
  medicalNotes?: string | null,
  behaviorNotes?: string | null
): string[] {
  const rawNotes: string[] = [];

  if (medicalNotes && medicalNotes.trim()) {
    rawNotes.push(...medicalNotes.split('\n'));
  }
  if (behaviorNotes && behaviorNotes.trim()) {
    rawNotes.push(...behaviorNotes.split('\n'));
  }

  return rawNotes
    .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
    .filter((line) => line.length > 0);
}

const DUMMY_PET_NAMES = new Set(['барні', 'barney', 'чарлі', 'charlie']);

export function isFigmaPetPlaceholder(name?: string | null): boolean {
  if (!name || typeof name !== 'string') return false;
  return DUMMY_PET_NAMES.has(name.toLowerCase().trim());
}
