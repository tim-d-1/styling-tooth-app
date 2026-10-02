import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSupportPage from './AdminSupportPage';
import * as supportStore from '@/features/support/support_store';
import type { SupportTicket } from '@/features/support/support_types';

vi.mock('@/features/support/use_support_realtime', () => ({
  useSupportRealtime: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: vi.fn(),
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { phone: '+380501234567' }, error: null }),
          maybeSingle: () => Promise.resolve({ data: { phone: '+380501234567' }, error: null }),
        }),
      }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'staff-1' } } }),
      getSession: () => Promise.resolve({ data: { session: { user: { id: 'staff-1' } } } }),
    },
  },
}));

describe('AdminSupportPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const makeTicket = (overrides: Partial<SupportTicket> = {}): SupportTicket => ({
    id: 'ticket-1',
    ticketNumber: 4830,
    clientId: 'client-1',
    subject: 'Перенести візит',
    category: 'booking',
    status: 'in_progress',
    urgency: 'normal',
    description: 'Хочу перенести візит',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-1',
        ticketId: 'ticket-1',
        senderId: 'client-1',
        senderRole: 'client',
        senderName: 'Тетяна',
        text: 'Хочу перенести візит',
        createdAt: new Date().toISOString(),
      },
    ],
    ...overrides,
  });

  it('loads and displays tickets from the store', async () => {
    const tickets = [
      makeTicket(),
      makeTicket({ id: 'ticket-2', ticketNumber: 4831, subject: 'Питання щодо оплати', category: 'payment', status: 'waiting', urgency: 'urgent' }),
    ];

    vi.spyOn(supportStore, 'getTickets').mockResolvedValue(tickets);

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminSupportPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Служба підтримки' })).toBeDefined();
      expect(screen.getByText('#4830')).toBeDefined();
      expect(screen.getByText('#4831')).toBeDefined();
    });
  });

  it('filters tickets by tab selection', async () => {
    const tickets = [
      makeTicket({ status: 'in_progress' }),
      makeTicket({ id: 'ticket-resolved', ticketNumber: 4832, subject: 'Вирішена справа', status: 'resolved' }),
    ];

    vi.spyOn(supportStore, 'getTickets').mockResolvedValue(tickets);

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminSupportPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('#4830')).toBeDefined();
    });

    const resolvedTab = screen.getByRole('tab', { name: 'Вирішені' });
    await act(async () => {
      fireEvent.click(resolvedTab);
    });

    await waitFor(() => {
      expect(screen.getByText('#4832')).toBeDefined();
      expect(screen.queryByText('#4830')).toBeNull();
    });
  });

  it('filters by urgency toggle', async () => {
    const tickets = [
      makeTicket({ urgency: 'normal' }),
      makeTicket({ id: 'ticket-urgent', ticketNumber: 4833, urgency: 'urgent', subject: 'Терміновий запит' }),
    ];

    vi.spyOn(supportStore, 'getTickets').mockResolvedValue(tickets);

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminSupportPage />
        </MemoryRouter>
      );
    });

    const allTab = screen.getByRole('tab', { name: 'Всі' });
    await act(async () => {
      fireEvent.click(allTab);
    });

    await waitFor(() => {
      expect(screen.getByText('#4830')).toBeDefined();
      expect(screen.getByText('#4833')).toBeDefined();
    });

    const urgentCheckbox = screen.getByLabelText('Тільки термінові');
    await act(async () => {
      fireEvent.click(urgentCheckbox);
    });

    await waitFor(() => {
      expect(screen.queryByText('#4830')).toBeNull();
      expect(screen.getByText('#4833')).toBeDefined();
    });
  });

  it('calls updateTicketStatus when changing status dropdown', async () => {
    const ticket = makeTicket();
    vi.spyOn(supportStore, 'getTickets').mockResolvedValue([ticket]);
    const statusSpy = vi.spyOn(supportStore, 'updateTicketStatus').mockResolvedValue();

    const handleToast = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminSupportPage onToast={handleToast} />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('#4830')).toBeDefined();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('#4830'));
    });

    const statusSelect = screen.getByDisplayValue('В обробці');
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: 'resolved' } });
    });

    await waitFor(() => {
      expect(statusSpy).toHaveBeenCalledWith('ticket-1', 'resolved');
      expect(handleToast).toHaveBeenCalledWith('Статус оновлено');
    });
  });

  it('calls claimTicket when clicking the claim button', async () => {
    const ticket = makeTicket({ assignedStaffId: null });
    vi.spyOn(supportStore, 'getTickets').mockResolvedValue([ticket]);
    const claimSpy = vi.spyOn(supportStore, 'claimTicket').mockResolvedValue();

    const handleToast = vi.fn();

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminSupportPage onToast={handleToast} />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('#4830')).toBeDefined();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('#4830'));
    });

    await waitFor(() => {
      expect(screen.getByText('Прийняти')).toBeDefined();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Прийняти'));
    });

    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalledWith('ticket-1');
      expect(handleToast).toHaveBeenCalledWith('Тікет прийнято в роботу');
    });
  });

  it('sends a staff message through the chat workspace', async () => {
    const ticket = makeTicket();
    vi.spyOn(supportStore, 'getTickets').mockResolvedValue([ticket]);
    const sendSpy = vi.spyOn(supportStore, 'sendMessage').mockResolvedValue({
      id: 'msg-staff-1',
      ticketId: 'ticket-1',
      senderId: 'staff-1',
      senderRole: 'staff',
      senderName: 'Рецепціоніст',
      text: 'Вітаю! Чим можу допомогти?',
      createdAt: new Date().toISOString(),
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminSupportPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('#4830')).toBeDefined();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('#4830'));
    });

    const quickReply = await screen.findByText('Вітаю! Чим можу допомогти?');
    await act(async () => {
      fireEvent.click(quickReply);
    });

    const textarea = screen.getByPlaceholderText('Введіть повідомлення...');
    expect((textarea as HTMLTextAreaElement).value).toBe('Вітаю! Чим можу допомогти?');

    await act(async () => {
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
    });

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith('ticket-1', 'Вітаю! Чим можу допомогти?');
    });
  });
});
