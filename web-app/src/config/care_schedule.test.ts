import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mapRowToCareScheduleItem,
  deriveUpcomingNotification,
  markPetCareNotificationRead,
  type PetCareScheduleRow,
} from './care_schedule';

describe('care_schedule config and helpers', () => {
  const mockRow: PetCareScheduleRow = {
    id: '80000000-0000-0000-0000-000000000001',
    pet_id: '70000000-0000-0000-0000-000000000002',
    category: 'parasites',
    title: 'Дегельмінтизація',
    drug_name: 'Milbemax',
    due_date: '2026-10-10',
    badge_text: 'Через 1 міс.',
    valid_until_formatted: 'Наступна: 10 вер.',
    icon_name: 'fi-rr-medicine',
    status_text: 'Через 1 міс.',
    status_type: 'neutral',
    sort_order: 1,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('maps database row correctly to CareScheduleItem', () => {
    const item = mapRowToCareScheduleItem(mockRow);
    expect(item.id).toBe(mockRow.id);
    expect(item.title).toBe('Дегельмінтизація');
    expect(item.badgeText).toBe('Через 1 міс.');
    expect(item.drugName).toBe('Milbemax');
    expect(item.validUntilFormatted).toBe('Наступна: 10 вер.');
    expect(item.category).toBe('parasites');
    expect(item.statusType).toBe('neutral');
  });

  it('handles optional fields gracefully during row mapping', () => {
    const minimalRow: PetCareScheduleRow = {
      id: 'row-min',
      pet_id: 'pet-min',
      category: 'vaccines',
      title: 'Вакцинація',
      badge_text: 'Заплановано',
      icon_name: '',
      status_type: 'neutral',
      sort_order: 0,
    };

    const item = mapRowToCareScheduleItem(minimalRow);
    expect(item.id).toBe('row-min');
    expect(item.drugName).toBeUndefined();
    expect(item.validUntilFormatted).toBeUndefined();
    expect(item.statusText).toBeUndefined();
    expect(item.iconName).toBe('fi-rr-shield-check');
  });

  it('returns null for upcoming notification when no schedule items exist', () => {
    const notif = deriveUpcomingNotification('pet-empty', []);
    expect(notif).toBeNull();
  });

  it('derives upcoming notification from schedule rows', () => {
    const notif = deriveUpcomingNotification('pet-1', [mockRow]);
    expect(notif).not.toBeNull();
    expect(notif?.title).toBe('Найближча обробка');
    expect(notif?.drugInfo).toBe('Обробка: Дегельмінтизація (Milbemax)');
    expect(notif?.dueDateText).toBe('Наступна: 10 вер.');
    expect(notif?.isRead).toBe(false);
  });

  it('marks notification as read and suppresses it on subsequent calls', () => {
    const petId = '70000000-0000-0000-0000-000000000002';
    const notifBefore = deriveUpcomingNotification(petId, [mockRow]);
    expect(notifBefore).not.toBeNull();

    markPetCareNotificationRead(petId);

    const notifAfter = deriveUpcomingNotification(petId, [mockRow]);
    expect(notifAfter).toBeNull();
  });
});
