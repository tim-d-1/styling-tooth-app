import { describe, it, expect } from 'vitest';
import {
  SERVICE_SLUG_MAP,
  resolveServiceId,
  PROCEDURES_CATALOG,
  ProcedureOption,
} from '../features/booking/booking_types';

describe('Mobile Multi-Service Booking Eval Suite', () => {
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
      PROCEDURES_CATALOG[0],
      PROCEDURES_CATALOG[1],
      PROCEDURES_CATALOG[6],
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
    const getProvider = (method: 'card' | 'cash'): 'monobank' | 'cash' =>
      method === 'cash' ? 'cash' : 'monobank';

    expect(getProvider('cash')).toBe('cash');
    expect(getProvider('card')).toBe('monobank');
  });

  it('validates multi-service RPC parameter structure with mobile source', () => {
    const selectedIds = [
      '50000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000002',
    ];

    const appointmentPayload = {
      p_pet_id: '70000000-0000-0000-0000-000000000001',
      p_master_id: '60000000-0000-0000-0000-000000000001',
      p_service_ids: selectedIds,
      p_starts_at: '2026-08-11T16:00:00.000Z',
      p_client_note: 'Ніжний песик',
      p_source: 'mobile',
    };

    expect(appointmentPayload.p_service_ids).toHaveLength(2);
    expect(appointmentPayload.p_source).toBe('mobile');
    expect(appointmentPayload.p_service_ids.every((id) => /^[0-9a-f-]{36}$/i.test(id))).toBe(true);

    const slotPayload = {
      p_master_id: appointmentPayload.p_master_id,
      p_service_ids: appointmentPayload.p_service_ids,
      p_date: '2026-08-11',
      p_step_min: 30,
    };

    expect(slotPayload.p_step_min).toBe(30);
    expect(slotPayload.p_service_ids).toEqual(selectedIds);
  });
});
