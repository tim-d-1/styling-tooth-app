import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MyAddressesScreen } from '../features/profile/MyAddressesScreen';
import { MainScreen } from '../features/dashboard/MainScreen';
import {
  isFigmaAddressPlaceholder,
  sanitizeUserAddress,
  formatAddressDisplay,
  resolveAddressLabelBadge,
  validateUserAddress,
} from '../features/profile/addresses_utils';
import { supabase } from '../lib/supabase';

describe('Mobile Addresses Tab Eval Suite (Figma Frame 680:3103 & Web-App Parity)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Eval 1: Figma Frame 680:3103 Layout Contract Verification', () => {
    it('evaluates header and map banner matching Frame 680:3103 specifications', () => {
      render(<MyAddressesScreen />);

      expect(screen.getByTestId('addresses-header')).toBeDefined();
      expect(screen.getByText('Мої Адреси')).toBeDefined();
      expect(screen.getByTestId('back-button')).toBeDefined();
      expect(screen.getByTestId('notifications-button')).toBeDefined();
      expect(screen.getByTestId('pet-taxi-map-card')).toBeDefined();
    });

    it('evaluates form controls and action button matching Figma 680:3103', () => {
      render(<MyAddressesScreen />);

      expect(screen.getByTestId('address-details-heading')).toHaveTextContent(
        'Деталі адреси'
      );
      expect(screen.getByTestId('address-details-subtitle')).toHaveTextContent(
        'Для виклику Pet-таксі чи доставки косметики'
      );

      expect(screen.getByTestId('address-street-input')).toBeDefined();
      expect(screen.getByTestId('address-apartment-input')).toBeDefined();
      expect(screen.getByTestId('address-entrance-floor-input')).toBeDefined();

      expect(screen.getByTestId('address-label-heading')).toHaveTextContent(
        'Назва адреси:'
      );
      expect(screen.getByTestId('address-label-pill-Дім')).toBeDefined();
      expect(screen.getByTestId('address-label-pill-Офіс')).toBeDefined();
      expect(screen.getByTestId('address-add-label-button')).toBeDefined();

      expect(screen.getByTestId('address-default-transfer-checkbox')).toBeDefined();
      expect(screen.getByTestId('select-address-button')).toHaveTextContent(
        'Обрати адресу'
      );
    });
  });

  describe('Eval 2: Anti-Placeholder & Fallback Contract', () => {
    it('evaluates that Figma design dummy address is identified and not stored as real state', () => {
      expect(
        isFigmaAddressPlaceholder({
          street: 'вул. Хрещатик, 15',
          apartment: '42',
        })
      ).toBe(true);

      expect(
        isFigmaAddressPlaceholder({
          street: 'вул. Богдана Хмельницького, 30',
          apartment: '14',
        })
      ).toBe(false);
    });

    it('evaluates clean empty state when no prior user address exists', () => {
      render(<MyAddressesScreen />);

      const streetInput = screen.getByTestId('address-street-input') as HTMLInputElement;
      const aptInput = screen.getByTestId('address-apartment-input') as HTMLInputElement;
      const entranceInput = screen.getByTestId('address-entrance-floor-input') as HTMLInputElement;

      expect(streetInput.value).toBe('');
      expect(aptInput.value).toBe('');
      expect(entranceInput.value).toBe('');
      expect(streetInput.placeholder).toBe('Введіть вулицю та будинок');
    });

    it('evaluates formatAddressDisplay provides clean fallback', () => {
      expect(formatAddressDisplay(null)).toBe('Дім, Офіс');
      expect(formatAddressDisplay({ street: '' })).toBe('Дім, Офіс');
      expect(
        formatAddressDisplay({
          street: 'вул. Лесі Українки, 10',
          apartment: '12',
          label: 'Дім',
        })
      ).toBe('Дім: вул. Лесі Українки, 10, кв. 12');
    });
  });

  describe('Eval 3: Dynamic Label Management & Badging Contract', () => {
    it('evaluates resolving label badge with emoji matching web-app', () => {
      expect(resolveAddressLabelBadge('Дім')).toBe('🏡 Дім');
      expect(resolveAddressLabelBadge('Офіс')).toBe('💼 Офіс');
      expect(resolveAddressLabelBadge('Дача')).toBe('🌿 Дача');
      expect(resolveAddressLabelBadge('Батьківський дім')).toBe('📍 Батьківський дім');
    });

    it('evaluates adding a custom label adds pill and selects it', () => {
      render(<MyAddressesScreen />);

      const addBtn = screen.getByTestId('address-add-label-button');
      fireEvent.click(addBtn);

      const input = screen.getByTestId('new-label-input');
      fireEvent.change(input, { target: { value: 'Студія' } });

      const confirmBtn = screen.getByTestId('confirm-add-label-button');
      fireEvent.click(confirmBtn);

      expect(screen.getByTestId('address-label-pill-Студія')).toBeDefined();
      expect(screen.getByText('📍 Студія')).toBeDefined();
    });
  });

  describe('Eval 4: Supabase User Metadata Parity & Validation Contract', () => {
    it('evaluates validation prevents saving empty street', async () => {
      render(<MyAddressesScreen initialAddress={{ street: '  ' }} />);

      const submit = screen.getByTestId('select-address-button');
      await act(async () => {
        fireEvent.click(submit);
      });

      expect(screen.getByTestId('address-error-banner')).toBeDefined();
      expect(
        screen.getByText('Будь ласка, вкажіть вулицю та номер будинку')
      ).toBeDefined();
    });

    it('evaluates validation utility handles edge cases', () => {
      expect(validateUserAddress({ street: '' }).isValid).toBe(false);
      expect(validateUserAddress({ street: 'ab' }).isValid).toBe(false);
      expect(validateUserAddress({ street: 'вул. Подолу, 1' }).isValid).toBe(true);
    });

    it('evaluates saving persists address into Supabase user_metadata', async () => {
      const handleSelect = vi.fn();
      const handleToast = vi.fn();

      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            user: { id: 'eval-user-456' },
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
            street: 'вул. Золотоворітська, 6',
            apartment: '3',
            entranceFloor: '2 підїзд',
            label: 'Офіс',
            isDefaultTransfer: true,
          }}
          onSelectAddress={handleSelect}
          onToast={handleToast}
        />
      );

      const submit = screen.getByTestId('select-address-button');
      await act(async () => {
        fireEvent.click(submit);
      });

      expect(updateSpy).toHaveBeenCalledWith({
        data: {
          address: expect.objectContaining({
            street: 'вул. Золотоворітська, 6',
            apartment: '3',
            entranceFloor: '2 підїзд',
            label: 'Офіс',
            isDefaultTransfer: true,
          }),
          addresses: [
            expect.objectContaining({
              street: 'вул. Золотоворітська, 6',
            }),
          ],
        },
      });

      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          street: 'вул. Золотоворітська, 6',
        })
      );
      expect(handleToast).toHaveBeenCalledWith('Адресу успішно збережено');
    });
  });

  describe('Eval 5: Integration with MainScreen Navigation Flow', () => {
    it('evaluates navigating from profile tab into MyAddressesScreen and returning back', async () => {
      render(
        <MainScreen
          initialTab="profile"
          userEmail="user@example.com"
        />
      );

      const addressSetting = screen.getByTestId('setting-item-addresses');
      expect(addressSetting).toBeDefined();

      await act(async () => {
        fireEvent.click(addressSetting);
      });

      expect(screen.getByTestId('my-addresses-screen')).toBeDefined();
      expect(screen.getByText('Деталі адреси')).toBeDefined();

      const backBtn = screen.getByTestId('back-button');
      await act(async () => {
        fireEvent.click(backBtn);
      });

      expect(screen.getByTestId('profile-tab-content')).toBeDefined();
    });

    it('evaluates rendering directly to addresses subscreen via initialProfileSubScreen', () => {
      render(
        <MainScreen
          initialTab="profile"
          initialProfileSubScreen="addresses"
          userEmail="user@example.com"
        />
      );

      expect(screen.getByTestId('my-addresses-screen')).toBeDefined();
      expect(screen.getByText('Мої Адреси')).toBeDefined();
    });
  });
});
