export interface ProfileUser {
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string | null;
  loyaltyTier?: string;
  bonusPoints?: number;
}

export type ProfileIconName =
  | 'comment-user'
  | 'map-marker'
  | 'credit-card'
  | 'bell-ring'
  | 'comments'
  | 'interrogation'
  | 'lock';

export interface ProfileSettingItem {
  id: string;
  title: string;
  subtitle?: string;
  iconName: ProfileIconName;
  isOnline?: boolean;
}
