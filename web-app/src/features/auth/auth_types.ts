export type UserRole = 'client' | 'master' | 'receptionist' | 'admin';

export interface AuthUserProfile {
  id: string;
  email: string | null;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface AuthContextValue {
  user: AuthUserProfile | null;
  role: UserRole;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  isClient: boolean;
  isMaster: boolean;
  isReceptionist: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  canManageAppointments: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
