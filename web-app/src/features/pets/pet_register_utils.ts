export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetSex = 'male' | 'female' | 'unknown';

export interface PetRegisterFormData {
  name: string;
  species: PetSpecies;
  breed?: string;
  sex?: PetSex;
  birthDate?: string;
  weight?: string;
  notes?: string;
  petPhoto?: File | null;
}

export function parsePetBirthDateInput(
  rawInput?: string | null,
  referenceDate: Date = new Date()
): { dateString: string | null; error: string | null } {
  if (!rawInput || !rawInput.trim()) {
    return { dateString: null, error: null };
  }

  const input = rawInput.trim();
  const now = referenceDate;
  const currentYear = now.getFullYear();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const subMonths = (months: number) => {
    const target = new Date(now.getFullYear(), now.getMonth(), 1);
    target.setMonth(target.getMonth() - months);
    const maxDays = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(now.getDate(), maxDays));
    return formatDate(target);
  };

  const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
      return { dateString: null, error: 'Вкажіть коректну дату (день від 1 до 31, місяць від 1 до 12)' };
    }
    const parsed = new Date(y, m - 1, d);
    if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) {
      return { dateString: null, error: 'Вказана некоректна календарна дата' };
    }
    if (parsed > now) {
      return { dateString: null, error: 'Дата народження не може бути в майбутньому' };
    }
    if (y < currentYear - 40) {
      return { dateString: null, error: 'Вкажіть реалістичну дату народження тваринки' };
    }
    return { dateString: formatDate(parsed), error: null };
  }

  const euroMatch = input.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (euroMatch) {
    const d = parseInt(euroMatch[1], 10);
    const m = parseInt(euroMatch[2], 10);
    const y = parseInt(euroMatch[3], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
      return { dateString: null, error: 'Вкажіть коректну дату (день від 1 до 31, місяць від 1 до 12)' };
    }
    const parsed = new Date(y, m - 1, d);
    if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) {
      return { dateString: null, error: 'Вказана некоректна календарна дата' };
    }
    if (parsed > now) {
      return { dateString: null, error: 'Дата народження не може бути в майбутньому' };
    }
    if (y < currentYear - 40) {
      return { dateString: null, error: 'Вкажіть реалістичну дату народження тваринки' };
    }
    return { dateString: formatDate(parsed), error: null };
  }

  const comboMatch = input.match(
    /^(\d+)\s*(?:рок(?:ів|[иу])|рік|р\.?|years?|yrs?|y|года?|лет)\.?\s*(?:і\s*|та\s*)?(\d+)\s*(?:місяц(?:ів|[іеяь])|міс\.?|months?|mos?|m|месяц(?:ев|[аеы])?|мес\.?)\.?$/i
  );
  if (comboMatch) {
    const y = parseInt(comboMatch[1], 10);
    const m = parseInt(comboMatch[2], 10);
    if (y > 40 || m > 11) {
      return { dateString: null, error: 'Вкажіть реалістичний вік тваринки' };
    }
    return { dateString: subMonths(y * 12 + m), error: null };
  }

  const monthsMatch = input.match(
    /^(\d+(?:[.,]\d+)?)\s*(?:місяц(?:ів|[іеяь])|міс\.?|months?|mos?|m|месяц(?:ев|[аеы])?|мес\.?)\.?$/i
  );
  if (monthsMatch) {
    const m = parseFloat(monthsMatch[1].replace(',', '.'));
    if (isNaN(m) || m <= 0) {
      return { dateString: null, error: 'Вкажіть коректний вік тваринки' };
    }
    if (m > 480) {
      return { dateString: null, error: 'Вкажіть реалістичний вік тваринки' };
    }
    return { dateString: subMonths(Math.round(m)), error: null };
  }

  const yearsTextMatch = input.match(
    /^(\d+(?:[.,]\d+)?)\s*(?:рок(?:ів|[иу])|рік|р\.?|years?|yrs?|y|года?|лет)\.?$/i
  );
  if (yearsTextMatch) {
    const y = parseFloat(yearsTextMatch[1].replace(',', '.'));
    if (isNaN(y) || y <= 0) {
      return { dateString: null, error: 'Вкажіть коректний вік тваринки' };
    }
    if (y > 40) {
      return { dateString: null, error: 'Вкажіть реалістичний вік тваринки' };
    }
    return { dateString: subMonths(Math.round(y * 12)), error: null };
  }

  const plainNumMatch = input.match(/^(\d+(?:[.,]\d+)?)$/);
  if (plainNumMatch) {
    const num = parseFloat(plainNumMatch[1].replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      return { dateString: null, error: 'Вкажіть коректний вік або дату народження' };
    }

    if (Number.isInteger(num) && num >= 1900 && num <= 2100) {
      if (num > currentYear) {
        return { dateString: null, error: 'Рік народження не може бути в майбутньому' };
      }
      if (num < currentYear - 40) {
        return { dateString: null, error: 'Вкажіть реалістичний рік народження тваринки' };
      }
      return { dateString: `${num}-01-01`, error: null };
    }

    if (num <= 40) {
      return { dateString: subMonths(Math.round(num * 12)), error: null };
    }

    return { dateString: null, error: 'Вкажіть реалістичний вік тваринки (до 40 років)' };
  }

  return {
    dateString: null,
    error: 'Вкажіть коректну дату народження або вік (наприклад, 15.05.2022 або 2 роки)',
  };
}

export function validatePetRegisterForm(
  data: PetRegisterFormData,
  referenceDate?: Date
): { isValid: boolean; error: string | null } {
  if (!data.name || !data.name.trim()) {
    return { isValid: false, error: 'Введіть кличку тваринки' };
  }
  if (!data.species) {
    return { isValid: false, error: 'Оберіть вид тварини' };
  }
  if (data.birthDate && data.birthDate.trim()) {
    const parsed = parsePetBirthDateInput(data.birthDate, referenceDate);
    if (parsed.error) {
      return { isValid: false, error: parsed.error };
    }
  }
  if (data.weight && data.weight.trim()) {
    const num = parseFloat(data.weight.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      return { isValid: false, error: 'Вкажіть коректну вагу (наприклад, 4.5)' };
    }
  }
  return { isValid: true, error: null };
}
