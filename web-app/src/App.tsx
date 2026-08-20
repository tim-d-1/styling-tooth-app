import { useEffect, useState } from 'react';
import Header from './components/Header';
import LocationBar from './components/LocationBar';
import GuestBanner from './components/GuestBanner';
import VisitSection, { type VisitData } from './components/VisitSection';
import PromoBannersGrid from './components/PromoBannersGrid';
import ExpertAdviceGrid, { type ArticleItem } from './components/ExpertAdviceGrid';
import LoginPage from './components/LoginPage';
import { supabase } from './lib/supabase';

const EXPERT_ARTICLES: ArticleItem[] = [
  {
    id: 'shampoo-guide',
    title: 'ЯК ОБРАТИ ПРАВИЛЬНИЙ ШАМПУНЬ?',
    bgImage: '/assets/images/golden_retriever_bath.png',
    bgColor: 'var(--color-soft-ice)',
    type: 'shampoo',
  },
  {
    id: 'paws-tips',
    title: '5 ПОРАД',
    subtitle: 'для здорових лап',
    bgImage: '/assets/images/dog_paw_close_up.png',
    bgColor: 'var(--color-soft-blue)',
    type: 'paw',
  },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'login'>('main');
  const [visit] = useState<VisitData | null>(null);
  const [activeNav, setActiveNav] = useState('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    const handleHashChange = () => {
      if (window.location.hash === '#login' || window.location.pathname === '/login') {
        setCurrentView('login');
      } else {
        setCurrentView('main');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3000);
  };

  const navigateToLogin = () => {
    setCurrentView('login');
    if (window.location.hash !== '#login') {
      window.location.hash = 'login';
    }
  };

  const navigateToMain = () => {
    setCurrentView('main');
    if (window.location.hash === '#login') {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  if (currentView === 'login') {
    return (
      <LoginPage
        onBack={navigateToMain}
        onSuccess={() => {
          setIsLoggedIn(true);
          navigateToMain();
          showToast('Успішний вхід у систему');
        }}
        onNavigateRegister={() => {
          showToast('Форма реєстрації в розробці');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-content-dark text-white px-5 py-3.5 rounded-xl shadow-2xl text-sm font-primary animate-fade-in">
          {toastMessage}
        </div>
      )}

      <Header
        isLoggedIn={isLoggedIn}
        activeNav={activeNav}
        onLoginClick={navigateToLogin}
        onNavClick={(nav) => {
          setActiveNav(nav);
          showToast(`Перехід на розділ: ${nav}`);
        }}
        onDeviceClick={() => showToast('Відкрито поповер завантаження додатка (QR-код)')}
        onProfileClick={() => showToast('Відкрито особистий кабінет клієнта')}
      />

      <LocationBar
        location="м. Запоріжжя"
        hasNotification={false}
        onNotificationClick={() => showToast('У вас є 1 нове сповіщення')}
      />

      {isLoggedIn ? (
        <VisitSection
          visit={visit}
          onBookClick={() => showToast('Відкрито форму запису на візит')}
          onReschedule={() => showToast('Запит на перенесення візиту прийнято')}
          onCancel={() => showToast('Запит на скасування візиту прийнято')}
        />
      ) : (
        <GuestBanner
          onQuickBookClick={() => showToast('Відкрито форму швидкого запису')}
        />
      )}

      <PromoBannersGrid
        onBanner1Click={() => showToast('Акція "-25% на перший грумінг"')}
        onBanner2Click={() => showToast('Акція "Безкоштовне підстригання кігтів"')}
        onBanner3Click={() => showToast('Поповер з QR-кодом для завантаження додатка')}
      />

      <ExpertAdviceGrid
        articles={EXPERT_ARTICLES}
        onArticleClick={(articleId) => showToast(`Відкрито статтю: ${articleId}`)}
      />
    </div>
  );
}

