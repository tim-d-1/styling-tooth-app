import { supabase } from '@/lib/supabase';
import type {
  SupportTicket,
  SupportMessage,
  CreateTicketInput,
} from './support_types';

function mapTicketRow(row: any): Omit<SupportTicket, 'messages'> {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    clientId: row.client_id,
    subject: row.subject,
    category: row.category,
    status: row.status,
    urgency: row.urgency,
    petId: row.pet_id ?? null,
    petName: row.pet?.name ?? null,
    petBreed: row.pet?.breed ?? null,
    appointmentId: row.appointment_id ?? null,
    appointmentStartsAt: row.appointment?.starts_at ?? null,
    appointmentPrice: row.appointment?.price ?? null,
    description: row.description,
    attachmentName: row.attachment_name ?? null,
    attachmentUrl: row.attachment_url ?? null,
    assignedStaffId: row.assigned_staff_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessageRow(row: any): SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    senderAvatarUrl: row.sender_avatar_url ?? null,
    text: row.text,
    attachmentUrl: row.attachment_url ?? null,
    createdAt: row.created_at,
  };
}

export async function getTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      *,
      pet:pets(name, breed),
      appointment:appointments(starts_at, price),
      support_messages(*)
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => ({
    ...mapTicketRow(row),
    messages: (row.support_messages || [])
      .map(mapMessageRow)
      .sort((a: SupportMessage, b: SupportMessage) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
  }));
}

export async function getTicketById(ticketId: string): Promise<SupportTicket | null> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      *,
      pet:pets(name, breed),
      appointment:appointments(starts_at, price),
      support_messages(*)
    `)
    .eq('id', ticketId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...mapTicketRow(data),
    messages: (data.support_messages || [])
      .map(mapMessageRow)
      .sort((a: SupportMessage, b: SupportMessage) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
  };
}

export async function createTicket(input: CreateTicketInput): Promise<SupportTicket> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const senderName = profile?.full_name || user.user_metadata?.full_name || 'Клієнт';
  const senderAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || null;

  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;

  if (input.attachment) {
    attachmentName = input.attachment.name;
    const ext = input.attachment.name.split('.').pop() || 'bin';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('support-attachments')
      .upload(path, input.attachment);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage
      .from('support-attachments')
      .getPublicUrl(path);
    attachmentUrl = urlData.publicUrl;
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert({
      client_id: user.id,
      subject: input.subject.trim(),
      category: input.category,
      urgency: input.urgency,
      description: input.description.trim(),
      pet_id: input.petId || null,
      appointment_id: input.appointmentId || null,
      attachment_name: attachmentName,
      attachment_url: attachmentUrl,
    })
    .select()
    .single();

  if (ticketError) throw ticketError;

  const { error: msgError } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      sender_role: 'client',
      sender_name: senderName,
      sender_avatar_url: senderAvatar,
      text: input.description.trim(),
      attachment_url: attachmentUrl,
    });

  if (msgError) throw msgError;

  const created = await getTicketById(ticket.id);
  if (!created) throw new Error('Failed to load created ticket');
  return created;
}

export async function sendMessage(
  ticketId: string,
  text: string,
  attachment?: File
): Promise<SupportMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle();

  const senderName = profile?.full_name || 'Користувач';
  const senderAvatar = profile?.avatar_url || null;
  const senderRole = ['admin', 'receptionist', 'master'].includes(profile?.role || '')
    ? 'staff' as const
    : 'client' as const;

  let attachmentUrl: string | null = null;
  if (attachment) {
    const ext = attachment.name.split('.').pop() || 'bin';
    const path = `${user.id}/${ticketId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('support-attachments')
      .upload(path, attachment);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage
      .from('support-attachments')
      .getPublicUrl(path);
    attachmentUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      sender_role: senderRole,
      sender_name: senderName,
      sender_avatar_url: senderAvatar,
      text: text.trim(),
      attachment_url: attachmentUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return mapMessageRow(data);
}

export async function updateTicketStatus(
  ticketId: string,
  status: 'in_progress' | 'waiting' | 'resolved' | 'closed'
): Promise<void> {
  const { error } = await supabase
    .from('support_tickets')
    .update({ status })
    .eq('id', ticketId);
  if (error) throw error;
}

export async function claimTicket(ticketId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('support_tickets')
    .update({ assigned_staff_id: user.id })
    .eq('id', ticketId);
  if (error) throw error;
}
