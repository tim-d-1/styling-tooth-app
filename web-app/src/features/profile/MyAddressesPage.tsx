import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import ProfileAccountSidebar from './ProfileAccountSidebar';
import type { UserAddress } from './profile_types';
import { supabase } from '@/lib/supabase';

export interface MyAddressesPageProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onPersonalDataClick?: () => void;
  onPaymentMethodsClick?: () => void;
  onLogout?: () => void;
  onSelectAddress?: (address: UserAddress) => void;
  onToast?: (message: string) => void;
  initialAddress?: Partial<UserAddress>;
  initialUserData?: {
    fullName: string;
    avatarUrl?: string | null;
    isVip?: boolean;
  };
}

const defaultAddress: UserAddress = {
  street: 'вул. Хрещатик, 15',
  apartment: '42',
  entranceFloor: "1 під'їзд, 3 пов.",
  label: 'Дім',
  isDefaultTransfer: true,
};

export const MyAddressesPage: FC<MyAddressesPageProps> = ({
  onHomeClick,
  onProfileClick,
  onPersonalDataClick,
  onPaymentMethodsClick,
  onLogout,
  onSelectAddress,
  onToast,
  initialAddress,
  initialUserData,
}) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    fullName: initialUserData?.fullName || 'Катерина Ковальчук',
    avatarUrl: initialUserData?.avatarUrl ?? null,
    isVip: initialUserData?.isVip ?? true,
  });

  const [address, setAddress] = useState<UserAddress>({
    ...defaultAddress,
    ...initialAddress,
  });

  const [labels, setLabels] = useState<string[]>(['Дім', 'Офіс']);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (message: string) => {
    if (onToast && message) {
      onToast(message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId || !isMounted) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      if (!isMounted) return;

      const userMeta = sessionData?.session?.user?.user_metadata;
      const resolvedName = profile?.full_name || userMeta?.full_name || 'Катерина Ковальчук';
      const rawAvatar = profile?.avatar_url || userMeta?.avatar_url || userMeta?.picture || null;
      const resolvedAvatar =
        rawAvatar &&
        typeof rawAvatar === 'string' &&
        rawAvatar.trim() &&
        rawAvatar.trim() !== 'null' &&
        rawAvatar.trim() !== 'undefined'
          ? rawAvatar.trim()
          : null;

      setUserData({
        fullName: resolvedName,
        avatarUrl: resolvedAvatar,
        isVip: true,
      });

      const savedAddress = userMeta?.address || userMeta?.addresses?.[0];
      if (savedAddress && !initialAddress) {
        setAddress((prev) => ({
          ...prev,
          ...savedAddress,
        }));
      }
    }

    if (!initialUserData) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [initialUserData, initialAddress]);

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      navigate('/main');
    }
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  const handlePersonalDataClick = () => {
    if (onPersonalDataClick) {
      onPersonalDataClick();
    } else {
      navigate('/profile/personal-data');
    }
  };

  const handlePaymentMethodsClick = () => {
    if (onPaymentMethodsClick) {
      onPaymentMethodsClick();
    } else {
      navigate('/profile/payment-methods');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
    showToast('Ви вийшли з акаунту');
  };

  const handleAvatarChange = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setUserData((prev) => ({ ...prev, avatarUrl: previewUrl }));
    showToast('Аватар оновлено');
  };

  const handleAddLabel = () => {
    const trimmed = newLabelInput.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels((prev) => [...prev, trimmed]);
      setAddress((prev) => ({ ...prev, label: trimmed }));
    }
    setNewLabelInput('');
    setIsAddingLabel(false);
  };

  const handleSelectAddress = async () => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (currentUserId) {
        await supabase.auth.updateUser({
          data: {
            address,
            addresses: [address],
          },
        });
      }

      if (onSelectAddress) {
        onSelectAddress(address);
      }

      showToast('Адресу успішно збережено');
    } finally {
      setIsSaving(false);
    }
  };

  const firstName = userData.fullName.split(' ')[0] || userData.fullName;

  return (
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary flex flex-col justify-between">
      <div className="flex-1 pb-16">
        <Header
          isLoggedIn={true}
          activeNav="profile"
          onNavClick={(nav) => {
            if (nav === 'home') {
              handleHomeClick();
            } else if (nav === 'services' || nav === 'book') {
              navigate('/main');
            }
          }}
          onProfileClick={handleProfileClick}
          onDeviceClick={() => showToast('Завантажити додаток')}
          onNotificationClick={() => showToast('Немає нових сповіщень')}
          userAvatarUrl={userData.avatarUrl || '/assets/images/default-avatar.svg'}
          userName={firstName}
        />

        <main className="max-w-[75rem] mx-auto px-6 pt-10 flex flex-col gap-8">
          <nav
            aria-label="Навігація по сайту"
            className="flex items-center gap-2 text-xs md:text-sm font-primary text-text-muted flex-wrap"
          >
            <button
              type="button"
              onClick={handleHomeClick}
              className="hover:text-content-dark transition-colors cursor-pointer"
            >
              Головна
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <button
              type="button"
              onClick={handleProfileClick}
              className="hover:text-content-dark transition-colors cursor-pointer"
            >
              Особистий кабінет
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <span className="text-terracotta font-medium">Мої Адреси</span>
          </nav>

          <header className="flex flex-col gap-2">
            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              Мої Адреси
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <ProfileAccountSidebar
              activeTab="addresses"
              userData={userData}
              onAvatarChange={handleAvatarChange}
              onPersonalDataClick={handlePersonalDataClick}
              onAddressesClick={() => {}}
              onPaymentMethodsClick={handlePaymentMethodsClick}
              onLogout={handleLogout}
            />

            <section
              aria-label="Секція адрес"
              className="lg:col-span-8 flex flex-col gap-6 w-full"
            >
              <div
                data-testid="pet-taxi-map-card"
                className="w-full rounded-3xl overflow-hidden shadow-sm border border-black/5 bg-[#f4f7fb]"
              >
                <img
                  src="/assets/images/pet-taxi-route-map.webp"
                  alt="Маршрут Pet-таксі"
                  className="w-full h-auto object-cover rounded-3xl block"
                />
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h2 className="font-accented font-bold text-2xl text-content-dark">
                    Деталі адреси
                  </h2>
                  <p className="text-text-muted text-sm font-primary">
                    Для виклику Pet-таксі чи доставки косметики
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="address-street" className="text-xs text-text-muted font-primary">
                    Вулиця та будинок
                  </label>
                  <input
                    id="address-street"
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                    placeholder="вул. Хрещатик, 15"
                    className="w-full border border-black/15 rounded-2xl px-4 py-3.5 text-base text-content-dark font-accented font-medium outline-none focus:border-terracotta transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="address-apartment"
                      className="text-xs text-text-muted font-primary"
                    >
                      Кв. / Офіс
                    </label>
                    <input
                      id="address-apartment"
                      type="text"
                      value={address.apartment}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, apartment: e.target.value }))
                      }
                      placeholder="42"
                      className="w-full border border-black/15 rounded-2xl px-4 py-3.5 text-base text-content-dark font-accented font-medium outline-none focus:border-terracotta transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="address-entrance"
                      className="text-xs text-text-muted font-primary"
                    >
                      Під'їзд / Поверх
                    </label>
                    <input
                      id="address-entrance"
                      type="text"
                      value={address.entranceFloor}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, entranceFloor: e.target.value }))
                      }
                      placeholder="1 під'їзд, 3 пов."
                      className="w-full border border-black/15 rounded-2xl px-4 py-3.5 text-base text-content-dark font-accented font-medium outline-none focus:border-terracotta transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-sm font-accented font-medium text-content-dark">
                    Назва адреси:
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {labels.map((item) => {
                      const isSelected = address.label === item;
                      const icon = item === 'Дім' ? '🏡' : item === 'Офіс' ? '💼' : '📍';
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setAddress((prev) => ({ ...prev, label: item }))}
                          className={`font-accented font-medium text-sm px-4 py-2 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs outline-none ${
                            isSelected
                              ? 'bg-[#7a9ec7] text-white'
                              : 'bg-[#f0f2f5] text-content-dark hover:bg-black/10'
                          }`}
                        >
                          <span>{icon}</span>
                          <span>{item}</span>
                        </button>
                      );
                    })}

                    {isAddingLabel ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newLabelInput}
                          onChange={(e) => setNewLabelInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddLabel();
                            if (e.key === 'Escape') setIsAddingLabel(false);
                          }}
                          placeholder="Назва..."
                          aria-label="Нова назва адреси"
                          autoFocus
                          className="border border-soft-blue rounded-full px-3 py-1.5 text-sm outline-none w-28 bg-[#f3f4f6]"
                        />
                        <button
                          type="button"
                          onClick={handleAddLabel}
                          aria-label="Підтвердити додавання мітки"
                          className="w-7 h-7 rounded-full bg-terracotta text-white flex items-center justify-center cursor-pointer text-xs"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingLabel(true)}
                        aria-label="Додати назву адреси"
                        className="w-9 h-9 rounded-full border border-black/30 flex items-center justify-center text-content-dark hover:border-black transition-colors cursor-pointer text-base font-medium outline-none"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={address.isDefaultTransfer}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, isDefaultTransfer: e.target.checked }))
                    }
                    className="w-5 h-5 rounded border-2 border-content-dark/60 text-terracotta accent-terracotta cursor-pointer"
                  />
                  <span className="text-sm text-content-dark font-primary">
                    Зробити основною адресою для трансферу
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleSelectAddress}
                  disabled={isSaving}
                  className="w-full py-4 bg-terracotta hover:bg-terracotta-hover text-white font-accented font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center cursor-pointer outline-none disabled:opacity-50 mt-2"
                >
                  {isSaving ? 'Збереження...' : 'Обрати адресу'}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MyAddressesPage;
