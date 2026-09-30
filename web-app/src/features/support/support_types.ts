export type SupportCategory = 'booking' | 'services' | 'payment' | 'transfer' | 'other';
export type TicketStatus = 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketUrgency = 'normal' | 'urgent';
export type MessageSenderRole = 'client' | 'staff' | 'system';

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  senderName: string;
  senderAvatarUrl?: string | null;
  text: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: number;
  clientId: string;
  subject: string;
  category: SupportCategory;
  status: TicketStatus;
  urgency: TicketUrgency;
  petId?: string | null;
  petName?: string | null;
  petBreed?: string | null;
  appointmentId?: string | null;
  appointmentStartsAt?: string | null;
  appointmentPrice?: number | null;
  description: string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  assignedStaffId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface CreateTicketInput {
  subject: string;
  category: SupportCategory;
  urgency: TicketUrgency;
  description: string;
  petId?: string | null;
  appointmentId?: string | null;
  attachment?: File | null;
}
