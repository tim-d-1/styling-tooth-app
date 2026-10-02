import { useState, type ReactNode } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { StaffAuthProvider, useStaffAuth } from '@/features/auth/StaffAuthProvider';
import StaffLoginPage from '@/features/auth/StaffLoginPage';
import RequestProcessingPage from '@/features/requests/RequestProcessingPage';
import AdminSupportPage from '@/features/support/AdminSupportPage';

export interface StaffProtectedRouteProps {
  children: ReactNode;
}

export function StaffProtectedRoute({ children }: StaffProtectedRouteProps) {
  const { isLoggedIn, isAuthLoading } = useStaffAuth();

  if (isAuthLoading) {
    return <div className="min-h-screen bg-surface-cream" />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function StaffAppRoutes() {
  const { isLoggedIn, isAuthLoading, logout } = useStaffAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
    showToast('Ви успішно вийшли із системи');
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
          path="/login"
          element={
            !isAuthLoading && isLoggedIn ? (
              <Navigate to="/requests" replace />
            ) : (
              <StaffLoginPage
                onSuccess={() => {
                  navigate('/requests', { replace: true });
                  showToast('Успішний вхід у панель персоналу');
                }}
              />
            )
          }
        />

        <Route
          path="/requests"
          element={
            <StaffProtectedRoute>
              <RequestProcessingPage
                onNavigateTab={(tab) => navigate(tab === 'requests' ? '/requests' : '/support')}
                onLogout={handleLogout}
                onToast={showToast}
              />
            </StaffProtectedRoute>
          }
        />

        <Route
          path="/support"
          element={
            <StaffProtectedRoute>
              <AdminSupportPage
                onNavigateTab={(tab) => navigate(tab === 'requests' ? '/requests' : '/support')}
                onLogout={handleLogout}
                onToast={showToast}
              />
            </StaffProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/requests" replace />} />
        <Route path="/admin" element={<Navigate to="/requests" replace />} />
        <Route path="/admin/requests" element={<Navigate to="/requests" replace />} />
        <Route path="/admin/support" element={<Navigate to="/support" replace />} />
        <Route path="*" element={<Navigate to="/requests" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <StaffAuthProvider>
      <BrowserRouter>
        <StaffAppRoutes />
      </BrowserRouter>
    </StaffAuthProvider>
  );
}
