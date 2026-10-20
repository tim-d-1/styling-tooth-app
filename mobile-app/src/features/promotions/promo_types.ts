export interface PromoData {
  id: string;
  highlightPrefix: string;
  highlightTitle: string;
  description: string;
  sectionTitle: string;
  items: string[];
  buttonText: string;
}

export const PROMOS_REGISTRY: Record<string, PromoData> = {
  'first-grooming': {
    id: 'first-grooming',
    highlightPrefix: '-25% ',
    highlightTitle: 'на перший грумінг',
    description:
      'Познайомтеся з нашими майстрами та отримайте знижку 25% на перше відвідування салону для вашого улюбленця.',
    sectionTitle: 'Умови акції',
    items: [
      'Діє для нових клієнтів салону.',
      'Розповсюджується на комплексний грумінг.',
      "Попередній запис у додатку обов'язковий.",
      'Професійний догляд та індивідуальний підхід до кожної тварини.',
    ],
    buttonText: 'Швидкий запис',
  },
  'free-nail-trimming': {
    id: 'free-nail-trimming',
    highlightPrefix: 'Безкоштовне ',
    highlightTitle: 'підстригання кігтів при комплексному грумінгу',
    description:
      'Подаруйте своєму улюбленцю ще більше турботи. Під час запису на комплексний грумінг послуга підстригання кігтів надається безкоштовно.',
    sectionTitle: 'Що входить до акції',
    items: [
      'Безкоштовне підстригання кігтів.',
      'Послуга виконується під час комплексного грумінгу.',
      'Для собак і котів усіх порід.',
      'Професійний та безпечний догляд.',
    ],
    buttonText: 'Швидкий запис',
  },
  'weekday-grooming': {
    id: 'weekday-grooming',
    highlightPrefix: '-20% ',
    highlightTitle: 'на комплексний грумінг у будні',
    description:
      "Особлива пропозиція для комфортного догляду з понеділка по п'ятницю. Доглянутий улюбленець без вихідного ажіотажу.",
    sectionTitle: 'Умови акції',
    items: [
      "Знижка діє з понеділка по п'ятницю.",
      'Поширюється на комплексний догляд та гігієну.',
      'Дійсна при онлайн-записі через додаток.',
      'Забезпечує спокійну атмосферу для вашого улюбленця.',
    ],
    buttonText: 'Швидкий запис',
  },
};

export const DEFAULT_PROMO_ID = 'free-nail-trimming';
