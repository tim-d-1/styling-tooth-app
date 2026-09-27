import type { CareScheduleItem, CareScheduleNotification } from '@/features/pets/pet_types';

export interface PetCareScheduleRow {
  id: string;
  pet_id: string;
  category: 'parasites' | 'vaccines';
  title: string;
  drug_name?: string | null;
  due_date?: string | null;
  badge_text: string;
  valid_until_formatted?: string | null;
  icon_name: string;
  status_text?: string | null;
  status_type: 'success' | 'neutral' | 'warning';
  sort_order: number;
}

const NOTIFICATION_PREFIX = 'styling-tooth:care-notification:';

export function mapRowToCareScheduleItem(row: PetCareScheduleRow): CareScheduleItem {
  return {
    id: row.id,
    title: row.title,
    badgeText: row.badge_text,
    drugName: row.drug_name || undefined,
    validUntilFormatted: row.valid_until_formatted || undefined,
    iconName: row.icon_name || 'fi-rr-shield-check',
    category: row.category,
    statusText: row.status_text || undefined,
    statusType: row.status_type,
  };
}

export function deriveUpcomingNotification(
  petId: string,
  items: PetCareScheduleRow[]
): CareScheduleNotification | null {
  if (!items || items.length === 0) return null;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const isRead = window.localStorage.getItem(`${NOTIFICATION_PREFIX}${petId}`);
      if (isRead === 'read') {
        return null;
      }
    } catch {
      return null;
    }
  }

  const upcoming =
    items.find((item) => item.status_type === 'neutral' || item.status_type === 'warning') ||
    items[0];

  if (!upcoming) return null;

  return {
    id: `notif-${upcoming.id}`,
    title: 'Найближча обробка',
    drugInfo: upcoming.drug_name
      ? `Обробка: ${upcoming.title} (${upcoming.drug_name})`
      : `Обробка: ${upcoming.title}`,
    dueDateText: upcoming.valid_until_formatted || upcoming.badge_text,
    isRead: false,
  };
}

export function markPetCareNotificationRead(petId: string): void {
  if (!petId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${NOTIFICATION_PREFIX}${petId}`, 'read');
  } catch {
    return;
  }
}
