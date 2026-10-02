import { useState, type FC, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { isStaffRole, type StaffRole } from './auth_types';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';

export interface StaffLoginPageProps {
  onSuccess?: () => void;
  clientAppUrl?: string;
}

export const StaffLoginPage: FC<StaffLoginPageProps> = ({
  onSuccess,
  clientAppUrl = import.meta.env.VITE_CLIENT_APP_URL || 'http://localhost:3000',
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clientRoleDetected, setClientRoleDetected] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setClientRoleDetected(false);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMessage('Введіть email або номер телефону');
      return;
    }
    if (!password) {
      setErrorMessage('Введіть пароль');
      return;
    }

    try {
      setIsLoading(true);

      const isEmail = trimmed.includes('@');
      let loginData;
      let loginError;

      if (isEmail) {
        const res = await supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        });
        loginData = res.data;
        loginError = res.error;
      } else {
        const cleanPhone = trimmed.replace(/[\s()-]/g, '');
        let res = await supabase.auth.signInWithPassword({
          phone: cleanPhone,
          password,
        });
        if (
          res.error &&
          (res.error.message.toLowerCase().includes('disabled') ||
            res.error.message.toLowerCase().includes('provider') ||
            res.error.message.toLowerCase().includes('unsupported') ||
            res.error.message.toLowerCase().includes('not allowed'))
        ) {
          const digits = cleanPhone.replace(/\D/g, '');
          res = await supabase.auth.signInWithPassword({
            email: `${digits}@phone.stylingtooth.app`,
            password,
          });
        }
        loginData = res.data;
        loginError = res.error;
      }

      if (loginError || !loginData?.user) {
        setErrorMessage('Невірний логін або пароль');
        return;
      }

      // Check role
      let resolvedRole: string | null =
        (loginData.user.user_metadata?.role as string) ||
        (loginData.user.app_metadata?.role as string) ||
        null;

      if (!resolvedRole) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', loginData.user.id)
          .maybeSingle();
        resolvedRole = profile?.role || null;
      }

      if (!isStaffRole(resolvedRole)) {
        // Log out client user from staff portal
        await supabase.auth.signOut();
        setClientRoleDetected(true);
        setErrorMessage(
          'Цей портал призначений виключно для персоналу (адміністраторів, рецепції та майстрів).'
        );
        return;
      }

      try {
        localStorage.setItem('staff_role', resolvedRole as StaffRole);
      } catch {}

      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка авторизації';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-cream flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-gray-100">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo variant="full-transparent" height={48} className="mb-4" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soft-blue/20 text-content-dark text-xs font-semibold mb-2">
            <Icon name="fi-rr-shield-check" size={14} className="text-terracotta" />
            <span>Панель персоналу</span>
          </div>
          <h1 className="font-accented text-2xl font-bold text-content-dark mb-1">
            Вхід для співробітників
          </h1>
          <p className="font-primary text-xs sm:text-sm text-gray-500">
            Адміністратори, Рецепція, Майстри
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex flex-col gap-2"
          >
            <div className="flex items-start gap-2">
              <Icon name="fi-rr-exclamation" size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {clientRoleDetected && (
              <a
                href={clientAppUrl}
                className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-terracotta text-white font-semibold text-xs text-center hover:bg-terracotta-hover transition-colors"
              >
                <span>Перейти до клієнтського сайту</span>
                <Icon name="fi-rr-arrow-right" size={12} />
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="staff-identifier"
              className="text-xs font-primary font-semibold text-content-dark"
            >
              Email або номер телефону
            </label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-300 focus-within:border-terracotta transition-colors bg-white">
              <Icon name="fi-rr-user" size={18} className="text-gray-400" />
              <input
                id="staff-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="reception@stylingtooth.ua"
                autoComplete="username"
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 outline-none text-sm text-content-dark font-primary placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="staff-password"
              className="text-xs font-primary font-semibold text-content-dark"
            >
              Пароль
            </label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-300 focus-within:border-terracotta transition-colors bg-white">
              <Icon name="fi-rr-lock" size={18} className="text-gray-400" />
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 outline-none text-sm text-content-dark font-primary placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                className="bg-transparent border-0 text-gray-400 hover:text-content-dark cursor-pointer p-0 flex items-center justify-center outline-none"
              >
                <Icon name={showPassword ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} size={18} />
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            fullWidth
            className="mt-2"
          >
            Увійти до панелі
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-2">Ви клієнт грумінг-салону?</p>
          <a
            href={clientAppUrl}
            className="text-xs font-semibold text-terracotta hover:underline inline-flex items-center gap-1"
          >
            <span>Повернутися до сайту запису</span>
            <Icon name="fi-rr-arrow-right" size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;
