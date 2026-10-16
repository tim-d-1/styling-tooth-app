import { supabase } from '@/lib/supabase';
import type {
  AppointmentRequest,
  DashboardMetrics,
  MasterRosterItem,
  RequestStatus,
} from './admin_types';
import {
  isAppointmentPast,
  isAppointmentToday,
  toKyivISOString,
} from './admin_date_utils';

export function cleanClientPhone(phone?: string | null): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits || digits.length < 5) return '';
  const withoutPrefix = digits.startsWith('380')
    ? digits.slice(3)
    : digits.startsWith('38')
    ? digits.slice(2)
    : digits;
  if (/^0+$/.test(withoutPrefix) || /^0+$/.test(digits)) return '';
  return trimmed;
}

function formatShortNumber(uuid: string): string {
  const clean = uuid.replace(/-/g, '');
  const sub = clean.slice(0, 4);
  const num = (parseInt(sub, 16) % 9000) + 1000;
  return `#${num}`;
}

export async function syncPastAppointments(): Promise<void> {
  try {
    if (typeof supabase.rpc === 'function') {
      await supabase.rpc('sync_past_appointment_statuses');
    }
  } catch {
    // If RPC is unavailable, client-side guards will handle expired requests
  }
}

export async function fetchAppointmentRequests(): Promise<AppointmentRequest[]> {
  try {
    await syncPastAppointments();

    const { data, error } = await supabase
      .from('appointments')
      .select(
        `
        id,
        status,
        starts_at,
        ends_at,
        price,
        client_note,
        admin_note,
        created_at,
        client:profiles!client_id (
          id,
          full_name,
          phone,
          avatar_url
        ),
        pet:pets!pet_id (
          id,
          name,
          breed,
          species
        ),
        service:services!service_id (
          id,
          name,
          price
        ),
        master:masters!master_id (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return (data as any[]).map((row) => {
      const client = Array.isArray(row.client) ? row.client[0] : row.client;
      const pet = Array.isArray(row.pet) ? row.pet[0] : row.pet;
      const service = Array.isArray(row.service) ? row.service[0] : row.service;
      const master = Array.isArray(row.master) ? row.master[0] : row.master;

      const rawStatus = (row.status as RequestStatus) || 'new';
      const isPast = isAppointmentPast(row.starts_at);
      const isExpired = rawStatus === 'new' && isPast;

      return {
        id: row.id,
        appointmentNumber: formatShortNumber(row.id),
        status: rawStatus,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        price: Number(row.price) || 0,
        isExpired,
        adminNote: row.admin_note || null,
        client: {
          id: client?.id || '',
          fullName: client?.full_name || 'Невідомий клієнт',
          phone: cleanClientPhone(client?.phone),
          avatarUrl: client?.avatar_url || null,
        },
        pet: {
          id: pet?.id || '',
          name: pet?.name || 'Улюбленець',
          breed: pet?.breed || 'Змішана порода',
          species: pet?.species || 'dog',
        },
        service: {
          id: service?.id || '',
          name: service?.name || 'Грумінг комплекс',
          price: Number(service?.price) || Number(row.price) || 0,
        },
        master: master?.id
          ? {
              id: master.id,
              displayName: master.display_name,
              avatarUrl: master.avatar_url || null,
            }
          : null,
        clientNote: row.client_note || null,
        createdAt: row.created_at || new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export async function fetchMasterRoster(): Promise<MasterRosterItem[]> {
  try {
    const { data, error } = await supabase
      .from('masters')
      .select('id, display_name, specialization, avatar_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data) {
      return [];
    }

    return (data as any[]).map((item) => ({
      id: item.id,
      displayName: item.display_name,
      specialization: item.specialization || null,
      avatarUrl: item.avatar_url || null,
    }));
  } catch {
    return [];
  }
}

export function calculateMetrics(
  requests: AppointmentRequest[],
  baseDate?: Date
): DashboardMetrics {
  let newCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let todayRevenue = 0;

  for (const req of requests) {
    const isPast = isAppointmentPast(req.startsAt, baseDate);
    const isToday = isAppointmentToday(req.startsAt, baseDate);
    const isExpired = req.isExpired || (req.status === 'new' && isPast);

    if (req.status === 'new') {
      if (!isExpired) {
        newCount += 1;
      }
    } else if (req.status === 'in_progress' || req.status === 'confirmed') {
      inProgressCount += 1;
    } else if (req.status === 'completed') {
      if (isToday) {
        completedCount += 1;
      }
    }

    if (isToday && (req.status === 'completed' || req.status === 'confirmed')) {
      todayRevenue += req.price;
    }
  }

  return {
    newCount,
    inProgressCount,
    completedCount,
    todayRevenue,
  };
}

export async function confirmAppointment(
  appointmentId: string,
  masterId?: string,
  startsAt?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, any> = {
      status: 'confirmed',
    };

    if (masterId) {
      payload.master_id = masterId;
    }
    if (startsAt) {
      payload.starts_at = toKyivISOString(startsAt);
    }

    const { error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', appointmentId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Помилка підтвердження' };
  }
}

export async function startAppointment(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'in_progress' })
      .eq('id', appointmentId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Помилка початку візиту' };
  }
}

export async function completeAppointment(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Помилка завершення візиту' };
  }
}

export async function markNoShow(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'no_show',
        admin_note: 'Клієнт не зʼявився на процедуру',
      })
      .eq('id', appointmentId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Помилка оновлення статусу' };
  }
}

export async function rejectAppointment(
  appointmentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, any> = {
      status: 'cancelled',
    };
    if (reason) {
      payload.admin_note = reason;
    }

    const { error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', appointmentId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Помилка відхилення' };
  }
}
