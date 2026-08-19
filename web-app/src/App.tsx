import { useState } from 'react';
import Header from './components/Header';
import LocationBar from './components/LocationBar';
import UpcomingVisitCard from './components/UpcomingVisitCard';
import PromoBannersGrid from './components/PromoBannersGrid';
import ExpertAdviceGrid from './components/ExpertAdviceGrid';

export default function App() {
  const [activeNav, setActiveNav] = useState('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface-main)',
        color: 'var(--color-content-primary)',
        fontFamily: 'var(--font-primary)',
        paddingBottom: '3rem',
      }}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: 'var(--color-content-primary)',
            color: '#FFFFFF',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-modal)',
            fontSize: '0.9375rem',
            fontFamily: 'var(--font-primary)',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <Header
        activeNav={activeNav}
        onNavClick={(nav) => {
          setActiveNav(nav);
          showToast(`Перехід на розділ: ${nav}`);
        }}
        onDeviceClick={() => showToast('Відкрито поповер завантаження додатка (QR-код)')}
        onProfileClick={() => showToast('Відкрито особистий кабінет клієнта')}
      />

      {/* Location & Notification Bar */}
      <LocationBar
        location="м. Запоріжжя"
        hasNotification={true}
        onNotificationClick={() => showToast('У вас є 1 нове сповіщення')}
      />

      {/* Section 1: Scheduled Visit Card */}
      <UpcomingVisitCard
        dayOfWeek="СЕР"
        dayNumber="10"
        timeSlot="16:00"
        masterName="Марія Шевченко"
        procedureName="Комплексний грумінг"
        basePrice={1300}
        transferPrice={100}
        initialTransferEnabled={false}
        onReschedule={() => showToast('Запит на перенесення візиту прийнято')}
        onCancel={() => showToast('Запит на скасування візиту прийнято')}
      />

      {/* Section 2: Promo Banners Grid */}
      <PromoBannersGrid
        onBanner1Click={() => showToast('Акція "-25% на перший грумінг"')}
        onBanner2Click={() => showToast('Акція "Безкоштовне підстригання кігтів"')}
        onBanner3Click={() => showToast('Поповер з QR-кодом для завантаження додатка')}
      />

      {/* Section 3: Expert Advice Grid */}
      <ExpertAdviceGrid
        onArticleClick={(articleId) => showToast(`Відкрито статтю: ${articleId}`)}
      />
    </div>
  );
}
