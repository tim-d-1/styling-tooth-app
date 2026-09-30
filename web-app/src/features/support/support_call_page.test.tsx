import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SupportCallPage from './SupportCallPage';
import type { SupportTicket } from './support_types';

describe('SupportCallPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockTicket: SupportTicket = {
    id: 'ticket-call-1',
    ticketNumber: 4831,
    subject: 'Консультація щодо вакцинації',
    category: 'services',
    status: 'in_progress',
    urgency: 'normal',
    petId: 'pet-1',
    petName: 'Белла',
    petBreed: 'Пудель',
    description: 'Потрібна консультація майстра',
    createdAt: new Date().toISOString(),
    messages: [],
  };

  it('renders call UI with administrator, HD audio badge, equalizer and timer', () => {
    render(
      <MemoryRouter>
        <SupportCallPage
          initialTicket={mockTicket}
          initialElapsedSeconds={65}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Адміністратор Сергій')).toBeDefined();
    expect(screen.getByText('Салон «Стильний зубець» • HD Audio')).toBeDefined();
    expect(screen.getByLabelText('Еквалайзер')).toBeDefined();
    expect(screen.getByTestId('call-timer').textContent).toBe('01:05');
  });

  it('increments elapsed timer over time', () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <SupportCallPage
          initialTicket={mockTicket}
          initialElapsedSeconds={0}
        />
      </MemoryRouter>
    );

    const timerElement = screen.getByTestId('call-timer');
    expect(timerElement.textContent).toBe('00:00');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(timerElement.textContent).toBe('00:03');
  });

  it('toggles microphone mute state and displays corresponding toast', () => {
    const handleToast = vi.fn();
    render(
      <MemoryRouter>
        <SupportCallPage
          initialTicket={mockTicket}
          onToast={handleToast}
        />
      </MemoryRouter>
    );

    const micBtn = screen.getByRole('button', { name: 'Мікрофон' });
    fireEvent.click(micBtn);

    expect(handleToast).toHaveBeenCalledWith('Мікрофон вимкнено');
    expect(screen.getByText('Увімк. мікрофон')).toBeDefined();

    fireEvent.click(micBtn);
    expect(handleToast).toHaveBeenCalledWith('Мікрофон увімкнено');
    expect(screen.getByText('Мікрофон')).toBeDefined();
  });

  it('toggles video active state and displays corresponding toast', () => {
    const handleToast = vi.fn();
    render(
      <MemoryRouter>
        <SupportCallPage
          initialTicket={mockTicket}
          onToast={handleToast}
        />
      </MemoryRouter>
    );

    const videoBtn = screen.getByRole('button', { name: 'Камера' });
    fireEvent.click(videoBtn);

    expect(handleToast).toHaveBeenCalledWith('Камеру увімкнено');

    fireEvent.click(videoBtn);
    expect(handleToast).toHaveBeenCalledWith('Камеру вимкнено');
  });

  it('terminates call when clicking hangup button and redirects to chat with toast', () => {
    const handleBack = vi.fn();
    const handleToast = vi.fn();

    render(
      <MemoryRouter>
        <SupportCallPage
          initialTicket={mockTicket}
          onBackToChat={handleBack}
          onToast={handleToast}
        />
      </MemoryRouter>
    );

    const hangupBtn = screen.getByRole('button', { name: 'Завершити дзвінок' });
    fireEvent.click(hangupBtn);

    expect(handleToast).toHaveBeenCalledWith('Дзвінок завершено');
    expect(handleBack).toHaveBeenCalledWith('ticket-call-1');
  });

  it('navigates back to chat when clicking header back button or chat control button', () => {
    const handleBack = vi.fn();

    render(
      <MemoryRouter>
        <SupportCallPage
          initialTicket={mockTicket}
          onBackToChat={handleBack}
        />
      </MemoryRouter>
    );

    const backBtn = screen.getByRole('button', { name: 'Назад до чату' });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledWith('ticket-call-1');

    const chatControlBtn = screen.getByRole('button', { name: 'Чат' });
    fireEvent.click(chatControlBtn);
    expect(handleBack).toHaveBeenCalledTimes(2);
  });
});
