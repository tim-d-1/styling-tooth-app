import type { FC } from 'react';
import SocialIcon from '@/components/ui/SocialIcon';
import AppIcon from '@/components/icons';

export const LandingFooter: FC = () => {
  return (
    <footer className="w-full bg-content-dark text-white px-6 md:px-28 py-14">
      <div className="max-w-[75rem] mx-auto flex flex-col gap-12">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-8">
          <div className="shrink-0">
            <img
              src="/assets/images/landing-footer-logo.png"
              alt="Стильний зубець"
              className="w-16 h-16 object-contain"
            />
          </div>

          <div className="flex flex-col gap-3 min-w-36 sm:min-w-40">
            <h4 className="font-primary font-medium text-base text-white">
              Адреса
            </h4>
            <span className="font-primary text-sm text-white/90">
              Київ, Хрещатик, 15
            </span>
            <span className="font-primary text-sm text-white/90">
              +38 (044) 123-45-67
            </span>
            <span className="font-primary text-sm text-white/90">
              Щодня: 09:00 - 21:00
            </span>
          </div>

          <div className="flex flex-col gap-3 min-w-20">
            <h4 className="font-primary font-medium text-base text-white">
              Навігація
            </h4>
            <a
              href="#services"
              className="font-primary text-sm text-white/90 hover:text-terracotta transition-colors"
            >
              Послуги
            </a>
            <a
              href="#about"
              className="font-primary text-sm text-white/90 hover:text-terracotta transition-colors"
            >
              Про нас
            </a>
            <a
              href="#contacts"
              className="font-primary text-sm text-white/90 hover:text-terracotta transition-colors"
            >
              Контакти
            </a>
          </div>

          <div className="flex flex-col gap-3 min-w-48">
            <h4 className="font-primary font-medium text-base text-white">
              Ми у соцмережах
            </h4>
            <div className="flex items-center gap-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <SocialIcon
                  platform="Instagram"
                  colorScheme="Negative"
                  size={24}
                  className="w-6 h-6 hover:opacity-80 transition-opacity"
                />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
              >
                <SocialIcon
                  platform="Telegram"
                  colorScheme="Negative"
                  size={24}
                  className="w-6 h-6 hover:opacity-80 transition-opacity"
                />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <SocialIcon
                  platform="Facebook"
                  colorScheme="Negative"
                  size={24}
                  className="w-6 h-6 hover:opacity-80 transition-opacity"
                />
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
              >
                <SocialIcon
                  platform="WhatsApp"
                  colorScheme="Negative"
                  size={24}
                  className="w-6 h-6 hover:opacity-80 transition-opacity"
                />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-48">
            <h4 className="font-primary font-medium text-base text-white">
              Юридична інформація
            </h4>
            <a
              href="#privacy"
              className="font-primary text-sm text-white/90 hover:text-terracotta transition-colors"
            >
              Політика конфіденційності
            </a>
            <a
              href="#terms"
              className="font-primary text-sm text-white/90 hover:text-terracotta transition-colors"
            >
              Умови використання
            </a>
            <a
              href="#offer"
              className="font-primary text-sm text-white/90 hover:text-terracotta transition-colors"
            >
              Договір оферти
            </a>
          </div>
        </div>

        <div className="border-t border-white/20 pt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-primary text-xs text-white/80">
            © 2026 Стильний зубець. Усі права захищено.
          </p>
          <div className="inline-flex items-center gap-2">
            <span className="font-primary text-xs text-white/80">
              З любов'ю до тварин
            </span>
            <AppIcon name="paws" className="w-[11px] h-[11px] text-white" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
