import { useEffect, useLayoutEffect, useState } from 'react';
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
import LandingPage from '@/features/landing/LandingPage';
import MainPage from '@/features/dashboard/MainPage';
import { supabase } from '@/lib/supabase';

function HashSync() {
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash === 'login' && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      } else if (hash === 'register' && location.pathname !== '/register') {
        navigate('/register', { replace: true });
      } else if (hash === 'pet-register' && location.pathname !== '/pet-register') {
        navigate('/pet-register', { replace: true });
      } else if (hash === 'main' && location.pathname !== '/main') {
        navigate('/main', { replace: true });
      } else if (hash === 'landing' && location.pathname !== '/landing') {
        navigate('/landing', { replace: true });
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [navigate, location.pathname]);

  return null;
}

export function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authed = Boolean(session?.user);
      setIsLoggedIn(authed);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = Boolean(session?.user);
      setIsLoggedIn(authed);
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
      <HashSync />
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
            isLoggedIn ? (
              <MainPage
                isLoggedIn={isLoggedIn}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onToast={showToast}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/login"
          element={
            <LoginPage
              onBack={() => navigate('/')}
              onSuccess={() => {
                setIsLoggedIn(true);
                navigate('/main');
                showToast('Успішний вхід у систему');
              }}
              onNavigateRegister={() => navigate('/register')}
            />
          }
        />

        <Route
          path="/register"
          element={
            <RegisterPage
              onBack={() => navigate('/')}
              onSuccess={() => {
                setIsLoggedIn(true);
                navigate('/pet-register');
                showToast('Успішна реєстрація! Додайте вашого улюбленця');
              }}
              onNavigateLogin={() => navigate('/login')}
            />
          }
        />

        <Route
          path="/pet-register"
          element={
            <PetRegisterPage
              onBack={() => navigate('/')}
              onSuccess={() => {
                navigate('/main');
                showToast('Тваринку успішно зареєстровано');
              }}
              onSkip={() => navigate('/main')}
            />
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
