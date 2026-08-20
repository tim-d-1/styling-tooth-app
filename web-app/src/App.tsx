import { useState } from 'react';
import Header from './components/Header';
import LocationBar from './components/LocationBar';
import UpcomingVisitCard from './components/UpcomingVisitCard';
import PromoBannersGrid from './components/PromoBannersGrid';
import ExpertAdviceGrid, { type ArticleItem } from './components/ExpertAdviceGrid';

const EXPERT_ARTICLES: ArticleItem[] = [
  {
    id: 'shampoo-guide',
    title: 'ЯК ОБРАТИ ПРАВИЛЬНИЙ ШАМПУНЬ?',
    bgImage: '/assets/images/golden_retriever_bath.png',
    bgColor: '#E8EFFA',
    type: 'shampoo',
  },
  {
    id: 'paws-tips',
    title: '5 ПОРАД',
    subtitle: 'для здорових лап',
    bgImage: '/assets/images/dog_paw_close_up.png',
    bgColor: '#96B3E2',
    type: 'paw',
  },
];

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
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-content-dark text-white px-5 py-3.5 rounded-xl shadow-2xl text-sm font-primary animate-fade-in">
          {toastMessage}
        </div>
      )}

      <Header
        activeNav={activeNav}
        onNavClick={(nav) => {
          setActiveNav(nav);
          showToast(`Перехід на розділ: ${nav}`);
        }}
        onDeviceClick={() => showToast('Відкрито поповер завантаження додатка (QR-код)')}
        onProfileClick={() => showToast('Відкрито особистий кабінет клієнта')}
      />

      <LocationBar
        location="м. Запоріжжя"
        hasNotification={true}
        onNotificationClick={() => showToast('У вас є 1 нове сповіщення')}
      />

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
