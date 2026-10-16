import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { RequestProcessingPage } from './RequestProcessingPage';
import * as adminService from './admin_service';
import type { AppointmentRequest, MasterRosterItem } from './admin_types';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

const mockMasters: MasterRosterItem[] = [
  {
    id: 'm-1',
    displayName: 'Олена',
    specialization: 'Топ-майстер',
  },
  {
    id: 'm-2',
    displayName: 'Анна',
    specialization: 'Грумер',
  },
];

const tomorrowDate = new Date(Date.now() + 86400000).toISOString();
const dayAfterDate = new Date(Date.now() + 2 * 86400000).toISOString();

const mockRequests: AppointmentRequest[] = [
  {
    id: 'req-1',
    appointmentNumber: '#1084',
    status: 'new',
    startsAt: tomorrowDate,
    endsAt: tomorrowDate,
    price: 1200,
    client: {
      id: 'c-1',
      fullName: 'Катерина Ковальчук',
      phone: '+38 (067) 123-45-67',
    },
    pet: {
      id: 'p-1',
      name: 'Барон',
      breed: 'Мальтипу',
      species: 'dog',
    },
    service: {
      id: 's-1',
      name: 'Грумінг комплекс + Спа-маска',
      price: 1200,
    },
    master: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-2',
    appointmentNumber: '#1083',
    status: 'new',
    startsAt: dayAfterDate,
    endsAt: dayAfterDate,
    price: 800,
    client: {
      id: 'c-2',
      fullName: 'Іван Петренко',
      phone: '+38 (050) 987-65-43',
    },
    pet: {
      id: 'p-2',
      name: 'Рей',
      breed: 'Пудель',
      species: 'dog',
    },
    service: {
      id: 's-2',
      name: 'Гігієнічна стрижка',
      price: 800,
    },
    master: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-3',
    appointmentNumber: '#1082',
    status: 'in_progress',
    startsAt: tomorrowDate,
    endsAt: tomorrowDate,
    price: 1500,
    client: {
      id: 'c-3',
      fullName: 'Вікторія Сидоренко',
      phone: '+38 (063) 111-22-33',
    },
    pet: {
      id: 'p-3',
      name: 'Бадді',
      breed: 'Шнауцер',
      species: 'dog',
    },
    service: {
      id: 's-3',
      name: 'Триммінг',
      price: 1500,
    },
    master: {
      id: 'm-1',
      displayName: 'Олена',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-4',
    appointmentNumber: '#1081',
    status: 'completed',
    startsAt: tomorrowDate,
    endsAt: tomorrowDate,
    price: 1000,
    client: {
      id: 'c-4',
      fullName: 'Олег Бондаренко',
      phone: '+38 (097) 555-44-33',
    },
    pet: {
      id: 'p-4',
      name: 'Арчі',
      breed: 'Йоркширський терʼєр',
      species: 'dog',
    },
    service: {
      id: 's-4',
      name: 'СПА-комплекс',
      price: 1000,
    },
    master: {
      id: 'm-2',
      displayName: 'Анна',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-past',
    appointmentNumber: '#1000',
    status: 'new',
    startsAt: '2026-10-06T09:00:00Z',
    endsAt: '2026-10-06T10:00:00Z',
    price: 650,
    isExpired: true,
    client: {
      id: 'c-old',
      fullName: 'Старий Клієнт',
      phone: '+380509998877',
    },
    pet: {
      id: 'p-old',
      name: 'Шарик',
      breed: 'Двортерʼєр',
      species: 'dog',
    },
    service: {
      id: 's-old',
      name: 'Озонотерапія',
      price: 650,
    },
    master: null,
    createdAt: '2026-10-06T09:30:00Z',
  },
];

describe('RequestProcessingPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders heading, metrics bar, and active request cards list', () => {
    render(
      <RequestProcessingPage
        initialRequests={mockRequests}
        initialMasters={mockMasters}
      />
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Обробка заявок' })
    ).toBeDefined();

    const metricsBar = screen.getByLabelText('Показники за сьогодні');
    expect(within(metricsBar).getByText('Нові заявки')).toBeDefined();
    expect(within(metricsBar).getByText('В обробці')).toBeDefined();
    expect(within(metricsBar).getByText('Завершені')).toBeDefined();
    expect(within(metricsBar).getByText('Дохід за сьогодні')).toBeDefined();

    expect(screen.getByText('#1084')).toBeDefined();
    expect(screen.getByText('#1083')).toBeDefined();
    expect(screen.getByText('#1082')).toBeDefined();
    expect(screen.queryByText('#1000')).toBeNull();
  });

  it('excludes past expired appointment from active queue and displays it in archive', () => {
    render(
      <RequestProcessingPage
        initialRequests={mockRequests}
        initialMasters={mockMasters}
      />
    );

    expect(screen.queryByText('#1000')).toBeNull();

    const archiveTab = screen.getByRole('tab', { name: 'Архів' });
    fireEvent.click(archiveTab);

    expect(screen.getByText('#1000')).toBeDefined();
    expect(screen.getAllByText('Протерміновано').length).toBeGreaterThan(0);
  });

  it('shows request inspector with client, pet, and controls for selected request', () => {
    render(
      <RequestProcessingPage
        initialRequests={mockRequests}
        initialMasters={mockMasters}
        initialSelectedRequestId="req-1"
      />
    );

    expect(screen.getByText('Катерина Ковальчук')).toBeDefined();
    expect(screen.getByText('+38 (067) 123-45-67')).toBeDefined();
    expect(screen.getByText('Барон')).toBeDefined();
    expect(screen.getByText('Мальтипу')).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Підтвердити та сповістити' })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Відхилити заявку' })
    ).toBeDefined();
  });

  it('allows switching selected request by clicking another card', () => {
    render(
      <RequestProcessingPage
        initialRequests={mockRequests}
        initialMasters={mockMasters}
        initialSelectedRequestId="req-1"
      />
    );

    const card2 = screen.getByRole('button', {
      name: /Заявка #1083, Гігієнічна стрижка/i,
    });
    fireEvent.click(card2);

    expect(screen.getByText('Іван Петренко')).toBeDefined();
    expect(screen.getByText('Рей')).toBeDefined();
    expect(screen.getByText('Пудель')).toBeDefined();
  });

  it('filters requests when filter tabs are clicked', () => {
    render(
      <RequestProcessingPage
        initialRequests={mockRequests}
        initialMasters={mockMasters}
      />
    );

    const newTab = screen.getByRole('tab', { name: 'Нові' });
    fireEvent.click(newTab);

    expect(screen.getByText('#1084')).toBeDefined();
    expect(screen.getByText('#1083')).toBeDefined();
    expect(screen.queryByText('#1082')).toBeNull();
    expect(screen.queryByText('#1081')).toBeNull();

    const inProgressTab = screen.getByRole('tab', { name: 'В обробці' });
    fireEvent.click(inProgressTab);

    expect(screen.getByText('#1082')).toBeDefined();
    expect(screen.queryByText('#1084')).toBeNull();

    const completedTab = screen.getByRole('tab', { name: 'Завершені' });
    fireEvent.click(completedTab);

    expect(screen.getByText('#1081')).toBeDefined();
    expect(screen.queryByText('#1084')).toBeNull();
  });

  it('allows selecting an assigned master from the dropdown', () => {
    render(
      <RequestProcessingPage
        initialRequests={mockRequests}
        initialMasters={mockMasters}
        initialSelectedRequestId="req-1"
      />
    );

    const masterSelect = screen.getByLabelText(
      'Призначити майстра'
    ) as HTMLSelectElement;
    expect(masterSelect).toBeDefined();

    fireEvent.change(masterSelect, { target: { value: 'm-2' } });
    expect(masterSelect.value).toBe('m-2');
  });

  it('calls confirmAppointment and fires toast on confirm click', async () => {
    const confirmSpy = vi
      .spyOn(adminService, 'confirmAppointment')
      .mockResolvedValue({ success: true });
    const toastSpy = vi.fn();

    render(
      <RequestProcessingPage
        initialRequests={mockRequests}
        initialMasters={mockMasters}
        initialSelectedRequestId="req-1"
        onToast={toastSpy}
      />
    );

    const confirmBtn = screen.getByRole('button', {
      name: 'Підтвердити та сповістити',
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        'req-1',
        'm-1',
        expect.any(String)
      );
      expect(toastSpy).toHaveBeenCalledWith(
        'Заявку підтверджено та клієнта сповіщено!'
      );
    });
  });

  it('supports completing visit when appointment is confirmed', async () => {
    const completeSpy = vi
      .spyOn(adminService, 'completeAppointment')
      .mockResolvedValue({ success: true });
    const toastSpy = vi.fn();

    const confirmedAppt: AppointmentRequest = {
      ...mockRequests[0],
      id: 'req-confirmed',
      status: 'confirmed',
    };

    render(
      <RequestProcessingPage
        initialRequests={[confirmedAppt]}
        initialMasters={mockMasters}
        initialSelectedRequestId="req-confirmed"
        onToast={toastSpy}
      />
    );

    const completeBtn = screen.getByRole('button', {
      name: 'Позначити завершеним',
    });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(completeSpy).toHaveBeenCalledWith('req-confirmed');
      expect(toastSpy).toHaveBeenCalledWith('Візит успішно завершено!');
    });
  });

  it('calls rejectAppointment and fires toast on reject click', async () => {
    const rejectSpy = vi
      .spyOn(adminService, 'rejectAppointment')
      .mockResolvedValue({ success: true });
    const toastSpy = vi.fn();

    render(
      <RequestProcessingPage
        initialRequests={mockRequests}
        initialMasters={mockMasters}
        initialSelectedRequestId="req-1"
        onToast={toastSpy}
      />
    );

    const rejectBtn = screen.getByRole('button', { name: 'Відхилити заявку' });
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(rejectSpy).toHaveBeenCalledWith('req-1');
      expect(toastSpy).toHaveBeenCalledWith('Заявку відхилено');
    });
  });

  it('shows empty state when no requests match filter', () => {
    const requestsWithoutCompleted = mockRequests.filter(
      (r) => r.status !== 'completed'
    );
    render(
      <RequestProcessingPage
        initialRequests={requestsWithoutCompleted}
        initialMasters={mockMasters}
      />
    );

    const completedTab = screen.getByRole('tab', { name: 'Завершені' });
    fireEvent.click(completedTab);

    expect(screen.getByText('Немає заявок у цій категорії')).toBeDefined();
  });

  it('displays "Номер телефону не вказано" when request client phone is empty', () => {
    const noPhoneRequests: AppointmentRequest[] = [
      {
        ...mockRequests[0],
        id: 'req-no-phone',
        client: {
          ...mockRequests[0].client,
          phone: '',
        },
      },
    ];

    render(
      <RequestProcessingPage
        initialRequests={noPhoneRequests}
        initialMasters={mockMasters}
        initialSelectedRequestId="req-no-phone"
      />
    );

    expect(screen.getByText('Номер телефону не вказано')).toBeDefined();
    expect(screen.queryByRole('link', { name: /\+38/ })).toBeNull();
  });

  it('displays "Номер телефону не вказано" when request client phone has dummy +380000000 placeholder', () => {
    const placeholderPhoneRequests: AppointmentRequest[] = [
      {
        ...mockRequests[0],
        id: 'req-placeholder-phone',
        client: {
          ...mockRequests[0].client,
          phone: '+380000000',
        },
      },
    ];

    render(
      <RequestProcessingPage
        initialRequests={placeholderPhoneRequests}
        initialMasters={mockMasters}
        initialSelectedRequestId="req-placeholder-phone"
      />
    );

    expect(screen.getByText('Номер телефону не вказано')).toBeDefined();
    expect(screen.queryByText('+380000000')).toBeNull();
  });
});
