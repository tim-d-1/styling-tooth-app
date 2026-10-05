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
  duration: string;
  description: string;
  priceFormatted: string;
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

  paymentMethod: 'apple_pay' | 'card' | 'cash';
}

export const PROCEDURES_CATALOG: ProcedureOption[] = [
  {
    id: 'express-grooming',
    name: 'Експрес-грумінг',
    duration: '60 – 90 хв',
    durationMin: 75,
    description:
      'Швидке освіження зовнішнього вигляду без повної стрижки: купання, сушіння, легке вичісування та гігієнічний догляд.',
    price: 850,
    priceFormatted: 'від 850 ₴',
  },
  {
    id: 'spa-complex',
    name: 'SPA-комплекс',
    duration: '60 хв',
    durationMin: 60,
    description:
      'Розслаблюючий догляд із професійною косметикою: зволоження шерсті, маска, масаж і делікатне очищення шкіри.',
    price: 700,
    priceFormatted: 'від 700 ₴',
  },
  {
    id: 'ozone-therapy',
    name: 'Озонотерапія',
    duration: '45 – 60 хв',
    durationMin: 50,
    description:
      'Оздоровча процедура з озонованою водою для очищення шкіри, зменшення подразнень і покращення стану шерсті.',
    price: 650,
    priceFormatted: 'від 650 ₴',
  },
  {
    id: 'hygiene-care',
    name: 'Гігієнічний догляд',
    duration: '30 – 45 хв',
    durationMin: 35,
    description:
      'Догляд за лапами, очима, вухами, інтимною зоною та кігтями для підтримання чистоти й комфорту.',
    price: 450,
    priceFormatted: 'від 450 ₴',
  },
  {
    id: 'combing',
    name: 'Вичісування',
    duration: '45 – 90 хв',
    durationMin: 60,
    description:
      'Делікатне видалення відмерлого підшерстка, ковтунів і зайвої шерсті для здорового та охайного вигляду.',
    price: 550,
    priceFormatted: 'від 550 ₴',
  },
  {
    id: 'breed-haircut',
    name: 'Породна стрижка',
    duration: '90 – 150 хв',
    durationMin: 120,
    description:
      'Професійна стрижка за стандартом породи для підтримання доглянутого вигляду та підкреслення природної краси шерсті.',
    price: 1100,
    priceFormatted: 'від 1100 ₴',
  },
  {
    id: 'nail-trimming',
    name: 'Підстригання кігтів',
    duration: '15 – 20 хв',
    durationMin: 20,
    description:
      "Безпечне підстригання кігтів із дбайливою обробкою країв для комфорту та здоров'я лап.",
    price: 250,
    priceFormatted: 'від 250 ₴',
  },
];

export const DEMO_MASTERS: MasterProfile[] = [];

export const DEMO_PETS: PetOption[] = [
  {
    id: 'p-baron',
    name: 'Барон',
    species: 'Собака',
    breed: 'Йоркширський тер’єр',
    avatar_url: null,
  },
  {
    id: 'p-alfa',
    name: 'Альфа',
    species: 'Собака',
    breed: 'Золотистий ретривер',
    avatar_url: null,
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
