export type BookingStage =
  | 'pet'
  | 'procedure'
  | 'master'
  | 'datetime'
  | 'remarks'
  | 'confirmation'
  | 'payment';

export interface PetOption {
  id: string;
  name: string;
  species: string;
  breed?: string;
  avatar_url?: string | null;
}

export interface ProcedureOption {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

export interface MasterReview {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  text: string;
  date: string;
}

export interface MasterProfile {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  specialties: string[];
  reviewsCount: number;
  reviews: MasterReview[];
}

export interface WeekDayOption {
  dayName: string;
  dayNumber: number;
  fullDate: string;
  isAvailable?: boolean;
}

export interface BookingState {
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed?: string;
  petAvatarUrl?: string | null;

  procedureId: string;
  procedureName: string;
  procedurePrice: number;
  procedureDurationMin: number;

  masterId: string;
  masterName: string;
  masterRole?: string;
  masterAvatarUrl?: string;

  date: string;
  dateFormatted: string;
  timeSlot: string;

  clientNote: string;
  transferEnabled: boolean;
  transferPrice: number;
  transferAddress: string;
  behaviorNotes: string;

  paymentMethod: 'apple_pay' | 'card' | 'new_card';
  savedCardId?: string;
}

export const PROCEDURES_CATALOG: ProcedureOption[] = [
  {
    id: 'complex-grooming',
    name: 'Комплексний грумінг',
    price: 1300,
    durationMin: 90,
  },
  {
    id: 'hygiene-care',
    name: 'Гігієнічний догляд',
    price: 300,
    durationMin: 30,
  },
  {
    id: 'express-grooming',
    name: 'Експрес-грумінг',
    price: 500,
    durationMin: 45,
  },
  {
    id: 'combing',
    name: 'Вичісування',
    price: 450,
    durationMin: 60,
  },
  {
    id: 'spa-complex',
    name: 'SPA-комплекс',
    price: 600,
    durationMin: 60,
  },
  {
    id: 'breed-haircut',
    name: 'Породна стрижка',
    price: 950,
    durationMin: 100,
  },
  {
    id: 'ozone-therapy',
    name: 'Озонотерапія',
    price: 750,
    durationMin: 45,
  },
  {
    id: 'nail-trimming',
    name: 'Підстригання кігтів',
    price: 150,
    durationMin: 20,
  },
];

export const DEMO_MASTERS: MasterProfile[] = [
  {
    id: 'm-maria-shevchenko',
    name: 'Марія Шевченко',
    role: 'Старший грумер',
    avatarUrl: '/assets/images/master_maria_shevchenko.png',
    specialties: ['Відновлення шерсті', 'Озонотерапія', 'Креативний грумінг'],
    reviewsCount: 121,
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Марія К.',
        rating: 5,
        text: 'Дуже задоволена роботою майстра. Собака поводилася спокійно, а результат перевершив очікування. Обов’язково повернемося ще.',
        date: '12 серпня 2026',
      },
      {
        id: 'rev-2',
        authorName: 'Ірина Л.',
        rating: 5,
        text: 'Дуже хороший сервіс, привітний персонал та комфортна атмосфера.',
        date: '3 серпня 2026',
      },
    ],
  },
  {
    id: 'm-olena-kovalchuk',
    name: 'Олена Ковальчук',
    role: 'Топ-стиліст',
    avatarUrl: '/assets/images/master_olena_kovalchuk.png',
    specialties: ['Породні стрижки', 'СПА-догляд', 'Експрес-грумінг'],
    reviewsCount: 94,
    reviews: [
      {
        id: 'rev-3',
        authorName: 'Оксана П.',
        rating: 5,
        text: 'Прекрасний майстер! Наш шпіц виглядає бездоганно, дуже дбайливе ставлення.',
        date: '20 липня 2026',
      },
    ],
  },
  {
    id: 'm-anna-koval',
    name: 'Анна Коваль',
    role: 'Грумер-експерт',
    avatarUrl: '/assets/images/master_maria_shevchenko.png',
    specialties: ['Гігієнічний догляд', 'Стрижка котів', 'Озонотерапія'],
    reviewsCount: 78,
    reviews: [
      {
        id: 'rev-4',
        authorName: 'Сергій Т.',
        rating: 5,
        text: 'Швидко, якісно і без стресу для тваринки. Рекомендую!',
        date: '15 липня 2026',
      },
    ],
  },
];

export const DEMO_PETS: PetOption[] = [
  {
    id: 'p-baron',
    name: 'Барон',
    species: 'Собака',
    breed: 'Йоркширський тер’єр',
    avatar_url: '/assets/images/pet_baron.png',
  },
  {
    id: 'p-alfa',
    name: 'Альфа',
    species: 'Собака',
    breed: 'Золотистий ретривер',
    avatar_url: '/assets/images/golden_retriever_bath.png',
  },
  {
    id: 'p-charlie',
    name: 'Чарлі',
    species: 'Кіт',
    breed: 'Британський короткошерстий',
    avatar_url: null,
  },
];

export const TIME_SLOTS: string[] = [
  '12:00',
  '14:20',
  '15:10',
  '16:00',
  '16:40',
  '17:50',
  '18:30',
];
