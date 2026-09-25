import { useState, useEffect, useRef, type FC, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import type { PersonalDataForm } from './profile_types';
import { supabase } from '@/lib/supabase';

export interface PersonalDataPageProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onAddressesClick?: () => void;
  onPaymentMethodsClick?: () => void;
  onLogout?: () => void;
  onSave?: (data: PersonalDataForm) => void;
  onToast?: (message: string) => void;
  initialData?: Partial<PersonalDataForm>;
}

const defaultFormData: PersonalDataForm = {
  fullName: 'Катерина Ковальчук',
  phone: '+380 (97) 123 45 67',
  isPhoneVerified: true,
  email: 'kateryna.pet@gmail.com',
  birthDate: '14 Травня 1995',
  avatarUrl: null,
  isVip: true,
};

export const PersonalDataPage: FC<PersonalDataPageProps> = ({
  onHomeClick,
  onProfileClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onLogout,
  onSave,
  onToast,
  initialData,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<PersonalDataForm>({
    ...defaultFormData,
    ...initialData,
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (message: string) => {
    if (onToast && message) {
      onToast(message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
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
      const resolvedName = profile?.full_name || userMeta?.full_name || defaultFormData.fullName;
      const resolvedEmail = profile?.email || sessionData?.session?.user?.email || defaultFormData.email;
      const resolvedPhone = profile?.phone || userMeta?.phone || defaultFormData.phone;
      const rawAvatar =
        profile?.avatar_url ||
        userMeta?.avatar_url ||
        userMeta?.picture ||
        null;

      const resolvedAvatar =
        rawAvatar &&
        typeof rawAvatar === 'string' &&
        rawAvatar.trim() &&
        rawAvatar.trim() !== 'null' &&
        rawAvatar.trim() !== 'undefined'
          ? rawAvatar.trim()
          : null;

      setFormData((prev) => ({
        ...prev,
        fullName: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone,
        avatarUrl: resolvedAvatar || prev.avatarUrl,
        birthDate: userMeta?.birth_date || prev.birthDate,
      }));
    }

    if (!initialData) {
      loadUserData();
    }

    return () => {
      isMounted = false;
    };
  }, [initialData]);

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

  const handleAddressesClick = () => {
    if (onAddressesClick) {
      onAddressesClick();
    } else {
      showToast('Мої адреси');
    }
  };

  const handlePaymentMethodsClick = () => {
    if (onPaymentMethodsClick) {
      onPaymentMethodsClick();
    } else {
      showToast('Способи оплати');
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

  const handleAvatarTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatarUrl: previewUrl }));
      showToast('Аватар оновлено');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (currentUserId) {
        await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUserId);

        await supabase.auth.updateUser({
          data: {
            full_name: formData.fullName,
            birth_date: formData.birthDate,
          },
        });
      }

      if (onSave) {
        onSave(formData);
      }

      setIsEditingName(false);
      setIsEditingEmail(false);
      setIsEditingBirthDate(false);
      showToast('Зміни успішно збережено');
    } finally {
      setIsSaving(false);
    }
  };

  const firstName = formData.fullName.split(' ')[0] || formData.fullName;

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
          userAvatarUrl={formData.avatarUrl || '/assets/images/default-avatar.svg'}
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
            <span className="text-terracotta font-medium">Особисті дані</span>
          </nav>

          <header className="flex flex-col gap-2">
            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              Особисті дані
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
              <section
                aria-label="Картка користувача"
                className="bg-[#232a35] rounded-3xl p-6 text-white text-center flex flex-col items-center gap-4 shadow-sm"
              >
                <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#fbcfe8] to-[#f472b6] flex items-center justify-center">
                  <img
                    src={formData.avatarUrl || '/assets/images/default-avatar.svg'}
                    alt={formData.fullName}
                    className="w-full h-full object-cover rounded-full bg-slate-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/default-avatar.svg';
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAvatarTrigger}
                    aria-label="Змінити аватар"
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-terracotta hover:bg-terracotta-hover text-white flex items-center justify-center cursor-pointer shadow-md transition-colors outline-none"
                  >
                    <Icon name="fi-rr-edit" size={16} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <h2 className="font-accented font-bold text-2xl text-white">
                    {firstName}
                  </h2>

                  {formData.isVip && (
                    <span
                      data-testid="vip-badge"
                      className="bg-terracotta text-white text-xs font-accented font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs"
                    >
                      <span>★</span>
                      <span>V.I.P Користувач</span>
                    </span>
                  )}
                </div>
              </section>

              <nav
                aria-label="Меню профілю"
                className="bg-white rounded-3xl p-4 shadow-sm border border-black/5 flex flex-col gap-1 w-full"
              >
                <button
                  type="button"
                  className="w-full bg-soft-blue/10 text-terracotta font-accented font-semibold rounded-2xl p-3 flex items-center gap-3 cursor-pointer outline-none text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-soft-blue/20 text-terracotta flex items-center justify-center shrink-0">
                    <Icon name="fi-rr-user" size={18} />
                  </div>
                  <span className="text-sm">Особисті дані</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddressesClick}
                  className="w-full text-content-dark hover:bg-interactive-lightgray font-accented font-medium rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-colors outline-none text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-interactive-lightgray text-content-dark flex items-center justify-center shrink-0">
                    <Icon name="fi-rr-marker" size={18} />
                  </div>
                  <span className="text-sm">Мої адреси</span>
                </button>

                <button
                  type="button"
                  onClick={handlePaymentMethodsClick}
                  className="w-full text-content-dark hover:bg-interactive-lightgray font-accented font-medium rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-colors outline-none text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-interactive-lightgray text-content-dark flex items-center justify-center shrink-0">
                    <Icon name="fi-rr-credit-card" size={18} />
                  </div>
                  <span className="text-sm">Способи оплати</span>
                </button>

                <div className="border-t border-black/5 my-2" />

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Вийти з акаунту"
                  className="w-full text-status-danger hover:bg-red-50 font-accented font-medium rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-colors outline-none text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-red-50 text-status-danger flex items-center justify-center shrink-0">
                    <Icon name="fi-rr-sign-out-alt" size={18} />
                  </div>
                  <span className="text-sm">Вийти з акаунту</span>
                </button>
              </nav>
            </aside>

            <section
              aria-label="Форма особистих даних"
              className="lg:col-span-8 flex flex-col gap-6 w-full"
            >
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col divide-y divide-black/5">
                <div className="pb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-full bg-interactive-lightgray text-content-dark/80 flex items-center justify-center shrink-0">
                      <Icon name="fi-rr-user" size={18} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs text-text-muted font-primary">
                        Ім'я та Прізвище
                      </span>
                      {isEditingName ? (
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                          }
                          aria-label="Ім'я та Прізвище"
                          className="font-accented font-semibold text-base text-content-dark bg-[#f3f4f6] px-3 py-1 rounded-lg mt-1 outline-none border border-soft-blue"
                          autoFocus
                        />
                      ) : (
                        <span className="font-accented font-semibold text-base text-content-dark truncate">
                          {formData.fullName}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingName((prev) => !prev)}
                    aria-label="Редагувати Ім'я та Прізвище"
                    className="text-text-muted hover:text-terracotta transition-colors p-2 cursor-pointer outline-none shrink-0"
                  >
                    <Icon name="fi-rr-edit" size={18} />
                  </button>
                </div>

                <div className="py-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-interactive-lightgray text-content-dark/80 flex items-center justify-center shrink-0">
                      <Icon name="fi-rr-smartphone" size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-text-muted font-primary">
                        Номер телефону
                      </span>
                      <span className="font-accented font-semibold text-base text-content-dark">
                        {formData.phone}
                      </span>
                    </div>
                  </div>

                  {formData.isPhoneVerified && (
                    <div
                      data-testid="phone-verified-badge"
                      className="flex items-center gap-1.5 text-[#34C759] font-primary font-medium text-xs sm:text-sm shrink-0"
                    >
                      <Icon name="fi-rr-check" size={14} />
                      <span>Підтверджено</span>
                    </div>
                  )}
                </div>

                <div className="py-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-full bg-interactive-lightgray text-content-dark/80 flex items-center justify-center shrink-0">
                      <Icon name="fi-rr-envelope" size={18} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs text-text-muted font-primary">
                        Електронна пошта
                      </span>
                      {isEditingEmail ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, email: e.target.value }))
                          }
                          aria-label="Електронна пошта"
                          className="font-accented font-semibold text-base text-content-dark bg-[#f3f4f6] px-3 py-1 rounded-lg mt-1 outline-none border border-soft-blue"
                          autoFocus
                        />
                      ) : (
                        <span className="font-accented font-semibold text-base text-content-dark truncate">
                          {formData.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingEmail((prev) => !prev)}
                    aria-label="Редагувати Електронну пошту"
                    className="text-text-muted hover:text-terracotta transition-colors p-2 cursor-pointer outline-none shrink-0"
                  >
                    <Icon name="fi-rr-edit" size={18} />
                  </button>
                </div>

                <div className="pt-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-full bg-interactive-lightgray text-content-dark/80 flex items-center justify-center shrink-0">
                      <Icon name="fi-rr-calendar" size={18} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs text-text-muted font-primary">
                        Дата народження
                      </span>
                      {isEditingBirthDate ? (
                        <input
                          type="text"
                          value={formData.birthDate}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, birthDate: e.target.value }))
                          }
                          aria-label="Дата народження"
                          className="font-accented font-semibold text-base text-content-dark bg-[#f3f4f6] px-3 py-1 rounded-lg mt-1 outline-none border border-soft-blue"
                          autoFocus
                        />
                      ) : (
                        <span className="font-accented font-semibold text-base text-content-dark">
                          {formData.birthDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingBirthDate((prev) => !prev)}
                    aria-label="Редагувати Дату народження"
                    className="text-text-muted hover:text-terracotta transition-colors p-2 cursor-pointer outline-none shrink-0"
                  >
                    <Icon name="fi-rr-edit" size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-[#f0f4f8] rounded-2xl p-4.5 flex items-center gap-3.5 border border-soft-blue/20 text-xs md:text-sm text-content-dark font-primary">
                <div className="text-soft-blue shrink-0 flex items-center justify-center">
                  <Icon name="fi-rr-shield-check" size={20} />
                </div>
                <p className="leading-relaxed">
                  Ваші контактні дані використовуються для підтвердження бронювань та сповіщень про візити. Ми гарантуємо їх безпеку.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-terracotta hover:bg-terracotta-hover text-white font-accented font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center cursor-pointer outline-none disabled:opacity-50"
              >
                {isSaving ? 'Збереження...' : 'Зберегти зміни'}
              </button>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PersonalDataPage;
