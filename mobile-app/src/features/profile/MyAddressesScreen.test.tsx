import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MyAddressesScreen } from './MyAddressesScreen';
import { supabase } from '../../lib/supabase';

describe('MyAddressesScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders header, title, back and notifications buttons', () => {
    const handleBack = vi.fn();
    const handleNotification = vi.fn();

    render(
      <MyAddressesScreen
        onBack={handleBack}
        onNotificationPress={handleNotification}
      />
    );

    expect(screen.getByText('Мої Адреси')).toBeDefined();
    expect(screen.getByTestId('back-button')).toBeDefined();
    expect(screen.getByTestId('notifications-button')).toBeDefined();

    fireEvent.click(screen.getByTestId('back-button'));
    expect(handleBack).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('notifications-button'));
    expect(handleNotification).toHaveBeenCalledTimes(1);
  });

  it('renders pet taxi route map and address details section', () => {
    render(<MyAddressesScreen />);

    expect(screen.getByTestId('pet-taxi-map-card')).toBeDefined();
    expect(screen.getByTestId('address-details-heading')).toBeDefined();
    expect(screen.getByText('Деталі адреси')).toBeDefined();
    expect(
      screen.getByText('Для виклику Pet-таксі чи доставки косметики')
    ).toBeDefined();
  });

  it('handles address form inputs correctly', () => {
    render(
      <MyAddressesScreen
        initialAddress={{
          street: 'вул. Велика Васильківська, 20',
          apartment: '10',
          entranceFloor: '2 підїзд, 4 пов.',
        }}
      />
    );

    const streetInput = screen.getByTestId('address-street-input') as HTMLInputElement;
    const aptInput = screen.getByTestId('address-apartment-input') as HTMLInputElement;
    const entranceInput = screen.getByTestId('address-entrance-floor-input') as HTMLInputElement;

    expect(streetInput.value).toBe('вул. Велика Васильківська, 20');
    expect(aptInput.value).toBe('10');
    expect(entranceInput.value).toBe('2 підїзд, 4 пов.');

    fireEvent.change(streetInput, {
      target: { value: 'вул. Хрещатик, 22' },
    });
    expect(streetInput.value).toBe('вул. Хрещатик, 22');

    fireEvent.change(aptInput, { target: { value: '15' } });
    expect(aptInput.value).toBe('15');
  });

  it('switches address labels and adds a new custom label', () => {
    render(<MyAddressesScreen />);

    const officePill = screen.getByTestId('address-label-pill-Офіс');
    fireEvent.click(officePill);

    const addLabelBtn = screen.getByTestId('address-add-label-button');
    fireEvent.click(addLabelBtn);

    const newLabelInput = screen.getByTestId('new-label-input');
    fireEvent.change(newLabelInput, { target: { value: 'Дача' } });

    const confirmBtn = screen.getByTestId('confirm-add-label-button');
    fireEvent.click(confirmBtn);

    expect(screen.getByTestId('address-label-pill-Дача')).toBeDefined();
    expect(screen.getByText('🌿 Дача')).toBeDefined();
  });

  it('toggles transfer checkbox state', () => {
    render(
      <MyAddressesScreen
        initialAddress={{
          street: 'вул. Саксаганського, 10',
          isDefaultTransfer: false,
        }}
      />
    );

    const checkbox = screen.getByTestId('address-default-transfer-checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(checkbox);
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  });

  it('shows error banner when trying to submit invalid empty address', async () => {
    render(<MyAddressesScreen initialAddress={{ street: '' }} />);

    const submitBtn = screen.getByTestId('select-address-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByTestId('address-error-banner')).toBeDefined();
    expect(
      screen.getByText('Будь ласка, вкажіть вулицю та номер будинку')
    ).toBeDefined();
  });

  it('saves valid address to supabase, calls callbacks and shows toast', async () => {
    const handleSelect = vi.fn();
    const handleToast = vi.fn();
    const handleBack = vi.fn();

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-addr-123',
            user_metadata: {},
          },
        } as any,
      },
      error: null,
    });

    const updateSpy = vi
      .spyOn(supabase.auth, 'updateUser')
      .mockResolvedValue({ data: { user: {} as any }, error: null });

    render(
      <MyAddressesScreen
        initialAddress={{
          street: 'вул. Шота Руставелі, 14',
          apartment: '5',
          entranceFloor: '1 пов.',
          label: 'Дім',
          isDefaultTransfer: true,
        }}
        onSelectAddress={handleSelect}
        onToast={handleToast}
        onBack={handleBack}
      />
    );

    const submitBtn = screen.getByTestId('select-address-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(updateSpy).toHaveBeenCalledWith({
      data: {
        address: expect.objectContaining({
          street: 'вул. Шота Руставелі, 14',
          apartment: '5',
          entranceFloor: '1 пов.',
          label: 'Дім',
          isDefaultTransfer: true,
        }),
        addresses: [
          expect.objectContaining({
            street: 'вул. Шота Руставелі, 14',
          }),
        ],
      },
    });

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        street: 'вул. Шота Руставелі, 14',
      })
    );
    expect(handleToast).toHaveBeenCalledWith('Адресу успішно збережено');
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
