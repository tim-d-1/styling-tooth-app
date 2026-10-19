import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingPaymentStep from './BookingPaymentStep';

describe('BookingPaymentStep', () => {
  it('renders payment method options including in-salon cash payment', () => {
    render(
      <BookingPaymentStep
        totalAmount={1550}
        onPay={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Способи оплати' })).toBeDefined();
    expect(screen.getByText('Банківська картка')).toBeDefined();
    expect(screen.getByText('Оплата в салоні')).toBeDefined();
    expect(screen.getByText('Готівкою або карткою на ресепшені після візиту')).toBeDefined();
  });

  it('selects cash in-salon payment and submits with method cash', () => {
    const handlePay = vi.fn();

    render(
      <BookingPaymentStep
        totalAmount={1550}
        onPay={handlePay}
      />
    );

    const cashCard = screen.getByText('Оплата в салоні');
    fireEvent.click(cashCard);

    const submitBtn = screen.getByRole('button', {
      name: /Записатися та оплатити в салоні/i,
    });
    expect(submitBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(submitBtn);
    expect(handlePay).toHaveBeenCalledWith({ method: 'cash' });
  });

  it('validates new card input fields before enabling submit button', () => {
    const handlePay = vi.fn();

    render(
      <BookingPaymentStep
        totalAmount={1200}
        onPay={handlePay}
      />
    );

    const cardInput = screen.getByLabelText(/Номер картки/i);
    const expiryInput = screen.getByLabelText(/Термін/i);
    const cvvInput = screen.getByLabelText(/CVV/i);

    fireEvent.change(cardInput, { target: { value: '4111 2222 3333 4444' } });
    fireEvent.change(expiryInput, { target: { value: '08/28' } });
    fireEvent.change(cvvInput, { target: { value: '123' } });

    const submitBtn = screen.getByRole('button', { name: /Оплатити/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(submitBtn);
    expect(handlePay).toHaveBeenCalledWith({
      method: 'new_card',
      cardDetails: {
        cardNumber: '4111222233334444',
        expiry: '08/28',
        cvv: '123',
        saveCard: true,
      },
    });
  });

  it('allows paying with a saved card when available', () => {
    const handlePay = vi.fn();
    const mockSavedCards = [
      { id: 'sc-1', last4: '9876', expiry: '11/27' },
    ];

    render(
      <BookingPaymentStep
        totalAmount={850}
        onPay={handlePay}
        initialSavedCards={mockSavedCards}
      />
    );

    expect(screen.getByText('•••• 9876')).toBeDefined();
    const submitBtn = screen.getByRole('button', { name: /Оплатити/i });
    fireEvent.click(submitBtn);

    expect(handlePay).toHaveBeenCalledWith({ method: 'card' });
  });
});
