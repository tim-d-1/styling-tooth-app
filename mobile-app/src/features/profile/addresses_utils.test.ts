import { describe, it, expect } from 'vitest';
import {
  createEmptyUserAddress,
  sanitizeUserAddress,
  isFigmaAddressPlaceholder,
  formatAddressDisplay,
  formatAddressFullLine,
  resolveAddressLabelBadge,
  validateUserAddress,
} from './addresses_utils';

describe('addresses_utils', () => {
  it('creates empty user address with default label and false transfer flag', () => {
    const empty = createEmptyUserAddress();
    expect(empty).toEqual({
      street: '',
      apartment: '',
      entranceFloor: '',
      label: 'Дім',
      isDefaultTransfer: false,
    });
  });

  it('sanitizes user address by trimming strings and preserving custom fields', () => {
    const sanitized = sanitizeUserAddress({
      street: '  вул. Сагайдачного, 10  ',
      apartment: '  12B  ',
      entranceFloor: '  2 підїзд  ',
      label: '  Офіс  ',
      isDefaultTransfer: true,
    });

    expect(sanitized).toEqual({
      id: undefined,
      street: 'вул. Сагайдачного, 10',
      apartment: '12B',
      entranceFloor: '2 підїзд',
      label: 'Офіс',
      isDefaultTransfer: true,
    });
  });

  it('handles null or undefined input gracefully in sanitizeUserAddress', () => {
    expect(sanitizeUserAddress(null)).toEqual(createEmptyUserAddress());
    expect(sanitizeUserAddress(undefined)).toEqual(createEmptyUserAddress());
  });

  it('detects Figma placeholder address', () => {
    expect(
      isFigmaAddressPlaceholder({
        street: 'вул. Хрещатик, 15',
        apartment: '42',
      })
    ).toBe(true);

    expect(
      isFigmaAddressPlaceholder({
        street: 'вул. Франка, 4',
        apartment: '12',
      })
    ).toBe(false);

    expect(isFigmaAddressPlaceholder(null)).toBe(false);
  });

  it('formats address display string correctly', () => {
    expect(formatAddressDisplay(null)).toBe('Дім, Офіс');
    expect(formatAddressDisplay({ street: '' })).toBe('Дім, Офіс');

    expect(
      formatAddressDisplay({
        street: 'вул. Шевченка, 1',
        apartment: '15',
        label: 'Дім',
      })
    ).toBe('Дім: вул. Шевченка, 1, кв. 15');

    expect(
      formatAddressDisplay({
        street: 'вул. Володимирська, 10',
        apartment: '',
        label: '',
      })
    ).toBe('вул. Володимирська, 10');
  });

  it('formats full address line with apartment and entrance', () => {
    const full = formatAddressFullLine({
      street: 'вул. Миру, 25',
      apartment: '55',
      entranceFloor: '2 підїзд, 4 пов.',
    });
    expect(full).toBe('вул. Миру, 25, кв. 55, 2 підїзд, 4 пов.');
  });

  it('resolves address label badges with appropriate emojis', () => {
    expect(resolveAddressLabelBadge('Дім')).toBe('🏡 Дім');
    expect(resolveAddressLabelBadge('Офіс')).toBe('💼 Офіс');
    expect(resolveAddressLabelBadge('Дача')).toBe('🌿 Дача');
    expect(resolveAddressLabelBadge('Батьки')).toBe('📍 Батьки');
    expect(resolveAddressLabelBadge('🏡 Дім')).toBe('🏡 Дім');
  });

  it('validates user address properly', () => {
    expect(validateUserAddress({ street: '' }).isValid).toBe(false);
    expect(validateUserAddress({ street: '12' }).isValid).toBe(false);
    expect(validateUserAddress({ street: 'вул. Липська, 5' }).isValid).toBe(true);
  });
});
