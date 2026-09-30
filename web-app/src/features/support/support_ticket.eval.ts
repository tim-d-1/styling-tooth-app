import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createTicket,
  getTickets,
  getTicketById,
  sendMessage,
  clearTicketsCache,
} from './support_store';
import type { SupportCategory, TicketUrgency } from './support_types';
import { supabase } from '@/lib/supabase';

describe('Support Ticket Invariants & Persistence Eval', () => {
  const testUserId = 'test-eval-user-uuid-999';

  beforeEach(() => {
    vi.restoreAllMocks();
    clearTicketsCache(testUserId);
    localStorage.clear();
  });

  it('evaluates schema invariants on ticket creation', async () => {
    const validCategories: SupportCategory[] = [
      'booking',
      'services',
      'payment',
      'transfer',
      'other',
    ];
    const validUrgencies: TicketUrgency[] = ['normal', 'urgent'];

    for (const category of validCategories) {
      for (const urgency of validUrgencies) {
        const ticket = await createTicket(
          {
            subject: `Тестова тема: ${category}`,
            category,
            urgency,
            description: `Детальний опис проблеми для категорії ${category}`,
            petId: 'pet-uuid-test',
            petName: 'Тестовий Пес',
          },
          testUserId
        );

        expect(typeof ticket.id).toBe('string');
        expect(ticket.id.length).toBeGreaterThan(0);
        expect(Number.isInteger(ticket.ticketNumber)).toBe(true);
        expect(ticket.ticketNumber).toBeGreaterThan(0);
        expect(['in_progress', 'waiting', 'resolved', 'closed']).toContain(ticket.status);
        expect(validCategories).toContain(ticket.category);
        expect(validUrgencies).toContain(ticket.urgency);
        expect(ticket.subject.length).toBeGreaterThan(0);
        expect(ticket.description.length).toBeGreaterThan(0);
        expect(Number.isNaN(Date.parse(ticket.createdAt))).toBe(false);

        expect(Array.isArray(ticket.messages)).toBe(true);
        expect(ticket.messages.length).toBe(2);

        const [userMsg, adminMsg] = ticket.messages;
        expect(userMsg.senderRole).toBe('user');
        expect(userMsg.text).toBe(ticket.description);
        expect(adminMsg.senderRole).toBe('admin');
        expect(adminMsg.senderName).toBe('Сергій');
        expect(adminMsg.text.length).toBeGreaterThan(0);
      }
    }
  });

  it('evaluates message sequencing invariants across multiple replies', async () => {
    const ticket = await createTicket(
      {
        subject: 'Послідовність повідомлень',
        category: 'booking',
        urgency: 'normal',
        description: 'Перше звернення від клієнта',
      },
      testUserId
    );

    const reply1 = await sendMessage(ticket.id, 'Чи є вільне вікно на суботу?', testUserId);
    expect(reply1.senderRole).toBe('user');
    expect(reply1.text).toBe('Чи є вільне вікно на суботу?');

    const reply2 = await sendMessage(ticket.id, 'Також хочу замовити спа-маску', testUserId);
    expect(reply2.senderRole).toBe('user');

    const retrieved = await getTicketById(ticket.id, testUserId);
    expect(retrieved).not.toBeNull();
    const messages = retrieved!.messages;

    expect(messages.length).toBe(6);

    for (let i = 1; i < messages.length; i++) {
      const prevTime = new Date(messages[i - 1].createdAt).getTime();
      const currTime = new Date(messages[i].createdAt).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }

    const roles = messages.map((m) => m.senderRole);
    expect(roles).toEqual(['user', 'admin', 'user', 'admin', 'user', 'admin']);
  });

  it('evaluates urgency priority and sorting invariants', async () => {
    const normalTicket = await createTicket(
      {
        subject: 'Звичайне питання',
        category: 'other',
        urgency: 'normal',
        description: 'Питання без поспіху',
      },
      testUserId
    );

    const urgentTicket = await createTicket(
      {
        subject: 'Термінова затримка',
        category: 'booking',
        urgency: 'urgent',
        description: 'Терміново перенести прийом',
      },
      testUserId
    );

    const allTickets = await getTickets(testUserId);
    expect(allTickets.length).toBeGreaterThanOrEqual(2);

    const sortedByUrgency = [...allTickets].sort((a, b) => {
      if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
      if (a.urgency !== 'urgent' && b.urgency === 'urgent') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    expect(sortedByUrgency[0].id).toBe(urgentTicket.id);
    expect(sortedByUrgency.find((t) => t.id === normalTicket.id)!.urgency).toBe('normal');
  });

  it('evaluates multi-layer persistence and synchronization with Supabase metadata', async () => {
    const updateSpy = vi.spyOn(supabase.auth, 'updateUser');

    const created = await createTicket(
      {
        subject: 'Тест синхронізації',
        category: 'services',
        urgency: 'normal',
        description: 'Перевірка локального та віддаленого збереження',
      },
      testUserId
    );

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          support_tickets: expect.arrayContaining([
            expect.objectContaining({ id: created.id }),
          ]),
        }),
      })
    );

    const directLookup = await getTicketById(created.id, testUserId);
    expect(directLookup).toBeDefined();
    expect(directLookup?.ticketNumber).toBe(created.ticketNumber);
    expect(directLookup?.subject).toBe('Тест синхронізації');

    const nonExistent = await getTicketById('non-existent-uuid', testUserId);
    expect(nonExistent).toBeNull();
  });
});
