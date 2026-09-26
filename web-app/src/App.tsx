import { useEffect, useState, type ReactNode } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
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

export function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getReturnPath = (fallback = '/main') => {
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get('from') || searchParams.get('returnTo');
    if (returnTo) return returnTo;
    const state = location.state as { from?: string } | null;
    return state?.from || fallback;
  };

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const authed = Boolean(session?.user);
        setIsLoggedIn(authed);
        setIsAuthLoading(false);
      })
      .catch(() => {
        setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = Boolean(session?.user);
      setIsLoggedIn(authed);
      setIsAuthLoading(false);
    });

    return () => {
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
            isLoggedIn ? (
              <MainPage
                isLoggedIn={isLoggedIn}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onProfileClick={() => navigate('/profile')}
                onToast={showToast}
              />
            ) : (
              <LandingPage
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onBookClick={() => {
                  if (isLoggedIn) {
                    navigate('/main');
                  } else {
                    showToast('Увійдіть для запису на візит');
                    navigate('/login');
                  }
                }}
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
                  navigate('/main');
                } else {
                  showToast('Увійдіть для запису на візит');
                  navigate('/login');
                }
              }}
            />
          }
        />

        <Route
          path="/main"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isAuthLoading={isAuthLoading}>
              <MainPage
                isLoggedIn={isLoggedIn}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onProfileClick={() => navigate('/profile')}
                onToast={showToast}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to={getReturnPath('/main')} replace />
            ) : (
              <LoginPage
                onBack={() => navigate('/')}
                onSuccess={() => {
                  setIsLoggedIn(true);
                  const target = getReturnPath('/main');
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
                onBookClick={() => navigate('/main')}
                onAddPetClick={() =>
                  navigate('/pet-register', { state: { from: '/profile' } })
                }
                onPetClick={(pet) => navigate(`/pets/${pet.id}`)}
                onPersonalInfoClick={() => navigate('/profile/personal-data')}
                onAddressesClick={() => navigate('/profile/addresses')}
                onPaymentMethodsClick={() => navigate('/profile/payment-methods')}
                onViewAllUpcomingClick={() => navigate('/profile/upcoming-visits')}
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
                onBookClick={() => navigate('/main')}
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
                onBookClick={() => navigate('/main')}
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
                onBookClick={() => navigate('/main')}
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
                onBookClick={() => navigate('/main')}
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
                onBookClick={() => navigate('/main')}
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
                onBookClick={() => navigate('/main')}
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
                onBookClick={() => navigate('/main')}
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
                onBookClick={() => navigate('/main')}
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
                onBookClick={() => navigate('/main')}
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
                onBookClick={() => navigate('/main')}
                onToast={showToast}
              />
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
      <AppRoutes />
    </BrowserRouter>
  );
}
