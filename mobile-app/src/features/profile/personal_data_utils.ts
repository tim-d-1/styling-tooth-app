export interface PersonalDataForm {
  fullName: string;
  gender: 'female' | 'male' | 'other' | '';
  phone: string;
  isPhoneVerified: boolean;
  email: string;
  isEmailVerified: boolean;
  birthDate: string;
  avatarUrl: string | null;
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

const FIGMA_DUMMY_VALUES = new Set([
  'катерина ковальчук',
  'kateryna kovalchuk',
  'kateryna.pet@gmail.com',
  '+380 (97) 123 45 67',
  '+380971234567',
  '380971234567',
  '0971234567',
  '14 травня 1995',
  '1995-05-14',
]);

export function formatUkrainianDate(dateString?: string | null): string {
  if (!dateString || typeof dateString !== 'string') {
    return 'Не вказано';
  }

  const trimmed = dateString.trim();
  if (!trimmed) {
    return 'Не вказано';
  }

  const dotParts = trimmed.split('.');
  if (dotParts.length === 3) {
    const day = parseInt(dotParts[0], 10);
    const month = parseInt(dotParts[1], 10);
    const year = parseInt(dotParts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
      return `${day} ${UKRAINIAN_MONTHS[month - 1]} ${year}`;
    }
  }

  const parsedDate = new Date(trimmed);
  if (!isNaN(parsedDate.getTime())) {
    const day = parsedDate.getUTCDate();
    const monthIndex = parsedDate.getUTCMonth();
    const year = parsedDate.getUTCFullYear();
    if (year >= 1900 && year <= 2100) {
      return `${day} ${UKRAINIAN_MONTHS[monthIndex]} ${year}`;
    }
  }

  return trimmed;
}

export function formatGender(gender?: string | null): string {
  if (!gender) return 'Не вказано';
  const normalized = gender.toLowerCase().trim();
  if (normalized === 'female' || normalized === 'жіноча') return 'Жіноча';
  if (normalized === 'male' || normalized === 'чоловіча') return 'Чоловіча';
  if (normalized === 'other' || normalized === 'інше') return 'Інше';
  return 'Не вказано';
}

export function parseGender(label?: string | null): 'female' | 'male' | 'other' | '' {
  if (!label) return '';
  const normalized = label.toLowerCase().trim();
  if (normalized === 'жіноча' || normalized === 'female') return 'female';
  if (normalized === 'чоловіча' || normalized === 'male') return 'male';
  if (normalized === 'інше' || normalized === 'other') return 'other';
  return '';
}

export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('380')) {
    return `+380 (${digits.slice(3, 5)}) ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+380 (${digits.slice(1, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  if (digits.length === 9) {
    return `+380 (${digits.slice(0, 2)}) ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }
  return phone;
}

export function isFigmaDummyPlaceholder(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return FIGMA_DUMMY_VALUES.has(value.toLowerCase().trim());
}

export function sanitizePersonalData(data?: Partial<PersonalDataForm> | null): PersonalDataForm {
  const rawName = typeof data?.fullName === 'string' ? data.fullName.trim() : '';
  const safeFullName = rawName && !isFigmaDummyPlaceholder(rawName) ? rawName : '';

  const rawEmail = typeof data?.email === 'string' ? data.email.trim() : '';
  const safeEmail = rawEmail && !isFigmaDummyPlaceholder(rawEmail) ? rawEmail : '';

  const rawPhone = typeof data?.phone === 'string' ? data.phone.trim() : '';
  const safePhone = rawPhone && !isFigmaDummyPlaceholder(rawPhone) ? rawPhone : '';

  const rawBirth = typeof data?.birthDate === 'string' ? data.birthDate.trim() : '';
  const safeBirthDate = rawBirth && !isFigmaDummyPlaceholder(rawBirth) ? rawBirth : '';

  const safeGender =
    data?.gender && (data.gender === 'female' || data.gender === 'male' || data.gender === 'other')
      ? data.gender
      : '';

  return {
    fullName: safeFullName,
    gender: safeGender,
    phone: safePhone,
    isPhoneVerified: Boolean(data?.isPhoneVerified),
    email: safeEmail,
    isEmailVerified: Boolean(data?.isEmailVerified),
    birthDate: safeBirthDate,
    avatarUrl: data?.avatarUrl || null,
  };
}
