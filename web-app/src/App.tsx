import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import PetRegisterPage from '@/features/pets/PetRegisterPage';
import PetDetailPage from '@/features/pets/PetDetailPage';
import LandingPage from '@/features/landing/LandingPage';
import MainPage from '@/features/dashboard/MainPage';
import ProfilePage from '@/features/profile/ProfilePage';
import { supabase } from '@/lib/supabase';

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
            isLoggedIn ? (
              <MainPage
                isLoggedIn={isLoggedIn}
                onLoginClick={() => navigate('/login')}
                onRegisterClick={() => navigate('/register')}
                onProfileClick={() => navigate('/profile')}
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

        <Route
          path="/profile"
          element={
            <ProfilePage
              onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
              onBookClick={() => navigate('/main')}
              onAddPetClick={() => navigate('/pet-register')}
              onPetClick={(pet) => navigate(`/pets/${pet.id}`)}
              onToast={showToast}
            />
          }
        />

        <Route
          path="/pets/:petId"
          element={
            <PetDetailPage
              onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
              onProfileClick={() => navigate('/profile')}
              onAddPetClick={() => navigate('/pet-register')}
              onBookClick={() => navigate('/main')}
              onToast={showToast}
            />
          }
        />

        <Route
          path="/pets"
          element={
            <PetDetailPage
              onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
              onProfileClick={() => navigate('/profile')}
              onAddPetClick={() => navigate('/pet-register')}
              onBookClick={() => navigate('/main')}
              onToast={showToast}
            />
          }
        />

        <Route
          path="/profile/pets/:petId"
          element={
            <PetDetailPage
              onHomeClick={() => navigate(isLoggedIn ? '/main' : '/')}
              onProfileClick={() => navigate('/profile')}
              onAddPetClick={() => navigate('/pet-register')}
              onBookClick={() => navigate('/main')}
              onToast={showToast}
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
