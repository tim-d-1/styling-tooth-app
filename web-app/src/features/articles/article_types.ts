export interface ArticleSection {
  title: string;
  items: string[];
}

export interface ArticleData {
  id: string;
  title: string;
  intro: string;
  sections: ArticleSection[];
  summary: string;
}

export const ARTICLES_REGISTRY: Record<string, ArticleData> = {
  'shampoo-guide': {
    id: 'shampoo-guide',
    title: 'Як обрати правильний шампунь?',
    intro:
      'Шкіра собак і котів має інший рівень pH, ніж людська, тому звичайний шампунь може викликати сухість, подразнення та погіршити стан шерсті. Використовуйте лише спеціальні засоби для тварин.',
    sections: [
      {
        title: 'На що звернути увагу?',
        items: [
          'Тип шерсті — коротка, довга або кучерява.',
          'Стан шкіри — для чутливої шкіри обирайте гіпоалергенні засоби.',
          "Вік — для цуценят і кошенят існують окремі м'які шампуні.",
        ],
      },
      {
        title: 'Поради',
        items: [
          '✔️ Добре змивайте шампунь після купання.',
          '✔️ Не використовуйте людські засоби.',
          "✔️ Якщо з'явилося подразнення — припиніть використання та зверніться до ветеринара.",
        ],
      },
    ],
    summary:
      'Правильно підібраний шампунь — запорука здорової шкіри, блискучої шерсті та комфортного життя вашого улюбленця.',
  },
};

export const DEFAULT_ARTICLE_ID = 'shampoo-guide';
