export type LoyaltyTierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyTierConfig {
  level: LoyaltyTierLevel;
  name: string;
  minSpendUah: number;
  minDiscountPct: number;
  cashbackRatePct: number;
  nextTierName: string;
  nextTierSpendUah: number;
  privileges: string[];
}

export const POINTS_TO_UAH_RATE = 0.25;

export const LOYALTY_TIERS: Record<LoyaltyTierLevel, LoyaltyTierConfig> = {
  bronze: {
    level: 'bronze',
    name: 'Bronze Level • 10% Cashback',
    minSpendUah: 0,
    minDiscountPct: 0,
    cashbackRatePct: 10,
    nextTierName: 'До Silver рівня',
    nextTierSpendUah: 2000,
    privileges: [
      '10% кешбеку з кожної послуги',
      'Бонусна програма накопичення',
      'Нагадування про регулярний догляд',
    ],
  },
  silver: {
    level: 'silver',
    name: 'Silver Level • 15% Cashback',
    minSpendUah: 2000,
    minDiscountPct: 10,
    cashbackRatePct: 15,
    nextTierName: 'До Gold рівня',
    nextTierSpendUah: 5000,
    privileges: [
      '15% кешбеку з кожної послуги',
      'Пріоритетний запис',
      'Знижка на засоби догляду',
    ],
  },
  gold: {
    level: 'gold',
    name: 'Gold Level • 25% Cashback',
    minSpendUah: 5000,
    minDiscountPct: 15,
    cashbackRatePct: 25,
    nextTierName: 'До Platinum рівня',
    nextTierSpendUah: 15000,
    privileges: [
      '25% кешбеку з кожної послуги',
      'Пріоритетний запис до топ-майстрів',
      'Безкоштовна спа-маска при комплексному грумінгу',
    ],
  },
  platinum: {
    level: 'platinum',
    name: 'Platinum Level • 30% Cashback',
    minSpendUah: 15000,
    minDiscountPct: 25,
    cashbackRatePct: 30,
    nextTierName: 'Максимальний рівень',
    nextTierSpendUah: 25000,
    privileges: [
      '30% кешбеку з кожної послуги',
      'VIP обслуговування без черги',
      'Безкоштовний трансфер та спа-маска',
    ],
  },
};

export function resolveLoyaltyTier(
  completedSpend: number,
  discountPct: number = 0
): LoyaltyTierConfig {
  if (
    completedSpend >= LOYALTY_TIERS.platinum.minSpendUah ||
    discountPct >= LOYALTY_TIERS.platinum.minDiscountPct
  ) {
    return LOYALTY_TIERS.platinum;
  }
  if (
    completedSpend >= LOYALTY_TIERS.gold.minSpendUah ||
    discountPct >= LOYALTY_TIERS.gold.minDiscountPct
  ) {
    return LOYALTY_TIERS.gold;
  }
  if (
    completedSpend >= LOYALTY_TIERS.silver.minSpendUah ||
    discountPct >= LOYALTY_TIERS.silver.minDiscountPct
  ) {
    return LOYALTY_TIERS.silver;
  }
  return LOYALTY_TIERS.bronze;
}

export function calculateCashbackPoints(
  amountUah: number,
  cashbackRatePct: number
): number {
  if (amountUah <= 0 || cashbackRatePct <= 0) return 0;
  return Math.round((amountUah * (cashbackRatePct / 100)) / POINTS_TO_UAH_RATE);
}
