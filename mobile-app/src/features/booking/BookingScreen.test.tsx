import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BookingScreen } from './BookingScreen';
import { supabase } from '../../lib/supabase';
import { DEMO_PETS } from './booking_types';

describe('BookingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'client-uuid-1',
            email: 'maria@example.com',
          },
        },
      },
      error: null,
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'pets') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'pet-1', name: 'Барон', species: 'dog', breed: 'Йорк' },
            ],
            error: null,
          }),
        };
      }
      if (table === 'services') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: '50000000-0000-0000-0000-000000000001',
                name: 'Експрес-грумінг',
                description: 'Швидкий догляд',
                price: 850,
                duration_min: 75,
              },
              {
                id: '50000000-0000-0000-0000-000000000002',
                name: 'SPA-комплекс',
                description: 'Розслаблюючий догляд',
                price: 700,
                duration_min: 60,
              },
            ],
            error: null,
          }),
        };
      }
      if (table === 'masters') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'master-1',
                display_name: 'Олена Петренко',
                specialization: 'Топ-грумер',
                avatar_url: null,
                bio: 'Стрижка собак',
              },
            ],
            error: null,
          }),
        };
      }
      if (table === 'appointments') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null, data: [{ id: 'appt-1' }] }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
    });

    if (typeof supabase.rpc === 'function') {
      (supabase.rpc as any).mockImplementation((name: string) => {
        if (name === 'get_available_slots_multi_service' || name === 'get_available_slots') {
          return Promise.resolve({
            data: [{ slot_start: '2026-08-11T16:00:00Z', slot_end: '2026-08-11T18:15:00Z' }],
            error: null,
          });
        }
        if (name === 'create_multi_service_appointment') {
          return Promise.resolve({
            data: { id: 'multi-appt-1' },
            error: null,
          });
        }
        return Promise.resolve({
          data: { id: 'appt-1' },
          error: null,
        });
      });
    }
  });

  it('renders step 1 (pet) and displays pets with add pet button', async () => {
    render(<BookingScreen initialPets={DEMO_PETS} />);

    expect(screen.getByTestId('booking-screen')).toBeInTheDocument();
    expect(screen.getByText('Оберіть улюбленця')).toBeInTheDocument();
    expect(screen.getByTestId('booking-add-pet-button')).toBeInTheDocument();
    expect(screen.getByText('Барон')).toBeInTheDocument();
    expect(screen.getByText('Альфа')).toBeInTheDocument();
    expect(screen.getByTestId('booking-progress-bar')).toBeInTheDocument();
  });

  it('calls onNavigateAddPet when add pet card is pressed', () => {
    const onNavigateAddPet = vi.fn();
    render(<BookingScreen onNavigateAddPet={onNavigateAddPet} />);

    fireEvent.click(screen.getByTestId('booking-add-pet-button'));
    expect(onNavigateAddPet).toHaveBeenCalledTimes(1);
  });

  it('navigates through complete 7-stage flow from pet to payment', async () => {
    const onComplete = vi.fn();
    render(<BookingScreen onComplete={onComplete} initialPets={DEMO_PETS} />);

    expect(screen.getByTestId('step-pet')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('pet-card-p-baron'));
    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-procedure')).toBeInTheDocument();
    expect(screen.getByText('Обери процедуру')).toBeInTheDocument();
    expect(screen.queryByTestId('procedure-detail-card')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-master')).toBeInTheDocument();
    expect(screen.getByText('Вибір майстра')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('choose-any-master'));
    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-datetime')).toBeInTheDocument();
    expect(screen.getByText('Дата та час')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('time-slot-16:00'));
    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-remarks')).toBeInTheDocument();
    expect(screen.getByText('Додаткові побажання')).toBeInTheDocument();

    const commentInput = screen.getByTestId('remarks-comment-input');
    fireEvent.change(commentInput, { target: { value: 'Дуже ніжний песик' } });

    const transferSwitch = screen.getByTestId('transfer-switch');
    fireEvent.click(transferSwitch);

    await waitFor(() => {
      expect(screen.getByTestId('remarks-address-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('remarks-address-input'), {
      target: { value: 'вул. Хрещатик, 1' },
    });

    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-confirmation')).toBeInTheDocument();
    expect(screen.getByText('Деталі запису')).toBeInTheDocument();
    expect(screen.getByText('Барон')).toBeInTheDocument();
    expect(screen.getByText('100 ₴')).toBeInTheDocument();
    expect(screen.getByText('950 ₴')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-booking-button'));

    expect(screen.getByTestId('step-payment')).toBeInTheDocument();
    expect(screen.getByText('Способи оплати')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-method-apple-pay')).not.toBeInTheDocument();
    expect(screen.getByTestId('payment-method-card')).toBeInTheDocument();
    expect(screen.getByTestId('payment-method-cash')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit-payment-button'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('supports editing a step from confirmation and returning directly back to confirmation', () => {
    render(<BookingScreen initialStage="confirmation" initialPets={DEMO_PETS} />);

    expect(screen.getByTestId('step-confirmation')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-pet-button'));
    expect(screen.getByTestId('step-pet')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pet-card-p-alfa'));
    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-confirmation')).toBeInTheDocument();
    expect(screen.getByText('Альфа')).toBeInTheDocument();
  });

  it('navigates back to previous steps or calls onBack from pet step', () => {
    const onBack = vi.fn();
    render(<BookingScreen onBack={onBack} initialPets={DEMO_PETS} />);

    fireEvent.click(screen.getByTestId('booking-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('loads real user pets and displays pet avatar image from pet_media', async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'pets') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'pet-avatar-test', name: 'Рекс', species: 'dog', breed: 'Вівчарка' },
            ],
            error: null,
          }),
        };
      }
      if (table === 'pet_media') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'pm-rexs',
                pet_id: 'pet-avatar-test',
                storage_path: 'pet-avatar-test/rexs.jpg',
                photo_type: 'general',
              },
            ],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
    });

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://supabase.co/signed/pet-avatar-test/rexs.jpg?token=abc' },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as never);

    render(<BookingScreen />);

    await waitFor(() => {
      expect(screen.getByText('Рекс')).toBeInTheDocument();
      const petCard = screen.getByTestId('pet-card-pet-avatar-test');
      const img = petCard.querySelector('img');
      expect(img).not.toBeNull();
      expect(img?.src).toBe('https://supabase.co/signed/pet-avatar-test/rexs.jpg?token=abc');
    });
  });

  it('opens procedure bottom sheet modal on click and advances on Записатись', async () => {
    render(<BookingScreen initialStage="procedure" initialPets={DEMO_PETS} />);

    expect(screen.getByTestId('step-procedure')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('procedure-option-express-grooming'));

    await waitFor(() => {
      expect(screen.getByTestId('procedure-modal-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('modal-select-procedure-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('modal-select-procedure-button'));

    await waitFor(() => {
      expect(screen.getByTestId('step-master')).toBeInTheDocument();
    });
  });

  it('renders completed screen with success message and navigates via actions', () => {
    const onComplete = vi.fn();
    render(<BookingScreen initialStage="completed" onComplete={onComplete} />);

    expect(screen.getByTestId('step-completed')).toBeInTheDocument();
    expect(screen.getByText('Запис підтверджено!')).toBeInTheDocument();
    expect(
      screen.getByText(/За 24 години до візиту ми/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('view-booking-button'));
    expect(onComplete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('go-home-button'));
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('renders bottom bar tied to bottom across stages 1 to 5, and hides on confirmation and payment', () => {
    const { rerender } = render(<BookingScreen initialStage="pet" initialPets={DEMO_PETS} />);

    expect(screen.getByTestId('booking-bottom-bar')).toBeInTheDocument();
    expect(screen.getByTestId('next-step-button')).toBeInTheDocument();
    expect(screen.getByTestId('booking-progress-bar')).toBeInTheDocument();

    rerender(<BookingScreen initialStage="procedure" initialPets={DEMO_PETS} />);
    expect(screen.getByTestId('booking-bottom-bar')).toBeInTheDocument();

    rerender(<BookingScreen initialStage="master" initialPets={DEMO_PETS} />);
    expect(screen.getByTestId('booking-bottom-bar')).toBeInTheDocument();

    rerender(<BookingScreen initialStage="datetime" initialPets={DEMO_PETS} />);
    expect(screen.getByTestId('booking-bottom-bar')).toBeInTheDocument();

    rerender(<BookingScreen initialStage="remarks" initialPets={DEMO_PETS} />);
    expect(screen.getByTestId('booking-bottom-bar')).toBeInTheDocument();

    rerender(<BookingScreen initialStage="confirmation" initialPets={DEMO_PETS} />);
    expect(screen.queryByTestId('booking-bottom-bar')).not.toBeInTheDocument();

    rerender(<BookingScreen initialStage="payment" initialPets={DEMO_PETS} />);
    expect(screen.queryByTestId('booking-bottom-bar')).not.toBeInTheDocument();
  });

  it('does not render procedure description on 2nd page, keeping it only in modal window', async () => {
    render(<BookingScreen initialStage="procedure" initialPets={DEMO_PETS} />);

    expect(screen.getByTestId('step-procedure')).toBeInTheDocument();
    expect(screen.queryByTestId('procedure-detail-card')).not.toBeInTheDocument();

    const procedureCard = await screen.findByTestId(
      'procedure-option-50000000-0000-0000-0000-000000000001',
    );
    expect(screen.queryByText('Швидкий догляд')).not.toBeInTheDocument();

    fireEvent.click(procedureCard);

    await waitFor(() => {
      expect(screen.getByTestId('procedure-modal-sheet')).toBeInTheDocument();
      expect(screen.getByText('Швидкий догляд')).toBeInTheDocument();
    });
  });

  it('handles multi-service booking flow and invokes create_multi_service_appointment RPC', async () => {
    const onComplete = vi.fn();
    const rpcSpy = vi.spyOn(supabase, 'rpc');

    render(<BookingScreen initialStage="procedure" initialPets={DEMO_PETS} onComplete={onComplete} />);

    expect(screen.getByTestId('step-procedure')).toBeInTheDocument();

    const firstCard = await screen.findByTestId('procedure-option-50000000-0000-0000-0000-000000000001');
    fireEvent.click(firstCard);

    await waitFor(() => {
      expect(screen.getByTestId('procedure-modal-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('modal-add-procedure-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('modal-add-procedure-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('procedure-modal-sheet')).not.toBeInTheDocument();
      expect(screen.getByTestId('step-procedure')).toBeInTheDocument();
    });

    const secondCard = await screen.findByTestId('procedure-option-50000000-0000-0000-0000-000000000002');
    fireEvent.click(secondCard);

    await waitFor(() => {
      expect(screen.getByTestId('procedure-modal-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('modal-select-procedure-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('modal-select-procedure-button'));

    await waitFor(() => {
      expect(screen.getByTestId('step-master')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('choose-any-master'));
    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-datetime')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('time-slot-16:00'));
    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-remarks')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('next-step-button'));

    expect(screen.getByTestId('step-confirmation')).toBeInTheDocument();
    expect(screen.getByText('Обрані процедури')).toBeInTheDocument();
    expect(screen.getByTestId('multi-service-summary-list')).toBeInTheDocument();
    expect(screen.getByText('Перелік послуг (2):')).toBeInTheDocument();
    expect(screen.getAllByText('1550 ₴').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByTestId('confirm-booking-button'));

    expect(screen.getByTestId('step-payment')).toBeInTheDocument();
    expect(screen.getByText('Вартість послуг')).toBeInTheDocument();
    expect(screen.getByTestId('submit-payment-button')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit-payment-button'));

    await waitFor(() => {
      expect(rpcSpy).toHaveBeenCalledWith(
        'create_multi_service_appointment',
        expect.objectContaining({
          p_service_ids: [
            '50000000-0000-0000-0000-000000000001',
            '50000000-0000-0000-0000-000000000002',
          ],
          p_source: 'mobile',
        }),
      );
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('supports deselecting an already selected procedure by clicking its card', async () => {
    render(<BookingScreen initialStage="procedure" initialPets={DEMO_PETS} />);

    const firstCard = await screen.findByTestId('procedure-option-50000000-0000-0000-0000-000000000001');
    fireEvent.click(firstCard);

    await waitFor(() => {
      expect(screen.getByTestId('procedure-modal-sheet')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('modal-add-procedure-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('procedure-modal-sheet')).not.toBeInTheDocument();
      const card = screen.getByTestId('procedure-option-50000000-0000-0000-0000-000000000001');
      expect(card.getAttribute('aria-checked')).toBe('true');
    });

    const cardToDeselect = screen.getByTestId('procedure-option-50000000-0000-0000-0000-000000000001');
    fireEvent.click(cardToDeselect);

    await waitFor(() => {
      const card = screen.getByTestId('procedure-option-50000000-0000-0000-0000-000000000001');
      expect(card.getAttribute('aria-checked')).toBe('false');
      expect(screen.queryByTestId('procedure-modal-sheet')).not.toBeInTheDocument();
    });
  });

  it('disables next button when all procedures are deselected', async () => {
    render(<BookingScreen initialStage="procedure" initialPets={DEMO_PETS} />);

    const firstCard = await screen.findByTestId('procedure-option-50000000-0000-0000-0000-000000000001');
    fireEvent.click(firstCard);

    await waitFor(() => {
      expect(screen.getByTestId('procedure-modal-sheet')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('modal-add-procedure-button'));

    await waitFor(() => {
      const card = screen.getByTestId('procedure-option-50000000-0000-0000-0000-000000000001');
      expect(card.getAttribute('aria-checked')).toBe('true');
    });

    const cardToDeselect = screen.getByTestId('procedure-option-50000000-0000-0000-0000-000000000001');
    fireEvent.click(cardToDeselect);

    await waitFor(() => {
      const card = screen.getByTestId('procedure-option-50000000-0000-0000-0000-000000000001');
      expect(card.getAttribute('aria-checked')).toBe('false');
      const nextBtn = screen.getByTestId('next-step-button');
      expect(nextBtn.getAttribute('aria-disabled')).toBe('true');
    });
  });
});
