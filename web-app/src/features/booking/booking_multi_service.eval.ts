import { describe, it, expect } from 'vitest';
import {
  SERVICE_SLUG_MAP,
  resolveServiceId,
  PROCEDURES_CATALOG,
  type ProcedureOption,
} from './booking_types';

describe('Booking Multi-Service and Payment Evals', () => {
  it('correctly maps all service catalog slugs to database UUIDs', () => {
    for (const item of PROCEDURES_CATALOG) {
      const resolved = resolveServiceId(item.id);
      expect(resolved).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(resolved).toBe(SERVICE_SLUG_MAP[item.id]);
    }
  });

  it('passes through raw UUIDs unchanged', () => {
    const rawUuid = 'a0000000-1111-2222-3333-444444444444';
    expect(resolveServiceId(rawUuid)).toBe(rawUuid);
  });

  it('correctly calculates multi-service total prices and durations', () => {
    const selectedProcs: ProcedureOption[] = [
      PROCEDURES_CATALOG[0], // 850, 75 min
      PROCEDURES_CATALOG[1], // 700, 60 min
      PROCEDURES_CATALOG[6], // 250, 20 min
    ];

    const totalPrice = selectedProcs.reduce((sum, p) => sum + p.price, 0);
    const totalDuration = selectedProcs.reduce((sum, p) => sum + p.durationMin, 0);

    expect(totalPrice).toBe(1800);
    expect(totalDuration).toBe(155);
  });

  it('formats combined procedure names for confirmation and notes', () => {
    const selectedProcs: ProcedureOption[] = [
      PROCEDURES_CATALOG[0],
      PROCEDURES_CATALOG[1],
    ];

    const names = selectedProcs.map((p) => p.name).join(', ');
    expect(names).toBe('Експрес-грумінг, SPA-комплекс');
  });

  it('determines the correct payment provider based on selected method', () => {
    const getProvider = (method: 'card' | 'new_card' | 'cash'): 'monobank' | 'cash' =>
      method === 'cash' ? 'cash' : 'monobank';

    expect(getProvider('cash')).toBe('cash');
    expect(getProvider('card')).toBe('monobank');
    expect(getProvider('new_card')).toBe('monobank');
  });
});
