import { supabase } from '@/lib/supabase';
import type {
  AppointmentRequest,
  DashboardMetrics,
  MasterRosterItem,
  RequestStatus,
} from './admin_types';

function formatShortNumber(uuid: string): string {
  const clean = uuid.replace(/-/g, '');
  const sub = clean.slice(0, 4);
  const num = parseInt(sub, 16) % 9000 + 1000;
  return `#${num}`;
}

export async function fetchAppointmentRequests(): Promise<AppointmentRequest[]> {
  try {
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

      return {
        id: row.id,
        appointmentNumber: formatShortNumber(row.id),
        status: (row.status as RequestStatus) || 'new',
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        price: Number(row.price) || 0,
        client: {
          id: client?.id || '',
          fullName: client?.full_name || 'Невідомий клієнт',
          phone: client?.phone || '+38 (000) 000-00-00',
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
  requests: AppointmentRequest[]
): DashboardMetrics {
  const todayStr = new Date().toISOString().slice(0, 10);

  let newCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let todayRevenue = 0;

  for (const req of requests) {
    if (req.status === 'new') {
      newCount += 1;
    } else if (req.status === 'in_progress' || req.status === 'confirmed') {
      inProgressCount += 1;
    } else if (req.status === 'completed') {
      completedCount += 1;
    }

    const reqDate = req.startsAt ? req.startsAt.slice(0, 10) : '';
    if (
      reqDate === todayStr &&
      (req.status === 'completed' || req.status === 'confirmed')
    ) {
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
      payload.starts_at = startsAt;
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

export async function rejectAppointment(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Помилка відхилення' };
  }
}
