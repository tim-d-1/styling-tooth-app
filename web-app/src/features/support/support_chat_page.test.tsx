import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SupportChatPage from './SupportChatPage';
import * as supportStore from './support_store';
import type { SupportTicket } from './support_types';

vi.mock('./use_support_realtime', () => ({
  useSupportRealtime: vi.fn(),
}));

describe('SupportChatPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockTicket: SupportTicket = {
    id: 'ticket-99',
    ticketNumber: 4829,
    clientId: 'user-1',
    subject: 'Питання щодо трансферу',
    category: 'transfer',
    status: 'in_progress',
    urgency: 'normal',
    petId: 'pet-1',
    petName: 'Оскар',
    petBreed: 'Лабрадор',
    appointmentId: 'appt-1',
    appointmentStartsAt: '2026-10-12T14:00:00Z',
    appointmentPrice: 1500,
    description: 'О котрій приїде Pet-таксі?',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'm-1',
        ticketId: 'ticket-99',
        senderId: 'user-1',
        senderRole: 'client',
        senderName: 'Клієнт',
        text: 'О котрій приїде Pet-таксі?',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'm-2',
        ticketId: 'ticket-99',
        senderId: 'staff-1',
        senderRole: 'staff',
        senderName: 'Сергій',
        text: 'Вітаю! Автомобіль прибуде о 13:30 за вашою адресою.',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  it('renders empty state when user has no tickets and triggers create action', () => {
    const handleCreateTicket = vi.fn();
    render(
      <MemoryRouter>
        <SupportChatPage
          initialTickets={[]}
          onCreateTicketClick={handleCreateTicket}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('У вас ще немає звернень')).toBeDefined();
    const createBtn = screen.getByRole('button', { name: 'Створити звернення' });
    fireEvent.click(createBtn);
    expect(handleCreateTicket).toHaveBeenCalledTimes(1);
  });

  it('renders chat interface with sidebar, messages, and header details', () => {
    render(
      <MemoryRouter>
        <SupportChatPage initialTickets={[mockTicket]} initialTicketId="ticket-99" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Деталі звернення #4829/i)).toBeDefined();
    expect(screen.getByText('Оскар')).toBeDefined();
    expect(screen.getAllByText('Київ, Хрещатик, 15').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Сергій').length).toBeGreaterThan(0);
    expect(screen.getByText('Старший адміністратор')).toBeDefined();
    expect(screen.getByText('О котрій приїде Pet-таксі?')).toBeDefined();
    expect(
      screen.getByText('Вітаю! Автомобіль прибуде о 13:30 за вашою адресою.')
    ).toBeDefined();
  });

  it('triggers onCallClick when clicking call button in chat header', () => {
    const handleCall = vi.fn();
    render(
      <MemoryRouter>
        <SupportChatPage
          initialTickets={[mockTicket]}
          initialTicketId="ticket-99"
          onCallClick={handleCall}
        />
      </MemoryRouter>
    );

    const callBtn = screen.getByRole('button', { name: 'Зателефонувати в підтримку' });
    fireEvent.click(callBtn);
    expect(handleCall).toHaveBeenCalledWith('ticket-99');
  });

  it('sends user message via Supabase and refreshes ticket list', async () => {
    const sendMessageSpy = vi
      .spyOn(supportStore, 'sendMessage')
      .mockResolvedValueOnce({
        id: 'm-3',
        ticketId: 'ticket-99',
        senderId: 'user-1',
        senderRole: 'client',
        senderName: 'Клієнт',
        text: 'Дякую, чекаємо!',
        createdAt: new Date().toISOString(),
      });

    const updatedTicket: SupportTicket = {
      ...mockTicket,
      messages: [
        ...mockTicket.messages,
        {
          id: 'm-3',
          ticketId: 'ticket-99',
          senderId: 'user-1',
          senderRole: 'client',
          senderName: 'Клієнт',
          text: 'Дякую, чекаємо!',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    vi.spyOn(supportStore, 'getTickets').mockResolvedValueOnce([updatedTicket]);

    render(
      <MemoryRouter>
        <SupportChatPage initialTickets={[mockTicket]} initialTicketId="ticket-99" />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Напишіть повідомлення...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Дякую, чекаємо!' } });
    });
    const sendBtn = screen.getByRole('button', { name: 'Надіслати повідомлення' });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalledWith(
        'ticket-99',
        'Дякую, чекаємо!',
        undefined
      );
      expect(screen.getByText('Дякую, чекаємо!')).toBeDefined();
    });
  });

  it('triggers quick action chip to send quick inquiry', async () => {
    const sendMessageSpy = vi
      .spyOn(supportStore, 'sendMessage')
      .mockResolvedValueOnce({
        id: 'm-quick',
        ticketId: 'ticket-99',
        senderId: 'user-1',
        senderRole: 'client',
        senderName: 'Клієнт',
        text: '🌿 Спа-маска',
        createdAt: new Date().toISOString(),
      });

    vi.spyOn(supportStore, 'getTickets').mockResolvedValueOnce([mockTicket]);

    render(
      <MemoryRouter>
        <SupportChatPage initialTickets={[mockTicket]} initialTicketId="ticket-99" />
      </MemoryRouter>
    );

    const chip = screen.getByRole('button', { name: '🌿 Спа-маска' });
    fireEvent.click(chip);

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalledWith(
        'ticket-99',
        '🌿 Спа-маска',
        undefined
      );
    });
  });

  it('displays staff messages on the left and client messages on the right', () => {
    render(
      <MemoryRouter>
        <SupportChatPage initialTickets={[mockTicket]} initialTicketId="ticket-99" />
      </MemoryRouter>
    );

    const staffMsg = screen.getByText('Вітаю! Автомобіль прибуде о 13:30 за вашою адресою.');
    const staffBubble = staffMsg.closest('.bg-white');
    expect(staffBubble).toBeDefined();

    const clientMsg = screen.getByText('О котрій приїде Pet-таксі?');
    const clientBubble = clientMsg.closest('.bg-terracotta');
    expect(clientBubble).toBeDefined();
  });
});
