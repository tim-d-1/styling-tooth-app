export interface ProfileUser {
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string | null;
  loyaltyTier?: string;
  bonusPoints?: number;
}

export interface UpcomingVisitData {
  id: string;
  petName: string;
  petAvatarUrl?: string | null;
  serviceTitle: string;
  masterName: string;
  price: number;
  scheduledAtFormatted: string;
}

export interface ProfilePet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other' | string;
  breed?: string | null;
  ageFormatted?: string | null;
  avatarUrl?: string | null;
  lastVisitFormatted?: string | null;
}

export interface SettingCardItem {
  id: string;
  title: string;
  subtitle?: string;
  iconName: string;
  isOnline?: boolean;
}
