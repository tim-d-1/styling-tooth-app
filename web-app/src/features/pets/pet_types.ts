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
}

export interface PetProcedureHistory {
  id: string;
  appointmentId?: string;
  serviceTitle: string;
  price: number;
  dateFormatted: string;
  masterName: string;
  tags: string[];
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
}
