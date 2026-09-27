import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDefaultCareSchedule,
  getDefaultCareNotification,
  getPetCareScheduleItems,
  savePetCareScheduleItems,
  getPetCareNotification,
  markPetCareNotificationRead,
} from './care_schedule';

describe('care_schedule config', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns dog schedule by default or for non-cat species', () => {
    const dogSchedule = getDefaultCareSchedule('dog');
    const defaultSchedule = getDefaultCareSchedule(null);

    expect(dogSchedule.find((item) => item.id === 'flea-tick')?.drugName).toBe('Bravecto');
    expect(dogSchedule.find((item) => item.id === 'deworming')?.badgeText).toBe('Через 1 міс.');
    expect(dogSchedule.find((item) => item.id === 'core-vaccine')?.drugName).toBe('Nobivac DHPPi');
    expect(dogSchedule.find((item) => item.id === 'rabies-vaccine')?.title).toBe('Сказ + лептоспіроз');

    expect(defaultSchedule.find((item) => item.id === 'flea-tick')?.drugName).toBe('Bravecto');
  });

  it('returns cat schedule for cat species', () => {
    const catSchedule = getDefaultCareSchedule('cat');
    const uaCatSchedule = getDefaultCareSchedule('Кіт');

    expect(catSchedule.find((item) => item.id === 'flea-tick')?.drugName).toBe('Bravecto Plus');
    expect(catSchedule.find((item) => item.id === 'deworming')?.badgeText).toBe('Через 1 міс.');
    expect(catSchedule.find((item) => item.id === 'core-vaccine')?.drugName).toBe('Nobivac Tricat Trio');
    expect(catSchedule.find((item) => item.id === 'rabies-vaccine')?.title).toBe('Сказ');

    expect(uaCatSchedule.find((item) => item.id === 'flea-tick')?.drugName).toBe('Bravecto Plus');
  });

  it('returns default notification according to species', () => {
    const dogNotif = getDefaultCareNotification('dog');
    const catNotif = getDefaultCareNotification('cat');

    expect(dogNotif.drugInfo).toBe('Обробка від кліщів (Bravecto)');
    expect(catNotif.drugInfo).toBe('Обробка від кліщів (Bravecto Plus)');
  });

  it('loads and saves pet schedule items with localStorage', () => {
    const petId = '70000000-0000-0000-0000-000000000002';
    const initial = getPetCareScheduleItems(petId, 'cat');
    expect(initial.length).toBe(4);
    expect(initial.find((i) => i.id === 'deworming')?.badgeText).toBe('Через 1 міс.');

    const modified = initial.map((item) =>
      item.id === 'deworming' ? { ...item, badgeText: 'Виконано' } : item
    );
    savePetCareScheduleItems(petId, modified);

    const reloaded = getPetCareScheduleItems(petId, 'cat');
    expect(reloaded.find((i) => i.id === 'deworming')?.badgeText).toBe('Виконано');
  });

  it('handles corrupted localStorage gracefully by falling back to default', () => {
    const petId = 'pet-corrupt';
    localStorage.setItem(`styling-tooth:care-schedule:${petId}`, 'not-valid-json');

    const schedule = getPetCareScheduleItems(petId, 'dog');
    expect(schedule.length).toBe(4);
    expect(schedule.find((i) => i.id === 'flea-tick')?.drugName).toBe('Bravecto');
  });

  it('marks notification as read and suppresses it on next query', () => {
    const petId = '70000000-0000-0000-0000-000000000002';
    const notifBefore = getPetCareNotification(petId, 'cat');
    expect(notifBefore).not.toBeNull();
    expect(notifBefore?.isRead).toBe(false);

    markPetCareNotificationRead(petId);

    const notifAfter = getPetCareNotification(petId, 'cat');
    expect(notifAfter).toBeNull();
  });
});
