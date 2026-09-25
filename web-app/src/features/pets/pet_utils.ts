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
  if (lower.includes('rodent') || lower.includes('гризун') || lower.includes('хом')) {
    return '🐹';
  }
  if (lower.includes('bird') || lower.includes('птах')) {
    return '🦜';
  }
  return '🐾';
}

export function formatDateToUkrainian(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  const day = date.toLocaleDateString('uk-UA', { day: 'numeric' });
  const month = date.toLocaleDateString('uk-UA', { month: 'long' });
  const year = date.getFullYear();

  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${day} ${capitalizedMonth} ${year}`;
}
