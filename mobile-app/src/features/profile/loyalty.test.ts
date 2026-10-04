import { describe, it, expect } from 'vitest';
import {
  resolveLoyaltyTier,
  calculateCashbackPoints,
  LOYALTY_TIERS,
} from './loyalty';

describe('loyalty calculation', () => {
  it('resolves bronze tier for 0 spend and 0 discount', () => {
    const tier = resolveLoyaltyTier(0, 0);
    expect(tier.level).toBe('bronze');
    expect(tier.name).toBe('Bronze Level • 10% Cashback');
    expect(tier.cashbackRatePct).toBe(10);
  });

  it('resolves silver tier for 2000 UAH spend or 10% discount', () => {
    expect(resolveLoyaltyTier(2000, 0).level).toBe('silver');
    expect(resolveLoyaltyTier(1500, 10).level).toBe('silver');
  });

  it('resolves gold tier for 5000 UAH spend or 15% discount', () => {
    expect(resolveLoyaltyTier(5000, 0).level).toBe('gold');
    expect(resolveLoyaltyTier(4000, 15).level).toBe('gold');
  });

  it('resolves platinum tier for 15000 UAH spend or 25% discount', () => {
    expect(resolveLoyaltyTier(15000, 0).level).toBe('platinum');
    expect(resolveLoyaltyTier(10000, 25).level).toBe('platinum');
  });

  it('calculates cashback points correctly based on amount and cashback rate', () => {
    expect(calculateCashbackPoints(1000, 10)).toBe(400);
    expect(calculateCashbackPoints(2000, 15)).toBe(1200);
    expect(calculateCashbackPoints(5000, 25)).toBe(5000);
    expect(calculateCashbackPoints(0, 10)).toBe(0);
    expect(calculateCashbackPoints(1000, 0)).toBe(0);
  });
});
