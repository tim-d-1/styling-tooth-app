export type RequestStatus =
  | 'new'
  | 'in_progress'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface RequestClient {
  id: string;
  fullName: string;
  phone: string;
  avatarUrl?: string | null;
}

export interface RequestPet {
  id: string;
  name: string;
  breed: string;
  species: string;
  avatarUrl?: string | null;
}

export interface RequestService {
  id: string;
  name: string;
  price: number;
}

export interface RequestMaster {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface AppointmentRequest {
  id: string;
  appointmentNumber: string;
  status: RequestStatus;
  startsAt: string;
  endsAt: string;
  price: number;
  client: RequestClient;
  pet: RequestPet;
  service: RequestService;
  master: RequestMaster | null;
  clientNote?: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  newCount: number;
  inProgressCount: number;
  completedCount: number;
  todayRevenue: number;
}

export interface MasterRosterItem {
  id: string;
  displayName: string;
  specialization?: string | null;
  avatarUrl?: string | null;
}

export type RequestFilter = 'all' | 'new' | 'in_progress' | 'completed';
