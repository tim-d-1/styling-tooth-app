import type { FC } from 'react';
import SocialIcon from './ui/SocialIcon';
import { CONTACT_ITEMS } from './landing_types';

export const LandingContacts: FC = () => {
  return (
    <section id="contacts" className="w-full py-20 bg-landing-page">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="font-accented font-bold text-3xl md:text-[40px] leading-tight text-content-dark">
            Контакти
          </h2>

          <div className="flex items-center gap-10">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <SocialIcon
                platform="Instagram"
                colorScheme="Negative"
                size={32}
                className="w-8 h-8 invert cursor-pointer hover:opacity-80 transition-opacity"
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
                size={32}
                className="w-8 h-8 invert cursor-pointer hover:opacity-80 transition-opacity"
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
                size={32}
                className="w-8 h-8 invert cursor-pointer hover:opacity-80 transition-opacity"
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
                size={32}
                className="w-8 h-8 invert cursor-pointer hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CONTACT_ITEMS.map((item) => (
            <div
              key={item.id}
              className="bg-surface-cream rounded-[10px] shadow-card px-7 py-5 flex flex-col justify-center gap-2 min-h-[87px]"
            >
              <span className="font-primary text-base text-content-dark">
                {item.label}
              </span>
              <span className="font-accented font-semibold text-lg text-content-dark">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingContacts;
