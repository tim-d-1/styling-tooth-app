import type { LoyaltyProgramData, LoyaltyTransaction } from '@/config/loyalty';
import type { SavedPaymentMethod, PaymentTransaction, UserAddress, PersonalDataForm } from '@/features/profile/profile_types';
import type { PetProcedureHistory, ProcedureHistorySummary } from '@/features/pets/pet_types';

export const mockLoyaltyTransactions: LoyaltyTransaction[] = [
  {
    id: 'tx-1',
    title: 'Комплексний грумінг (Мальтипу)',
    dateFormatted: '18 Липня 2026',
    points: 240,
    iconName: 'fi-rr-barber-shop',
  },
  {
    id: 'tx-2',
    title: 'Спа + Заспокійлива маска',
    dateFormatted: '02 Липня 2026',
    points: -400,
    iconName: 'fi-rr-spa',
  },
  {
    id: 'tx-3',
    title: 'Експрес-лінька & Догляд за кігтями',
    dateFormatted: '25 Червня 2026',
    points: 60,
    iconName: 'fi-rr-paw',
  },
  {
    id: 'tx-4',
    title: 'Стрижка кігтів',
    dateFormatted: '10 Червня 2026',
    points: -100,
    iconName: 'fi-rr-scissors',
  },
  {
    id: 'tx-5',
    title: 'Озонова ванна + Масаж',
    dateFormatted: '19 Червня 2026',
    points: -200,
    iconName: 'fi-rr-soup',
  },
];

export const mockLoyaltyData: LoyaltyProgramData = {
  balancePoints: 450,
  discountUah: 112,
  tierName: 'Gold Level • 25% Cashback',
  nextTierName: 'До Platinum рівня',
  currentSpendUah: 6800,
  nextTierSpendUah: 7500,
  totalEarnedPoints: 1700,
  totalSpentPoints: 1250,
  privileges: [
    '25% кешбеку з кожної послуги',
    'Пріоритетний запис до топ-майстрів',
    'Безкоштовна спа-маска при комплексному грумінгу',
  ],
  transactions: mockLoyaltyTransactions,
};

export const mockSavedMethods: SavedPaymentMethod[] = [
  {
    id: 'pm-card-1234',
    type: 'card',
    title: '•••• 1234',
    subtitle: 'Термін: 05/29',
    isDefault: true,
    last4: '1234',
    expiry: '05/29',
  },
  {
    id: 'pm-card-4821',
    type: 'card',
    title: '•••• 4821',
    subtitle: 'Термін: 08/28',
    isDefault: false,
    last4: '4821',
    expiry: '08/28',
  },
];

export const mockPaymentTransactions: PaymentTransaction[] = [
  {
    id: 'tx-1',
    title: 'СПА-комплекс (Барон)',
    dateFormatted: '20 Липня 2026 · 14:30',
    amount: 1200,
    serviceType: 'spa',
  },
  {
    id: 'tx-2',
    title: 'Експрес-лінька (Барон)',
    dateFormatted: '12 Травня 2026 · 10:00',
    amount: 850,
    serviceType: 'grooming',
  },
  {
    id: 'tx-3',
    title: 'Гігієнічний догляд (Луна)',
    dateFormatted: '05 Квітня 2026 · 16:15',
    amount: 600,
    serviceType: 'grooming',
  },
];

export const mockProcedures: PetProcedureHistory[] = [
  {
    id: 'proc-1',
    serviceTitle: 'СПА-комплекс + Гігієнічна стрижка',
    price: 1450,
    dateFormatted: '20 Липня 2026',
    masterName: 'Анна К.',
    durationFormatted: '2 год 15 хв',
    rating: 5,
    category: 'spa',
    tags: ['Стрижка', 'Купання', 'Ознаки алергії відсутні'],
    beforePhotoUrl: null,
    afterPhotoUrl: null,
  },
  {
    id: 'proc-2',
    serviceTitle: 'Експрес-лінька & Догляд за кігтями',
    price: 950,
    dateFormatted: '12 Травня 2026',
    masterName: 'Олена М.',
    durationFormatted: '1 год 30 хв',
    statusText: 'Завершено',
    category: 'grooming',
    tags: ['Лінька', 'Вичісування', 'Обрізання кігтів', 'Чистка вух', 'Ознаки алергії відсутні'],
    resultPhotoUrl: null,
  },
];

export const mockProcedureSummary: ProcedureHistorySummary = {
  year: 2026,
  totalProcedures: 12,
  favoriteMaster: 'Анна К.',
};

export const mockAddress: UserAddress = {
  street: 'вул. Хрещатик, 15',
  apartment: '42',
  entranceFloor: "1 під'їзд, 3 пов.",
  label: 'Дім',
  isDefaultTransfer: true,
};

export const mockPersonalData: PersonalDataForm = {
  fullName: 'Катерина Ковальчук',
  phone: '+380 (97) 123 45 67',
  isPhoneVerified: true,
  email: 'kateryna.pet@gmail.com',
  birthDate: '14 Травня 1995',
  avatarUrl: null,
  isVip: true,
};
