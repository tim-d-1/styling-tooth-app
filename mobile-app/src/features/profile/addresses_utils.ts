import { UserAddress } from './profile_types';

export const createEmptyUserAddress = (): UserAddress => ({
  street: '',
  apartment: '',
  entranceFloor: '',
  label: 'Дім',
  isDefaultTransfer: false,
});

export const sanitizeUserAddress = (
  raw?: Partial<UserAddress> | null
): UserAddress => {
  const empty = createEmptyUserAddress();
  if (!raw) return empty;

  return {
    id: raw.id || undefined,
    street: typeof raw.street === 'string' ? raw.street.trim() : '',
    apartment: typeof raw.apartment === 'string' ? raw.apartment.trim() : '',
    entranceFloor:
      typeof raw.entranceFloor === 'string' ? raw.entranceFloor.trim() : '',
    label:
      typeof raw.label === 'string' && raw.label.trim()
        ? raw.label.trim()
        : 'Дім',
    isDefaultTransfer: Boolean(raw.isDefaultTransfer),
  };
};

export const isFigmaAddressPlaceholder = (
  address?: Partial<UserAddress> | null
): boolean => {
  if (!address) return false;
  const street = address.street?.trim();
  const apt = address.apartment?.trim();
  return street === 'вул. Хрещатик, 15' && apt === '42';
};

export const formatAddressDisplay = (
  address?: Partial<UserAddress> | null
): string => {
  if (!address || !address.street || !address.street.trim()) {
    return 'Дім, Офіс';
  }
  const cleanStreet = address.street.trim();
  const cleanApt = address.apartment?.trim();
  const cleanLabel = address.label?.trim();

  const baseText = cleanApt ? `${cleanStreet}, кв. ${cleanApt}` : cleanStreet;
  return cleanLabel ? `${cleanLabel}: ${baseText}` : baseText;
};

export const formatAddressFullLine = (
  address: Partial<UserAddress>
): string => {
  const parts: string[] = [];
  if (address.street?.trim()) {
    parts.push(address.street.trim());
  }
  if (address.apartment?.trim()) {
    parts.push(`кв. ${address.apartment.trim()}`);
  }
  if (address.entranceFloor?.trim()) {
    parts.push(address.entranceFloor.trim());
  }
  return parts.join(', ');
};

export const resolveAddressLabelBadge = (label: string): string => {
  const trimmed = label.trim();
  if (!trimmed) return '📍 Адреса';
  if (trimmed === 'Дім') return '🏡 Дім';
  if (trimmed === 'Офіс') return '💼 Офіс';
  if (trimmed === 'Дача') return '🌿 Дача';
  if (trimmed.startsWith('🏡') || trimmed.startsWith('💼') || trimmed.startsWith('🌿') || trimmed.startsWith('📍')) {
    return trimmed;
  }
  return `📍 ${trimmed}`;
};

export const validateUserAddress = (
  address: Partial<UserAddress>
): { isValid: boolean; error?: string } => {
  const street = address.street?.trim() || '';
  if (street.length < 3) {
    return {
      isValid: false,
      error: 'Будь ласка, вкажіть вулицю та номер будинку',
    };
  }
  return { isValid: true };
};
