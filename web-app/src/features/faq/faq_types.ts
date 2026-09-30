export type FaqCategory = 'all' | 'grooming' | 'spa' | 'transfer' | 'payment';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export interface FaqCategoryItem {
  id: FaqCategory;
  label: string;
}
