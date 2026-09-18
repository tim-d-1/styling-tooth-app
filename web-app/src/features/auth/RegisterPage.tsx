import { useState, type FC, type FormEvent, type ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { validateRegisterForm, isEmailIdentifier } from './register_utils';

export interface RegisterPageProps {
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
  defaultCity?: string;
}

export const RegisterPage: FC<RegisterPageProps> = ({
  onBack,
  onSuccess,
  onNavigateLogin,
  defaultCity = 'м. Київ',
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState(defaultCity);
  const [petPhoto, setPetPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<'UA' | 'EN'>('UA');

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'UA' ? 'EN' : 'UA'));
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPetPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const clearPhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPetPhoto(null);
    setPhotoPreview(null);
  };

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const providerKey = provider === 'Google' ? 'google' : 'apple';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: providerKey,
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      if (data?.url && typeof window !== 'undefined') {
        window.location.assign(data.url);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Помилка авторизації через соціальну мережу';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateRegisterForm({
      firstName,
      lastName,
      username,
      identifier,
      password,
      city,
      petPhoto,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    try {
      setIsLoading(true);
      const trimmedIdentifier = identifier.trim();
      const isEmail = isEmailIdentifier(trimmedIdentifier);

      if (isEmail) {
        const { error } = await supabase.auth.signUp({
          email: trimmedIdentifier,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              username: username.trim(),
              city: city.trim(),
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }
      }

      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Помилка реєстрації';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-cream flex flex-col lg:flex-row relative text-content-dark font-primary">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Повернутися назад"
        className="absolute top-6 left-6 lg:top-[3.6875rem] lg:left-[7.5rem] z-20 w-10 h-10 rounded-full bg-visit-gray lg:bg-white/20 text-content-dark lg:text-white hover:bg-visit-gray/80 lg:hover:bg-white/40 backdrop-blur-xs flex items-center justify-center transition-colors cursor-pointer border-0 p-0 outline-none"
      >
        <i className="fi fi-rr-arrow-left text-xl flex items-center justify-center leading-none" />
      </button>

      <div className="hidden lg:block lg:w-[44.375rem] lg:min-h-screen relative shrink-0 overflow-hidden select-none">
        <img
          src="/assets/images/doberman_portrait.png"
          alt="Стильний Зубець"
          className="w-full h-full object-cover object-center"
        />

        <div className="absolute inset-x-0 bottom-0 min-h-[32rem] h-auto bg-gradient-to-b from-transparent to-banner-navy flex items-end p-14" />
      </div>

      <div className="flex-1 min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-0 relative">
        <div className="w-full flex justify-end lg:absolute lg:top-[3.625rem] lg:right-[7.5rem] z-10">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Змінити мову інтерфейсу"
            className="inline-flex items-center gap-2 text-text-muted hover:text-content-dark font-sans text-base leading-none transition-colors cursor-pointer bg-transparent border-0 p-0 outline-none"
          >
            <i className="fi fi-rr-globe text-[0.9375rem] flex items-center justify-center leading-none" />
            <span>{language}</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center py-8 lg:py-12">
          <div className="w-full max-w-[24.125rem] flex flex-col gap-9">
            <h1 className="font-accented font-bold text-2xl text-center text-black">
              Реєстрація
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="register-first-name"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    ім’я
                  </label>
                  <input
                    id="register-first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="register-last-name"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Прізвище
                  </label>
                  <input
                    id="register-last-name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="register-username"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    ім’я користувача
                  </label>
                  <input
                    id="register-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="register-identifier"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Email/номер телефону
                  </label>
                  <input
                    id="register-identifier"
                    name="identifier"
                    type="text"
                    autoComplete="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1 relative">
                  <label
                    htmlFor="register-password"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Пароль
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                      className="text-text-muted hover:text-content-dark transition-colors cursor-pointer bg-transparent border-0 p-1 flex items-center justify-center outline-none"
                    >
                      <i className={`fi ${showPassword ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-lg leading-none`} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="register-city"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    місто
                  </label>
                  <input
                    id="register-city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="register-pet-photo"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Фото тваринки
                  </label>
                  <div className="relative">
                    <input
                      id="register-pet-photo"
                      name="petPhoto"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="sr-only"
                    />
                    <label
                      htmlFor="register-pet-photo"
                      className="w-full h-[6.75rem] rounded-[10px] border border-dashed border-[#B2B2B2] hover:border-terracotta transition-colors bg-white/40 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
                    >
                      {photoPreview ? (
                        <div className="flex items-center gap-3 p-2 w-full h-full justify-center">
                          <img
                            src={photoPreview}
                            alt="Фото тваринки"
                            className="w-16 h-16 rounded-lg object-cover border border-text-muted/20 shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-content-dark truncate max-w-[10rem]">
                              {petPhoto?.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                clearPhoto();
                              }}
                              className="text-[0.6875rem] text-terracotta hover:underline mt-1 bg-transparent border-0 p-0 text-left cursor-pointer"
                            >
                              Видалити фото
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <i className="fi fi-rr-camera text-2xl text-text-muted group-hover:text-terracotta transition-colors leading-none" />
                          <span className="font-primary text-xs text-text-muted group-hover:text-content-dark transition-colors">
                            Завантажити фото
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-primary animate-fade-in"
                  >
                    {errorMessage}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-8">
                <div className="flex items-center justify-center gap-9 w-full max-w-[22rem]">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    aria-label="Увійти за допомогою Google"
                    className="w-12 h-12 rounded-full border border-text-muted hover:border-content-dark hover:bg-black/5 transition-all flex items-center justify-center cursor-pointer bg-transparent p-0 shrink-0 outline-none"
                  >
                    <img
                      src="/assets/social_icons/google-original.svg"
                      alt="Google"
                      width={22}
                      height={22}
                      className="w-6 h-6 object-contain pointer-events-none"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Apple')}
                    aria-label="Увійти за допомогою Apple"
                    className="w-12 h-12 rounded-full border border-text-muted hover:border-content-dark hover:bg-black/5 transition-all flex items-center justify-center cursor-pointer bg-transparent p-0 shrink-0 outline-none"
                  >
                    <img
                      src="/assets/social_icons/apple-original.svg"
                      alt="Apple"
                      width={20}
                      height={24}
                      className="w-5 h-6 object-contain pointer-events-none"
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="w-full h-12 rounded-xl bg-terracotta hover:opacity-90 active:scale-[0.99] transition-all text-white font-accented font-semibold text-base flex items-center justify-center cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs outline-none"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Далі</span>
                  )}
                </button>
              </div>
            </form>

            {onNavigateLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-xs font-primary text-text-muted hover:text-terracotta transition-colors bg-transparent border-0 cursor-pointer outline-none"
                >
                  Вже маєте акаунт? <span className="underline">Увійти</span>
                </button>
              </div>
            )}

            <div className="flex flex-col items-center gap-5 pt-2">
              <div className="w-full border-t border-[#B2B2B2]" />
              <p className="font-primary text-xs text-center text-content-dark leading-relaxed">
                Входячи в акаунт або створюючи новий, ви погоджуєтеся з нашими Правилами й умовами та Політикою конфіденційності
              </p>
              <p className="font-primary text-xs text-center text-content-dark leading-relaxed whitespace-pre-line">
                Усі права захищено.{'\n'}© 2026 Стильний зубець.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
