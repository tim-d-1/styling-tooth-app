import { useContext } from 'react';
import { AuthContext } from './auth_context';
import type { AuthContextValue } from './auth_types';

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export default useAuth;
