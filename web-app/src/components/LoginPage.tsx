import { useState, type FC, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { validateLoginForm, isEmailIdentifier } from './login_utils';

export interface LoginPageProps {
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateRegister?: () => void;
  defaultUsername?: string;
  defaultIdentifier?: string;
}

export const LoginPage: FC<LoginPageProps> = ({
  onBack,
  onSuccess,
  onNavigateRegister,
  defaultUsername = 'Marichka_bkk',
  defaultIdentifier = 'bulakhmaria@gmail.com',
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [password, setPassword] = useState('');
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

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const providerKey = provider === 'Google' ? 'google' : 'apple';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerKey,
      });
      if (error) {
        setErrorMessage(error.message);
      } else {
        onSuccess?.();
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

    const validation = validateLoginForm(username, identifier, password);
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    try {
      setIsLoading(true);
      const trimmedIdentifier = identifier.trim();
      const isEmail = isEmailIdentifier(trimmedIdentifier);

      if (isEmail) {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedIdentifier,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_grant')) {
            setErrorMessage('Невірний логін або пароль');
          } else {
            setErrorMessage(error.message);
          }
          return;
        }
      }

      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Помилка входу в систему';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-cream flex flex-col lg:flex-row relative text-content-dark font-primary">
      <div className="w-full lg:w-[710px] min-h-[21.25rem] sm:min-h-[26.25rem] h-auto lg:min-h-screen relative shrink-0 overflow-hidden select-none">
        <img
          src="/assets/images/cat_photo_1.png"
          alt="Стильний Зубець"
          className="w-full h-full object-cover object-center"
        />

        <div className="absolute inset-x-0 bottom-0 min-h-[13.75rem] sm:min-h-[17.5rem] lg:min-h-[32rem] h-auto bg-gradient-to-b from-transparent to-banner-navy flex items-end p-6 sm:p-10 lg:p-[60px]" />

        <button
          type="button"
          onClick={handleBack}
          aria-label="Повернутися назад"
          className="absolute top-6 left-6 lg:top-[59px] lg:left-[120px] z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-xs flex items-center justify-center text-white transition-colors cursor-pointer border-0 p-0 outline-none"
        >
          <i className="fi fi-rr-arrow-left text-xl flex items-center justify-center leading-none" />
        </button>
      </div>

      <div className="flex-1 min-h-[calc(100vh-21.25rem)] lg:min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-0 relative">
        <div className="w-full flex justify-end lg:absolute lg:top-[58px] lg:right-[120px] z-10">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Змінити мову інтерфейсу"
            className="inline-flex items-center gap-2 text-text-muted hover:text-content-dark font-sans text-[17px] leading-none transition-colors cursor-pointer bg-transparent border-0 p-0 outline-none"
          >
            <i className="fi fi-rr-globe text-[15px] flex items-center justify-center leading-none" />
            <span>{language}</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center py-8 lg:py-0">
          <div className="w-full max-w-[386px] flex flex-col gap-[45px]">
            <h1 className="font-accented font-bold text-2xl text-center text-black">
              Вхід
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-14">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="login-username"
                    className="font-primary font-semibold text-[11px] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    ім’я користувача
                  </label>
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Marichka_bkk"
                    className="w-full bg-transparent font-primary font-medium text-[15px] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none placeholder:text-text-muted/60"
                  />
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="login-identifier"
                    className="font-primary font-semibold text-[11px] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Email/номер телефону
                  </label>
                  <input
                    id="login-identifier"
                    name="identifier"
                    type="text"
                    autoComplete="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="bulakhmaria@gmail.com"
                    className="w-full bg-transparent font-primary font-medium text-[15px] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none placeholder:text-text-muted/60"
                  />
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1 relative">
                  <label
                    htmlFor="login-password"
                    className="font-primary font-semibold text-[11px] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Пароль
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••"
                      className="w-full bg-transparent font-primary font-medium text-[15px] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none placeholder:text-text-muted/60"
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
                <div className="flex items-center justify-center gap-[37px] w-full max-w-[353px]">
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

            {onNavigateRegister && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="text-xs font-primary text-text-muted hover:text-terracotta transition-colors bg-transparent border-0 cursor-pointer outline-none"
                >
                  Ще не маєте акаунту? <span className="underline">Зареєструватися</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
