import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type FC,
} from 'react';
import { supabase } from '@/lib/supabase';
import { AuthContext } from './auth_context';
import type { AuthContextValue, AuthUserProfile, UserRole } from './auth_types';

export interface AuthProviderProps {
  children: ReactNode;
  initialRole?: UserRole;
  initialProfile?: AuthUserProfile | null;
}

export const AuthProvider: FC<AuthProviderProps> = ({
  children,
  initialRole,
  initialProfile,
}) => {
  const [user, setUser] = useState<AuthUserProfile | null>(initialProfile || null);
  const [role, setRole] = useState<UserRole>(initialRole || initialProfile?.role || 'client');
  const [isAuthLoading, setIsAuthLoading] = useState(
    initialRole === undefined && initialProfile === undefined
  );

  const loadUserProfile = useCallback(async (userId: string, email: string | null = null) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, role, full_name, phone, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      const resolvedRole: UserRole = (profile?.role as UserRole) || 'client';
      const userProfile: AuthUserProfile = {
        id: userId,
        email: profile?.email || email,
        role: resolvedRole,
        fullName: profile?.full_name || null,
        phone: profile?.phone || null,
        avatarUrl: profile?.avatar_url || null,
      };

      setUser(userProfile);
      setRole(resolvedRole);
    } catch {
      setUser({
        id: userId,
        email,
        role: 'client',
        fullName: null,
        phone: null,
        avatarUrl: null,
      });
      setRole('client');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      await loadUserProfile(data.user.id, data.user.email || null);
    } else {
      setUser(null);
      setRole('client');
    }
  }, [loadUserProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setRole('client');
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;

        if (!sessionUser) {
          if (isMounted) {
            setUser(null);
            setRole('client');
            setIsAuthLoading(false);
          }
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (userError || !userData?.user) {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          if (isMounted) {
            setUser(null);
            setRole('client');
            setIsAuthLoading(false);
          }
          return;
        }

        await loadUserProfile(userData.user.id, userData.user.email || null);
        if (isMounted) {
          setIsAuthLoading(false);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setRole('client');
          setIsAuthLoading(false);
        }
      }
    }

    if (initialRole === undefined && initialProfile === undefined) {
      initAuth();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }
      if (event === 'SIGNED_OUT' || !session?.user) {
        if (isMounted) {
          setUser(null);
          setRole('client');
          setIsAuthLoading(false);
        }
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (isMounted) {
          await loadUserProfile(session.user.id, session.user.email || null);
          setIsAuthLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initialRole, initialProfile, loadUserProfile]);

  const isClient = role === 'client';
  const isMaster = role === 'master';
  const isReceptionist = role === 'receptionist';
  const isAdmin = role === 'admin';
  const isStaff = isMaster || isReceptionist || isAdmin;
  const canManageAppointments = isReceptionist || isAdmin;

  const value: AuthContextValue = {
    user,
    role,
    isLoggedIn: !!user,
    isAuthLoading,
    isClient,
    isMaster,
    isReceptionist,
    isAdmin,
    isStaff,
    canManageAppointments,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
