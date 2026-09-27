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
};

export const DEFAULT_PROMO_ID = 'free-nail-trimming';
