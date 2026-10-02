import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type FC,
} from 'react';
import { supabase } from '@/lib/supabase';
import {
  type StaffAuthContextValue,
  type StaffUserProfile,
  type StaffRole,
  isStaffRole,
} from './auth_types';

const StaffAuthContext = createContext<StaffAuthContextValue>({
  user: null,
  role: null,
  isLoggedIn: false,
  isAuthLoading: true,
  logout: async () => {},
  refreshProfile: async () => {},
});

export interface StaffAuthProviderProps {
  children: ReactNode;
  initialRole?: StaffRole;
  initialProfile?: StaffUserProfile | null;
}

export const StaffAuthProvider: FC<StaffAuthProviderProps> = ({
  children,
  initialRole,
  initialProfile,
}) => {
  const [user, setUser] = useState<StaffUserProfile | null>(initialProfile || null);
  const [role, setRole] = useState<StaffRole | null>(
    initialRole || initialProfile?.role || null
  );
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

      const resolvedRole = profile?.role;
      if (isStaffRole(resolvedRole)) {
        const staffUser: StaffUserProfile = {
          id: userId,
          email: profile?.email || email,
          role: resolvedRole,
          fullName: profile?.full_name || null,
          phone: profile?.phone || null,
          avatarUrl: profile?.avatar_url || null,
        };
        setUser(staffUser);
        setRole(resolvedRole);
        try {
          localStorage.setItem('staff_role', resolvedRole);
        } catch {}
      } else {
        // Not a staff user
        setUser(null);
        setRole(null);
      }
    } catch {
      setUser(null);
      setRole(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      await loadUserProfile(data.user.id, data.user.email ?? null);
    }
  }, [loadUserProfile]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setRole(null);
    try {
      localStorage.removeItem('staff_role');
      localStorage.removeItem('user_role');
    } catch {}
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (!session?.user) {
          if (isMounted) {
            setUser(null);
            setRole(null);
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
            setRole(null);
            setIsAuthLoading(false);
          }
          return;
        }

        const metaRole =
          (userData.user.user_metadata?.role as string) ||
          (userData.user.app_metadata?.role as string);

        if (isStaffRole(metaRole)) {
          if (isMounted) {
            setRole(metaRole);
            setUser({
              id: userData.user.id,
              email: userData.user.email || null,
              role: metaRole,
              fullName: userData.user.user_metadata?.full_name || null,
              phone: userData.user.phone || null,
              avatarUrl: userData.user.user_metadata?.avatar_url || null,
            });
            setIsAuthLoading(false);
          }
        }

        await loadUserProfile(userData.user.id, userData.user.email ?? null);
        if (isMounted) {
          setIsAuthLoading(false);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setRole(null);
          setIsAuthLoading(false);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_OUT' || !session?.user) {
        if (isMounted) {
          setUser(null);
          setRole(null);
          setIsAuthLoading(false);
        }
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        void loadUserProfile(session.user.id, session.user.email ?? null).then(() => {
          if (isMounted) setIsAuthLoading(false);
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const value: StaffAuthContextValue = {
    user,
    role,
    isLoggedIn: Boolean(user && role && isStaffRole(role)),
    isAuthLoading,
    logout,
    refreshProfile,
  };

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
};

export function useStaffAuth(): StaffAuthContextValue {
  return useContext(StaffAuthContext);
}
