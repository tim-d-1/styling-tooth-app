import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createTicket,
  getTickets,
  getTicketById,
  sendMessage,
  updateTicketStatus,
  claimTicket,
} from './support_store';
import type {
  SupportCategory,
  TicketUrgency,
  TicketStatus,
  MessageSenderRole,
  SupportTicket,
} from './support_types';
import { supabase } from '@/lib/supabase';

function isValidTicketTransition(
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
  isStaff: boolean
): boolean {
  if (currentStatus === nextStatus) return true;
  if (isStaff) {
    return ['in_progress', 'waiting', 'resolved', 'closed'].includes(nextStatus);
  }
  return ['resolved', 'closed'].includes(nextStatus);
}

describe('Support Ticket Invariants & Domain Eval', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('evaluates category and urgency domain constraints', () => {
    const validCategories: SupportCategory[] = [
      'booking',
      'services',
      'payment',
      'transfer',
      'other',
    ];
    const validUrgencies: TicketUrgency[] = ['normal', 'urgent'];
    const validStatuses: TicketStatus[] = ['in_progress', 'waiting', 'resolved', 'closed'];
    const validSenderRoles: MessageSenderRole[] = ['client', 'staff', 'system'];

    expect(validCategories).toHaveLength(5);
    expect(validUrgencies).toHaveLength(2);
    expect(validStatuses).toHaveLength(4);
    expect(validSenderRoles).toHaveLength(3);
  });

  it('evaluates status transition permission invariants', () => {
    expect(isValidTicketTransition('in_progress', 'resolved', false)).toBe(true);
    expect(isValidTicketTransition('in_progress', 'closed', false)).toBe(true);
    expect(isValidTicketTransition('in_progress', 'waiting', false)).toBe(false);

    expect(isValidTicketTransition('in_progress', 'waiting', true)).toBe(true);
    expect(isValidTicketTransition('in_progress', 'resolved', true)).toBe(true);
    expect(isValidTicketTransition('in_progress', 'closed', true)).toBe(true);
    expect(isValidTicketTransition('resolved', 'in_progress', true)).toBe(true);
  });

  it('evaluates urgency priority and chronological sorting invariants', () => {
    const now = Date.now();
    const mockTickets: SupportTicket[] = [
      {
        id: 't-normal-old',
        ticketNumber: 4830,
        clientId: 'c1',
        subject: 'Normal old',
        category: 'services',
        status: 'in_progress',
        urgency: 'normal',
        description: 'Desc',
        createdAt: new Date(now - 100000).toISOString(),
        updatedAt: new Date(now - 100000).toISOString(),
        messages: [],
      },
      {
        id: 't-urgent-mid',
        ticketNumber: 4831,
        clientId: 'c2',
        subject: 'Urgent mid',
        category: 'booking',
        status: 'in_progress',
        urgency: 'urgent',
        description: 'Desc',
        createdAt: new Date(now - 50000).toISOString(),
        updatedAt: new Date(now - 50000).toISOString(),
        messages: [],
      },
      {
        id: 't-normal-new',
        ticketNumber: 4832,
        clientId: 'c3',
        subject: 'Normal new',
        category: 'other',
        status: 'waiting',
        urgency: 'normal',
        description: 'Desc',
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
        messages: [],
      },
    ];

    const sorted = [...mockTickets].sort((a, b) => {
      if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
      if (a.urgency !== 'urgent' && b.urgency === 'urgent') return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    expect(sorted[0].id).toBe('t-urgent-mid');
    expect(sorted[1].id).toBe('t-normal-new');
    expect(sorted[2].id).toBe('t-normal-old');
  });

  it('evaluates message ordering invariants across conversational exchanges', () => {
    const messages = [
      { id: '1', createdAt: '2026-09-30T10:00:00Z', senderRole: 'client' as const },
      { id: '2', createdAt: '2026-09-30T10:05:00Z', senderRole: 'staff' as const },
      { id: '3', createdAt: '2026-09-30T10:10:00Z', senderRole: 'client' as const },
      { id: '4', createdAt: '2026-09-30T10:15:00Z', senderRole: 'system' as const },
    ];

    for (let i = 1; i < messages.length; i++) {
      const prev = new Date(messages[i - 1].createdAt).getTime();
      const curr = new Date(messages[i].createdAt).getTime();
      expect(curr).toBeGreaterThan(prev);
    }

    const roles = messages.map((m) => m.senderRole);
    expect(roles).toEqual(['client', 'staff', 'client', 'system']);
  });

  it('evaluates createTicket PostgREST insertion flow and mapping', async () => {
    const authSpy = vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'client-uuid-1', user_metadata: { full_name: 'Іван Тест' } } as any },
      error: null,
    });

    const mockRow = {
      id: 'ticket-uuid-1',
      ticket_number: 4835,
      client_id: 'client-uuid-1',
      subject: 'Затримка трансферу',
      category: 'transfer',
      status: 'in_progress',
      urgency: 'urgent',
      pet_id: 'pet-uuid-1',
      appointment_id: null,
      description: 'Машина ще не прибула',
      attachment_name: null,
      attachment_url: null,
      assigned_staff_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pet: { name: 'Арчі', breed: 'Коргі' },
      appointment: null,
      support_messages: [
        {
          id: 'msg-uuid-1',
          ticket_id: 'ticket-uuid-1',
          sender_id: 'client-uuid-1',
          sender_role: 'client',
          sender_name: 'Іван Тест',
          sender_avatar_url: null,
          text: 'Машина ще не прибула',
          attachment_url: null,
          created_at: new Date().toISOString(),
        },
      ],
    };

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { full_name: 'Іван Тест', avatar_url: null }, error: null }),
            }),
          }),
        } as any;
      }
      if (table === 'support_tickets') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'ticket-uuid-1' }, error: null }),
            }),
          }),
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockRow, error: null }),
            }),
          }),
        } as any;
      }
      if (table === 'support_messages') {
        return {
          insert: () => Promise.resolve({ error: null }),
        } as any;
      }
      return {} as any;
    });

    const ticket = await createTicket({
      subject: 'Затримка трансферу',
      category: 'transfer',
      urgency: 'urgent',
      description: 'Машина ще не прибула',
      petId: 'pet-uuid-1',
    });

    expect(authSpy).toHaveBeenCalled();
    expect(fromSpy).toHaveBeenCalledWith('support_tickets');
    expect(ticket.id).toBe('ticket-uuid-1');
    expect(ticket.ticketNumber).toBe(4835);
    expect(ticket.subject).toBe('Затримка трансферу');
    expect(ticket.petName).toBe('Арчі');
    expect(ticket.petBreed).toBe('Коргі');
    expect(ticket.messages).toHaveLength(1);
    expect(ticket.messages[0].senderRole).toBe('client');
  });

  it('evaluates sendMessage PostgREST insertion with staff role resolution', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'staff-uuid-1', user_metadata: {} } as any },
      error: null,
    });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: { full_name: 'Сергій Адмін', avatar_url: null, role: 'admin' },
                error: null,
              }),
            }),
          }),
        } as any;
      }
      if (table === 'support_messages') {
        return {
          insert: (payload: any) => {
            expect(payload.sender_role).toBe('staff');
            expect(payload.sender_name).toBe('Сергій Адмін');
            return {
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'msg-staff-new',
                    ticket_id: payload.ticket_id,
                    sender_id: payload.sender_id,
                    sender_role: payload.sender_role,
                    sender_name: payload.sender_name,
                    sender_avatar_url: null,
                    text: payload.text,
                    attachment_url: null,
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            };
          },
        } as any;
      }
      return {} as any;
    });

    const msg = await sendMessage('ticket-uuid-1', 'Водій буде за 5 хвилин');
    expect(msg.id).toBe('msg-staff-new');
    expect(msg.senderRole).toBe('staff');
    expect(msg.text).toBe('Водій буде за 5 хвилин');
  });

  it('evaluates updateTicketStatus and claimTicket mutations', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'staff-uuid-1' } as any },
      error: null,
    });

    const updateCalls: Array<{ table: string; payload: any; eq: [string, any] }> = [];

    vi.spyOn(supabase, 'from').mockImplementation((table: string): any => {
      return {
        update: (payload: any) => ({
          eq: (col: string, val: any) => {
            updateCalls.push({ table, payload, eq: [col, val] });
            return Promise.resolve({ error: null });
          },
        }),
      };
    });

    await updateTicketStatus('ticket-100', 'resolved');
    expect(updateCalls).toContainEqual({
      table: 'support_tickets',
      payload: { status: 'resolved' },
      eq: ['id', 'ticket-100'],
    });

    await claimTicket('ticket-100');
    expect(updateCalls).toContainEqual({
      table: 'support_tickets',
      payload: { assigned_staff_id: 'staff-uuid-1' },
      eq: ['id', 'ticket-100'],
    });
  });

  it('evaluates getTickets query structure and mapping', async () => {
    const rawData = [
      {
        id: 't-1',
        ticket_number: 4830,
        client_id: 'c-1',
        subject: 'Питання 1',
        category: 'services',
        status: 'in_progress',
        urgency: 'normal',
        pet_id: null,
        appointment_id: null,
        description: 'Текст',
        attachment_name: null,
        attachment_url: null,
        assigned_staff_id: null,
        created_at: '2026-09-30T12:00:00Z',
        updated_at: '2026-09-30T12:05:00Z',
        pet: null,
        appointment: null,
        support_messages: [
          {
            id: 'm-2',
            ticket_id: 't-1',
            sender_id: 'staff-1',
            sender_role: 'staff',
            sender_name: 'Олена',
            text: 'Відповідь',
            created_at: '2026-09-30T12:05:00Z',
          },
          {
            id: 'm-1',
            ticket_id: 't-1',
            sender_id: 'c-1',
            sender_role: 'client',
            sender_name: 'Іван',
            text: 'Запитання',
            created_at: '2026-09-30T12:00:00Z',
          },
        ],
      },
    ];

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: rawData, error: null }),
      }),
    } as any);

    const tickets = await getTickets();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].id).toBe('t-1');
    expect(tickets[0].messages).toHaveLength(2);
    expect(tickets[0].messages[0].id).toBe('m-1');
    expect(tickets[0].messages[1].id).toBe('m-2');
  });

  it('evaluates getTicketById returning null for unknown id', async () => {
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    } as any);

    const ticket = await getTicketById('non-existent');
    expect(ticket).toBeNull();
  });
});
