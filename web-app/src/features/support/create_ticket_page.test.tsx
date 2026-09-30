import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateTicketPage from './CreateTicketPage';
import * as supportStore from './support_store';

describe('CreateTicketPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockPets = [
    { id: 'pet-1', name: 'Рекс', breed: 'Вівчарка' },
    { id: 'pet-2', name: 'Барсік', breed: 'Британський' },
  ];

  const mockAppointments = [
    {
      id: 'appt-1',
      starts_at: '2026-10-05T14:00:00Z',
      price: 1200,
      service: { name: 'Комплексний грумінг' },
      pet: { name: 'Рекс' },
    },
  ];

  it('renders breadcrumbs and triggers navigation callbacks', () => {
    const handleHomeClick = vi.fn();
    render(
      <MemoryRouter>
        <CreateTicketPage onHomeClick={handleHomeClick} />
      </MemoryRouter>
    );

    const homeBtn = screen.getByRole('button', { name: 'Головна' });
    fireEvent.click(homeBtn);
    expect(handleHomeClick).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Нове звернення')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Служба підтримки' })).toBeDefined();
  });

  it('validates required fields when submitted empty', async () => {
    render(
      <MemoryRouter>
        <CreateTicketPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: 'Створити звернення' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Будь ласка, вкажіть тему звернення')).toBeDefined();
      expect(screen.getByText('Будь ласка, опишіть вашу проблему')).toBeDefined();
    });
  });

  it('binds authentic dynamic user pets and appointments in select options', () => {
    render(
      <MemoryRouter>
        <CreateTicketPage
          initialPets={mockPets}
          initialAppointments={mockAppointments}
        />
      </MemoryRouter>
    );

    const petSelect = screen.getByLabelText('Улюбленець') as HTMLSelectElement;
    expect(petSelect).toBeDefined();
    expect(within(petSelect).getByRole('option', { name: 'Без прив\'язки' })).toBeDefined();
    expect(within(petSelect).getByRole('option', { name: 'Рекс (Вівчарка)' })).toBeDefined();
    expect(within(petSelect).getByRole('option', { name: 'Барсік (Британський)' })).toBeDefined();

    const apptSelect = screen.getByLabelText('Пов\'язаний візит') as HTMLSelectElement;
    expect(apptSelect).toBeDefined();
    expect(apptSelect.options.length).toBeGreaterThan(1);
  });

  it('submits valid form data with simplified input shape to createTicket', async () => {
    const handleSuccess = vi.fn();
    const handleToast = vi.fn();

    const createSpy = vi.spyOn(supportStore, 'createTicket').mockResolvedValueOnce({
      id: 'ticket-1234',
      ticketNumber: 4830,
      clientId: 'user-1',
      subject: 'Затримка візиту',
      category: 'booking',
      status: 'in_progress',
      urgency: 'urgent',
      petId: 'pet-1',
      petName: 'Рекс',
      petBreed: 'Вівчарка',
      description: 'Чи можливо перенести візит на 30 хвилин пізніше?',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });

    render(
      <MemoryRouter>
        <CreateTicketPage
          onSuccess={handleSuccess}
          onToast={handleToast}
          initialPets={mockPets}
          initialAppointments={mockAppointments}
        />
      </MemoryRouter>
    );

    const subjectInput = screen.getByLabelText(/Тема звернення/i);
    fireEvent.change(subjectInput, { target: { value: 'Затримка візиту' } });

    const petSelect = screen.getByLabelText('Улюбленець');
    fireEvent.change(petSelect, { target: { value: 'pet-1' } });

    const urgencySelect = screen.getByLabelText('Терміновість');
    fireEvent.change(urgencySelect, { target: { value: 'urgent' } });

    const descInput = screen.getByLabelText(/Опис проблеми/i);
    fireEvent.change(descInput, {
      target: { value: 'Чи можливо перенести візит на 30 хвилин пізніше?' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Створити звернення' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Затримка візиту',
          urgency: 'urgent',
          petId: 'pet-1',
          description: 'Чи можливо перенести візит на 30 хвилин пізніше?',
        })
      );
      expect(handleToast).toHaveBeenCalledWith('Звернення успішно створено');
      expect(handleSuccess).toHaveBeenCalledWith('ticket-1234');
    });
  });

  it('passes attachment File object directly to createTicket', async () => {
    const handleSuccess = vi.fn();
    const handleToast = vi.fn();

    const createSpy = vi.spyOn(supportStore, 'createTicket').mockResolvedValueOnce({
      id: 'ticket-file',
      ticketNumber: 4831,
      clientId: 'user-1',
      subject: 'Фото чеку',
      category: 'payment',
      status: 'in_progress',
      urgency: 'normal',
      description: 'Додаю фото чеку.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });

    render(
      <MemoryRouter>
        <CreateTicketPage
          onSuccess={handleSuccess}
          onToast={handleToast}
        />
      </MemoryRouter>
    );

    const subjectInput = screen.getByLabelText(/Тема звернення/i);
    fireEvent.change(subjectInput, { target: { value: 'Фото чеку' } });

    const descInput = screen.getByLabelText(/Опис проблеми/i);
    fireEvent.change(descInput, { target: { value: 'Додаю фото чеку.' } });

    const categorySelect = screen.getByLabelText('Категорія');
    fireEvent.change(categorySelect, { target: { value: 'payment' } });

    const fileInput = document.getElementById('ticket-file-input') as HTMLInputElement;
    const file = new File(['content'], 'receipt.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('receipt.pdf')).toBeDefined();

    const submitBtn = screen.getByRole('button', { name: 'Створити звернення' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Фото чеку',
          category: 'payment',
          attachment: file,
        })
      );
    });
  });

  it('supports selecting and clearing an attached file', async () => {
    const handleToast = vi.fn();
    render(
      <MemoryRouter>
        <CreateTicketPage onToast={handleToast} />
      </MemoryRouter>
    );

    const fileInput = document.getElementById('ticket-file-input') as HTMLInputElement;
    const file = new File(['content'], 'receipt.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('receipt.pdf')).toBeDefined();

    const removeBtn = screen.getByRole('button', { name: 'Видалити прикріплений файл' });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('receipt.pdf')).toBeNull();
  });
});
