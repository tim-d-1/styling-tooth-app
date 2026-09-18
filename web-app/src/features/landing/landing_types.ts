import type { AppIconName } from '@/components/icons';

export interface ServiceItem {
  id: string;
  icon: AppIconName;
  title: string;
  description: string;
}

export const LANDING_SERVICES: ServiceItem[] = [
  {
    id: 'complex-grooming',
    icon: 'fi-rr-confetti',
    title: 'Комплексний грумінг',
    description: 'Повний догляд, щоб ваш хвостик виглядав бездоганно',
  },
  {
    id: 'hygiene-care',
    icon: 'fi-rr-raindrops',
    title: 'Гігієнічний догляд',
    description: 'Дбайливий догляд за важливими зонами для комфорту та здоров’я',
  },
  {
    id: 'express-grooming',
    icon: 'fi-rr-clock',
    title: 'Експрес-грумінг',
    description: 'Швидке оновлення вигляду між процедурами',
  },
  {
    id: 'brushing',
    icon: 'fi-rr-barber-shop',
    title: 'Вичісування',
    description: 'Прибираємо зайву шерсть, підтримуючи доглянутий вигляд',
  },
  {
    id: 'spa-complex',
    icon: 'fi-rr-magic-wand',
    title: 'SPA-комплекс',
    description: 'Глибокий догляд, чистота та краса шерсті',
  },
  {
    id: 'breed-haircut',
    icon: 'fi-rr-paw',
    title: 'Породна стрижка',
    description: 'Стрижка з урахуванням особливостей і стандартів породи',
  },
  {
    id: 'ozone-therapy',
    icon: 'fi-rr-snowflake',
    title: 'Озонотерапія',
    description: 'Сучасний додатковий догляд за шкірою та шерстю улюбленця',
  },
  {
    id: 'claw-trimming',
    icon: 'fi-rr-scissors',
    title: 'Підстригання кігтів',
    description: 'Акуратна процедура для комфорту вашого хвостика',
  },
];

export interface ContactInfoItem {
  id: string;
  label: string;
  value: string;
}

export const CONTACT_ITEMS: ContactInfoItem[] = [
  {
    id: 'phone',
    label: 'Телефон',
    value: '+38 (044) 123-45-67',
  },
  {
    id: 'address',
    label: 'Адреса',
    value: 'Київ, Хрещатик, 15',
  },
  {
    id: 'hours',
    label: 'Графік роботи',
    value: 'Щодня: 09:00 - 21:00',
  },
];
