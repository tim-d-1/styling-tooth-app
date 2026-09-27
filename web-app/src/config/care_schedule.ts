import type { CareScheduleItem, CareScheduleNotification } from '@/features/pets/pet_types';

const STORAGE_PREFIX = 'styling-tooth:care-schedule:';
const NOTIFICATION_PREFIX = 'styling-tooth:care-notification:';

export function getDefaultCareSchedule(species?: string | null): CareScheduleItem[] {
  const isCat = species ? species.toLowerCase().includes('cat') || species.toLowerCase().includes('кіт') : false;

  return [
    {
      id: 'flea-tick',
      title: 'Від кліщів та бліх',
      badgeText: '✓ Захищено',
      drugName: isCat ? 'Bravecto Plus' : 'Bravecto',
      validUntilFormatted: 'Наступна: 15 серп.',
      iconName: 'fi-rr-shield-check',
      category: 'parasites',
      statusText: '✓ Захищено',
      statusType: 'success',
    },
    {
      id: 'deworming',
      title: 'Дегельмінтизація',
      badgeText: 'Через 1 міс.',
      drugName: 'Milbemax',
      validUntilFormatted: 'Наступна: 10 вер.',
      iconName: 'fi-rr-medicine',
      category: 'parasites',
      statusText: 'Через 1 міс.',
      statusType: 'neutral',
    },
    {
      id: 'core-vaccine',
      title: 'Комплексна вакцинація',
      badgeText: '✓ В нормі',
      drugName: isCat ? 'Nobivac Tricat Trio' : 'Nobivac DHPPi',
      validUntilFormatted: 'Дійсна до 10 груд. 2026',
      iconName: 'fi-rr-syringe',
      category: 'vaccines',
      statusText: '✓ В нормі',
      statusType: 'success',
    },
    {
      id: 'rabies-vaccine',
      title: isCat ? 'Сказ' : 'Сказ + лептоспіроз',
      badgeText: '✓ В нормі',
      drugName: 'Nobivac Rabies',
      validUntilFormatted: 'Дійсна до 15 груд. 2026',
      iconName: 'fi-rr-syringe',
      category: 'vaccines',
      statusText: '✓ В нормі',
      statusType: 'success',
    },
  ];
}

export function getDefaultCareNotification(species?: string | null): CareScheduleNotification {
  const isCat = species ? species.toLowerCase().includes('cat') || species.toLowerCase().includes('кіт') : false;

  return {
    id: 'notif-1',
    title: 'Найближча обробка',
    drugInfo: isCat ? 'Обробка від кліщів (Bravecto Plus)' : 'Обробка від кліщів (Bravecto)',
    dueDateText: 'через 14 днів — 15 Серпня 2026',
    isRead: false,
  };
}

export function getPetCareScheduleItems(
  petId?: string | null,
  species?: string | null
): CareScheduleItem[] {
  if (petId && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${petId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      return getDefaultCareSchedule(species);
    }
  }

  return getDefaultCareSchedule(species);
}

export function savePetCareScheduleItems(petId: string, items: CareScheduleItem[]): void {
  if (!petId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${petId}`, JSON.stringify(items));
  } catch {
    return;
  }
}

export function getPetCareNotification(
  petId?: string | null,
  species?: string | null
): CareScheduleNotification | null {
  if (petId && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(`${NOTIFICATION_PREFIX}${petId}`);
      if (stored === 'read') {
        return null;
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed.isRead ? null : parsed;
        }
      }
    } catch {
      return getDefaultCareNotification(species);
    }
  }

  return getDefaultCareNotification(species);
}

export function markPetCareNotificationRead(petId: string): void {
  if (!petId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${NOTIFICATION_PREFIX}${petId}`, 'read');
  } catch {
    return;
  }
}
