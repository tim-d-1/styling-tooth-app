export type SupportCategory =
  | 'booking'
  | 'services'
  | 'payment'
  | 'transfer'
  | 'other';

export type TicketStatus = 'in_progress' | 'waiting' | 'resolved' | 'closed';

export type TicketUrgency = 'normal' | 'urgent';

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderRole: 'user' | 'admin';
  senderName: string;
  senderAvatarUrl?: string;
  text: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: number;
  subject: string;
  category: SupportCategory;
  status: TicketStatus;
  urgency: TicketUrgency;
  petId?: string | null;
  petName?: string | null;
  petBreed?: string | null;
  petAvatarUrl?: string | null;
  appointmentId?: string | null;
  appointmentDateFormatted?: string | null;
  appointmentServices?: string | null;
  appointmentPrice?: number | null;
  description: string;
  attachmentName?: string | null;
  createdAt: string;
  messages: SupportMessage[];
}

export interface CreateTicketInput {
  subject: string;
  category: SupportCategory;
  urgency: TicketUrgency;
  description: string;
  petId?: string | null;
  petName?: string | null;
  petBreed?: string | null;
  petAvatarUrl?: string | null;
  appointmentId?: string | null;
  appointmentDateFormatted?: string | null;
  appointmentServices?: string | null;
  appointmentPrice?: number | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
}
