import { createContext } from 'react';
import type { AuthContextValue } from './auth_types';

export const defaultAuthContext: AuthContextValue = {
  user: null,
  role: 'client',
  isLoggedIn: false,
  isAuthLoading: true,
  isClient: true,
  isMaster: false,
  isReceptionist: false,
  isAdmin: false,
  isStaff: false,
  canManageAppointments: false,
  signOut: async () => {},
  refreshProfile: async () => {},
};

export const AuthContext = createContext<AuthContextValue>(defaultAuthContext);
