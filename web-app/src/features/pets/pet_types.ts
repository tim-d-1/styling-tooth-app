export interface PetDetail {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'rabbit' | 'rodent' | 'bird' | 'other' | string;
  breed?: string | null;
  birthDate?: string | null;
  ageFormatted?: string | null;
  weightKg?: number | null;
  behaviorNotes?: string | null;
  medicalNotes?: string | null;
  avatarUrl?: string | null;
  visitsCount: number;
  isVip?: boolean;
}

export interface PetSwitcherItem {
  id: string;
  name: string;
  species: string;
  isActive: boolean;
}

export interface CareScheduleItem {
  id: string;
  title: string;
  badgeText: string;
  drugName?: string;
  validUntilFormatted?: string;
  iconName: string;
  category?: 'parasites' | 'vaccines';
  statusText?: string;
  statusType?: 'success' | 'neutral' | 'warning';
}

export interface CareScheduleNotification {
  id: string;
  title: string;
  drugInfo: string;
  dueDateText: string;
  isRead: boolean;
}

export interface PetMedicalDocument {
  id: string;
  title: string;
  fileCount: number;
}

export interface PetProcedureHistory {
  id: string;
  appointmentId?: string;
  serviceTitle: string;
  price: number;
  dateFormatted: string;
  masterName: string;
  durationFormatted?: string;
  rating?: number;
  statusText?: string;
  category?: 'grooming' | 'spa' | 'transfer' | 'payment';
  tags: string[];
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  resultPhotoUrl?: string | null;
}

export interface ProcedureHistorySummary {
  year: number;
  totalProcedures: number;
  favoriteMaster: string;
}

