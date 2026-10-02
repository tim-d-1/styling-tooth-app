export type UserRole = 'admin' | 'receptionist' | 'master' | 'client';

export type StaffRole = 'admin' | 'receptionist' | 'master';

export interface StaffUserProfile {
  id: string;
  email: string | null;
  role: StaffRole;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface StaffAuthContextValue {
  user: StaffUserProfile | null;
  role: StaffRole | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === 'admin' || role === 'receptionist' || role === 'master';
}
