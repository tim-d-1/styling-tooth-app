import { useEffect, useState, type ReactNode } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import PetRegisterPage from '@/features/pets/PetRegisterPage';
import PetDetailPage from '@/features/pets/PetDetailPage';
import PetCareSchedulePage from '@/features/pets/PetCareSchedulePage';
import PetProcedureHistoryPage from '@/features/pets/PetProcedureHistoryPage';
import LandingPage from '@/features/landing/LandingPage';
import MainPage from '@/features/dashboard/MainPage';
import ProfilePage from '@/features/profile/ProfilePage';
import PersonalDataPage from '@/features/profile/PersonalDataPage';
import MyAddressesPage from '@/features/profile/MyAddressesPage';
import PaymentMethodsPage from '@/features/profile/PaymentMethodsPage';
import ProfileUpcomingVisitsPage from '@/features/profile/ProfileUpcomingVisitsPage';
import LoyaltyProgramPage from '@/features/profile/LoyaltyProgramPage';
import QuickSchedulePage from '@/features/schedule/QuickSchedulePage';
import BookingPage from '@/features/booking/BookingPage';
import ArticleDetailPage from '@/features/articles/ArticleDetailPage';
import PromoDetailPage from '@/features/promotions/PromoDetailPage';
import CitySelectionPage from '@/features/location/CitySelectionPage';
import CreateTicketPage from '@/features/support/CreateTicketPage';
import SupportChatPage from '@/features/support/SupportChatPage';
import SupportCallPage from '@/features/support/SupportCallPage';
import NotificationSettingsPage from '@/features/profile/NotificationSettingsPage';
import FaqPage from '@/features/faq/FaqPage';
import PrivacyPolicyPage from '@/features/legal/PrivacyPolicyPage';
import TermsOfUsePage from '@/features/legal/TermsOfUsePage';
import RequestProcessingPage from '@/features/admin/RequestProcessingPage';
import AdminSupportPage from '@/features/admin/AdminSupportPage';
import type { UserRole } from '@/features/auth/auth_types';
import { CITY_STORAGE_KEY } from '@/features/location/city_types';
import ScrollToTop from '@/components/layout/ScrollToTop';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  children: ReactNode;
}

export function ProtectedRoute({
  isLoggedIn,
  isAuthLoading,
  children,
}: ProtectedRouteProps) {
  const location = useLocation();

  if (isAuthLoading) {
    return <div className="min-h-screen bg-surface-cream" />;
  }

  if (!isLoggedIn) {
    const returnTo = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(returnTo)}`}
        state={{ from: returnTo }}
        replace
      />
    );
  }

  return <>{children}</>;
}

export interface RoleRouteProps {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  userRole?: UserRole;
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function RoleRoute({
  isLoggedIn,
  isAuthLoading,
  userRole = 'client',
  allowedRoles,
  children,
}: RoleRouteProps) {
  const location = useLocation();

  if (isAuthLoading) {
    return <div className="min-h-screen bg-surface-cream" />;
  }

  if (!isLoggedIn) {
    const returnTo = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(returnTo)}`}
        state={{ from: returnTo }}
        replace
      />
    );
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/main" replace />;
  }

  return <>{children}</>;
}

function ArticleRouteWrapper({
  isLoggedIn,
  onToast,
}: {
  isLoggedIn: boolean;
  onToast: (msg: string) => void;
}) {
  const { articleId } = useParams();
  const navigate = useNavigate();

  return (
    <ArticleDetailPage
      articleId={articleId}
      isLoggedIn={isLoggedIn}
      onBackClick={() => navigate(-1)}
      onLoginClick={() => navigate('/login')}
      onRegisterClick={() => navigate('/register')}
      onProfileClick={() => navigate('/profile')}
      onToast={onToast}
    />
  );
}

function PromoRouteWrapper({
  isLoggedIn,
}: {
  isLoggedIn: boolean;
}) {
  const { promoId } = useParams();
  const navigate = useNavigate();

  return (
    <PromoDetailPage
      promoId={promoId}
      isLoggedIn={isLoggedIn}
      onBackClick={() => navigate(-1)}
      onLoginClick={() => navigate('/login')}
      onRegisterClick={() => navigate('/register')}
      onProfileClick={() => navigate('/profile')}
      onQuickBookClick={() => navigate('/quick-schedule')}
    />
  );
}

function CitySelectionRouteWrapper({
  isLoggedIn,
  onCitySelected,
}: {
  isLoggedIn: boolean;
  onCitySelected?: (city: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <CitySelectionPage
      isLoggedIn={isLoggedIn}
      onBackClick={() => navigate(-1)}
      onLoginClick={() => navigate('/login')}
      onRegisterClick={() => navigate('/register')}
      onProfileClick={() => navigate('/profile')}
      onConfirm={(city) => {
        onCitySelected?.(city);
        navigate(-1);
      }}
    />
  );
}

export function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('client');
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CITY_STORAGE_KEY) || 'Запоріжжя';
    }
    return 'Запоріжжя';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getReturnPath = (fallback = '/main', role?: UserRole) => {
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get('from') || searchParams.get('returnTo');
    if (returnTo) return returnTo;
    const state = location.state as { from?: string } | null;
    if (state?.from) return state.from;
    const activeRole = role ?? userRole;
    if (activeRole === 'admin' || activeRole === 'receptionist' || activeRole === 'master') {
      return '/admin/requests';
    }
    return fallback;
  };

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (!session?.user) {
          if (isMounted) {
            setIsLoggedIn(false);
            setUserRole('client');
            setIsAuthLoading(false);
          }
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (userError || !userData?.user) {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          if (isMounted) {
            setIsLoggedIn(false);
            setUserRole('client');
            setIsAuthLoading(false);
          }
          return;
        }

        const metaRole = (userData.user.user_metadata?.role ||
          userData.user.app_metadata?.role ||
          localStorage.getItem('user_role')) as UserRole | undefined;

        if (isMounted) {
          if (metaRole && ['admin', 'receptionist', 'master', 'client'].includes(metaRole)) {
            setUserRole(metaRole);
          }
          setIsLoggedIn(true);
          setIsAuthLoading(false);
        }

        void (async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userData.user.id)
              .maybeSingle();

            if (isMounted && profile?.role) {
              setUserRole(profile.role as UserRole);
              try {
                localStorage.setItem('user_role', profile.role);
              } catch {
                // ignore storage error
              }
            }
          } catch {
            // ignore network / mock error
          }
        })();
      } catch {
        if (isMounted) {
          setIsLoggedIn(false);
          setUserRole('client');
          setIsAuthLoading(false);
        }
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }
      if (event === 'SIGNED_OUT' || !session?.user) {
        if (isMounted) {
          setIsLoggedIn(false);
          setUserRole('client');
          setIsAuthLoading(false);
          try {
            localStorage.removeItem('user_role');
          } catch {
            // ignore storage error
          }
        }
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const metaRole = (session.user.user_metadata?.role ||
          session.user.app_metadata?.role ||
          localStorage.getItem('user_role')) as UserRole | undefined;

        if (isMounted) {
          if (metaRole && ['admin', 'receptionist', 'master', 'client'].includes(metaRole)) {
            setUserRole(metaRole);
          }
          setIsLoggedIn(true);
          setIsAuthLoading(false);
        }

        void (async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();

            if (isMounted && profile?.role) {
              setUserRole(profile.role as UserRole);
              try {
                localStorage.setItem('user_role', profile.role);
              } catch {
                // ignore storage error
              }
            }
          } catch {
            // ignore network / mock error
          }
        })();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3000);
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-content-dark text-white px-5 py-3.5 rounded-xl shadow-2xl text-sm font-primary animate-fade-in">
          {toastMessage}
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            isAuthLoading ? (
              <div className="min-h-screen bg-surface-cream" />
            ) : isLoggedIn ? (
              <MainPage
                isLoggedIn={isLoggedIn}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onProfileClick={() => navigate('/profile')}
                onArticleClick={(articleId) => navigate(`/articles/${articleId}`)}
                onPromoClick={(promoId) => navigate(`/promotions/${promoId}`)}
                onLocationClick={() => navigate('/select-city')}
                selectedCity={selectedCity}
                onToast={showToast}
              />
            ) : (
              <LandingPage
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onBookClick={() => {
                  if (isLoggedIn) {
                    navigate('/booking');
                  } else {
                    showToast('Увійдіть для запису на візит');
                    navigate('/login?from=/booking');
                  }
                }}
                onQuickBookClick={() => navigate('/quick-schedule')}
              />
            )
          }
        />

        <Route
          path="/landing"
          element={
            <LandingPage
              onLoginClick={() => navigate('/login')}
              onRegisterClick={() => navigate('/register')}
              onBookClick={() => {
                if (isLoggedIn) {
                  navigate('/booking');
                } else {
                  showToast('Увійдіть для запису на візит');
                  navigate('/login?from=/booking');
                }
              }}
              onQuickBookClick={() => navigate('/quick-schedule')}
            />
          }
        />

        <Route
          path="/quick-schedule"
          element={
            <QuickSchedulePage
              isLoggedIn={isLoggedIn}
              onBackClick={() => navigate(-1)}
              onLoginClick={() => navigate('/login')}
              onRegisterClick={() => navigate('/register')}
              onProfileClick={() => navigate('/profile')}
              onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
              onBookClick={() => {
                if (isLoggedIn) {
                  navigate('/booking');
                } else {
                  showToast('Увійдіть для запису на візит');
                  navigate('/login?from=/booking');
                }
              }}
              onQuickBookClick={() => {
                if (isLoggedIn) {
                  navigate('/booking');
                } else {
                  showToast('Увійдіть для запису на візит');
                  navigate('/login?from=/booking');
                }
              }}
              onToast={showToast}
            />
          }
        />

        <Route
          path="/quick-booking"
          element={<Navigate to="/quick-schedule" replace />}
        />

        <Route
          path="/booking"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <BookingPage
                isLoggedIn={isLoggedIn}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onProfileClick={() => navigate('/profile')}
                onBackClick={() => navigate(-1)}
                onAddPetClick={() => navigate('/pet-register?from=/booking')}
                onComplete={() => {
                  navigate('/main');
                  showToast('Візит успішно заброньовано!');
                }}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book"
          element={<Navigate to="/booking" replace />}
        />

        <Route
          path="/articles/:articleId"
          element={
            <ArticleRouteWrapper
              isLoggedIn={isLoggedIn}
              onToast={showToast}
            />
          }
        />
        <Route
          path="/articles"
          element={<Navigate to="/articles/shampoo-guide" replace />}
        />
        <Route
          path="/advice/:articleId"
          element={
            <ArticleRouteWrapper
              isLoggedIn={isLoggedIn}
              onToast={showToast}
            />
          }
        />
        <Route
          path="/advice"
          element={<Navigate to="/articles/shampoo-guide" replace />}
        />

        <Route
          path="/promotions/:promoId"
          element={<PromoRouteWrapper isLoggedIn={isLoggedIn} />}
        />
        <Route
          path="/promotions"
          element={<Navigate to="/promotions/free-nail-trimming" replace />}
        />
        <Route
          path="/promos/:promoId"
          element={<PromoRouteWrapper isLoggedIn={isLoggedIn} />}
        />
        <Route
          path="/promos"
          element={<Navigate to="/promotions/free-nail-trimming" replace />}
        />

        <Route
          path="/select-city"
          element={
            <CitySelectionRouteWrapper
              isLoggedIn={isLoggedIn}
              onCitySelected={(city) => setSelectedCity(city)}
            />
          }
        />
        <Route
          path="/cities"
          element={<Navigate to="/select-city" replace />}
        />
        <Route
          path="/location"
          element={<Navigate to="/select-city" replace />}
        />

        <Route
          path="/main"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <MainPage
                isLoggedIn={isLoggedIn}
                userRole={userRole}
                onDashboardClick={() => navigate('/admin/requests')}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onProfileClick={() => navigate('/profile')}
                onBookClick={() => navigate('/booking')}
                onArticleClick={(articleId) => navigate(`/articles/${articleId}`)}
                onPromoClick={(promoId) => navigate(`/promotions/${promoId}`)}
                onLocationClick={() => navigate('/select-city')}
                selectedCity={selectedCity}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to={getReturnPath('/main', userRole)} replace />
            ) : (
              <LoginPage
                onBack={() => navigate('/')}
                onSuccess={async () => {
                  let role: UserRole = userRole;
                  try {
                    const cached = localStorage.getItem('user_role') as UserRole | null;
                    if (cached && ['admin', 'receptionist', 'master', 'client'].includes(cached)) {
                      role = cached;
                    }
                    const { data } = await supabase.auth.getUser();
                    if (data?.user) {
                      const metaRole = (data.user.user_metadata?.role ||
                        data.user.app_metadata?.role) as UserRole | undefined;
                      if (metaRole && ['admin', 'receptionist', 'master', 'client'].includes(metaRole)) {
                        role = metaRole;
                      } else {
                        const { data: profile } = await supabase
                          .from('profiles')
                          .select('role')
                          .eq('id', data.user.id)
                          .maybeSingle();
                        if (profile?.role) {
                          role = profile.role as UserRole;
                        }
                      }
                      setUserRole(role);
                      try {
                        localStorage.setItem('user_role', role);
                      } catch {
                        // ignore storage error
                      }
                    }
                  } catch {}
                  setIsLoggedIn(true);
                  const searchParams = new URLSearchParams(location.search);
                  const returnTo = searchParams.get('from') || searchParams.get('returnTo');
                  const state = location.state as { from?: string } | null;
                  const isStaff =
                    role === 'admin' || role === 'receptionist' || role === 'master';
                  const target =
                    returnTo || state?.from || (isStaff ? '/admin/requests' : '/main');
                  navigate(target, { replace: true });
                  showToast('Успішний вхід у систему');
                }}
                onNavigateRegister={() => navigate('/register')}
              />
            )
          }
        />

        <Route
          path="/register"
          element={
            isLoggedIn ? (
              <Navigate to={getReturnPath('/main')} replace />
            ) : (
              <RegisterPage
                onBack={() => navigate('/')}
                onSuccess={() => {
                  setIsLoggedIn(true);
                  navigate('/pet-register');
                  showToast('Успішна реєстрація! Додайте вашого улюбленця');
                }}
                onNavigateLogin={() => navigate('/login')}
              />
            )
          }
        />

        <Route
          path="/pet-register"
          element={
            <PetRegisterPage
              onBack={() => navigate(getReturnPath(isLoggedIn ? '/profile' : '/'))}
              onSuccess={() => {
                const target = getReturnPath(isLoggedIn ? '/profile' : '/main');
                navigate(target);
                showToast('Тваринку успішно зареєстровано');
              }}
              onSkip={() => navigate(getReturnPath(isLoggedIn ? '/profile' : '/main'))}
            />
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <ProfilePage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onBookClick={() => navigate('/booking')}
                onAddPetClick={() =>
                  navigate('/pet-register', { state: { from: '/profile' } })
                }
                onPetClick={(pet) => navigate(`/pets/${pet.id}`)}
                onPersonalInfoClick={() => navigate('/profile/personal-data')}
                onAddressesClick={() => navigate('/profile/addresses')}
                onPaymentMethodsClick={() => navigate('/profile/payment-methods')}
                onViewAllUpcomingClick={() => navigate('/profile/upcoming-visits')}
                onLoyaltyProgramClick={() => navigate('/profile/loyalty')}
                onNotificationsClick={() => navigate('/profile/notifications')}
                onSupportClick={() => navigate('/support/chat')}
                onFaqClick={() => navigate('/faq')}
                onDashboardClick={() => navigate('/admin/requests')}
                userRole={userRole}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/personal-data"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PersonalDataPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onAddressesClick={() => navigate('/profile/addresses')}
                onPaymentMethodsClick={() => navigate('/profile/payment-methods')}
                onLogout={() => {
                  setIsLoggedIn(false);
                  navigate('/login');
                  showToast('Ви вийшли з акаунту');
                }}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/personal-info"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PersonalDataPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onAddressesClick={() => navigate('/profile/addresses')}
                onPaymentMethodsClick={() => navigate('/profile/payment-methods')}
                onLogout={() => {
                  setIsLoggedIn(false);
                  navigate('/login');
                  showToast('Ви вийшли з акаунту');
                }}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/addresses"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <MyAddressesPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPersonalDataClick={() => navigate('/profile/personal-data')}
                onPaymentMethodsClick={() => navigate('/profile/payment-methods')}
                onLogout={() => {
                  setIsLoggedIn(false);
                  navigate('/login');
                  showToast('Ви вийшли з акаунту');
                }}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/my-addresses"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <MyAddressesPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPersonalDataClick={() => navigate('/profile/personal-data')}
                onPaymentMethodsClick={() => navigate('/profile/payment-methods')}
                onLogout={() => {
                  setIsLoggedIn(false);
                  navigate('/login');
                  showToast('Ви вийшли з акаунту');
                }}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/personal-data/addresses"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <MyAddressesPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPersonalDataClick={() => navigate('/profile/personal-data')}
                onPaymentMethodsClick={() => navigate('/profile/payment-methods')}
                onLogout={() => {
                  setIsLoggedIn(false);
                  navigate('/login');
                  showToast('Ви вийшли з акаунту');
                }}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/payment-methods"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PaymentMethodsPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPersonalDataClick={() => navigate('/profile/personal-data')}
                onAddressesClick={() => navigate('/profile/addresses')}
                onLogout={() => {
                  setIsLoggedIn(false);
                  navigate('/login');
                  showToast('Ви вийшли з акаунту');
                }}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/payments"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PaymentMethodsPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPersonalDataClick={() => navigate('/profile/personal-data')}
                onAddressesClick={() => navigate('/profile/addresses')}
                onLogout={() => {
                  setIsLoggedIn(false);
                  navigate('/login');
                  showToast('Ви вийшли з акаунту');
                }}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/personal-data/payment-methods"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PaymentMethodsPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPersonalDataClick={() => navigate('/profile/personal-data')}
                onAddressesClick={() => navigate('/profile/addresses')}
                onLogout={() => {
                  setIsLoggedIn(false);
                  navigate('/login');
                  showToast('Ви вийшли з акаунту');
                }}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pets/:petId"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PetDetailPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onAddPetClick={() =>
                  navigate('/pet-register', { state: { from: location.pathname } })
                }
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pets"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PetDetailPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onAddPetClick={() =>
                  navigate('/pet-register', { state: { from: '/pets' } })
                }
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/pets/:petId"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PetDetailPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onAddPetClick={() =>
                  navigate('/pet-register', { state: { from: location.pathname } })
                }
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pets/:petId/schedule"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PetCareSchedulePage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPetsClick={() => navigate('/profile')}
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pets/schedule"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PetCareSchedulePage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPetsClick={() => navigate('/profile')}
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/pets/:petId/schedule"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PetCareSchedulePage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPetsClick={() => navigate('/profile')}
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pets/:petId/history"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PetProcedureHistoryPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPetsClick={() => navigate('/profile')}
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pets/history"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PetProcedureHistoryPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPetsClick={() => navigate('/profile')}
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/pets/:petId/history"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <PetProcedureHistoryPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onPetsClick={() => navigate('/profile')}
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/upcoming-visits"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <ProfileUpcomingVisitsPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onBookClick={() => navigate('/booking')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/loyalty"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <LoyaltyProgramPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/loyalty-program"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <LoyaltyProgramPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/support/new-ticket"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <CreateTicketPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onSuccess={(ticketId) => navigate(`/support/chat?ticketId=${ticketId}`)}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/support/chat"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <SupportChatPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onCallClick={(ticketId) =>
                  navigate(ticketId ? `/support/call?ticketId=${ticketId}` : '/support/call')
                }
                onCreateTicketClick={() => navigate('/support/new-ticket')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/support/call"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <SupportCallPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onBackToChat={(ticketId) =>
                  navigate(ticketId ? `/support/chat?ticketId=${ticketId}` : '/support/chat')
                }
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/notifications"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <NotificationSettingsPage
                onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
                onProfileClick={() => navigate('/profile')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faq"
          element={
            <FaqPage
              isLoggedIn={isLoggedIn}
              onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
              onLoginClick={() => navigate('/login')}
              onRegisterClick={() => navigate('/register')}
              onProfileClick={() => navigate('/profile')}
              onContactSupport={() =>
                navigate(isLoggedIn ? '/support/new-ticket' : '/login?from=/support/new-ticket')
              }
            />
          }
        />

        <Route
          path="/privacy-policy"
          element={
            <PrivacyPolicyPage
              isLoggedIn={isLoggedIn}
              onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
              onLoginClick={() => navigate('/login')}
              onRegisterClick={() => navigate('/register')}
              onProfileClick={() => navigate('/profile')}
            />
          }
        />
        <Route
          path="/privacy"
          element={<Navigate to="/privacy-policy" replace />}
        />

        <Route
          path="/terms"
          element={
            <TermsOfUsePage
              isLoggedIn={isLoggedIn}
              onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
              onLoginClick={() => navigate('/login')}
              onRegisterClick={() => navigate('/register')}
              onProfileClick={() => navigate('/profile')}
            />
          }
        />
        <Route
          path="/terms-of-service"
          element={<Navigate to="/terms" replace />}
        />

        <Route
          path="/support"
          element={<Navigate to="/support/chat" replace />}
        />
        <Route
          path="/support/create"
          element={<Navigate to="/support/new-ticket" replace />}
        />

        <Route
          path="/admin/requests"
          element={
            <RoleRoute
              isLoggedIn={isLoggedIn}
              isAuthLoading={isAuthLoading}
              userRole={userRole}
              allowedRoles={['admin', 'receptionist', 'master']}
            >
              <RequestProcessingPage
                isLoggedIn={isLoggedIn}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onProfileClick={() => navigate('/profile')}
                onNavClick={(nav) => {
                  if (nav === 'home') navigate(isLoggedIn ? '/main' : '/');
                  else navigate(`/${nav}`);
                }}
                onToast={showToast}
              />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <RoleRoute
              isLoggedIn={isLoggedIn}
              isAuthLoading={isAuthLoading}
              userRole={userRole}
              allowedRoles={['admin', 'receptionist', 'master']}
            >
              <AdminSupportPage
                isLoggedIn={isLoggedIn}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onProfileClick={() => navigate('/profile')}
                onNavClick={(nav) => {
                  if (nav === 'home') navigate(isLoggedIn ? '/main' : '/');
                  else navigate(`/${nav}`);
                }}
                onToast={showToast}
              />
            </RoleRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/requests" replace />} />
        <Route path="/receptionist" element={<Navigate to="/admin/requests" replace />} />
        <Route path="/master" element={<Navigate to="/admin/requests" replace />} />
        <Route path="/staff" element={<Navigate to="/admin/requests" replace />} />
        <Route path="/requests" element={<Navigate to="/admin/requests" replace />} />
        <Route path="/dashboard/requests" element={<Navigate to="/admin/requests" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              {userRole === 'admin' || userRole === 'receptionist' || userRole === 'master' ? (
                <Navigate to="/admin/requests" replace />
              ) : (
                <Navigate to="/main" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}
