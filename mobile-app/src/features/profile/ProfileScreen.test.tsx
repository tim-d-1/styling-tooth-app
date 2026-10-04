import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ProfileScreen } from './ProfileScreen';
import { supabase } from '../../lib/supabase';

describe('ProfileScreen', () => {
  const mockUser = {
    name: 'Катерина Шевченко',
    phone: '+380 97 123 45 67',
    email: 'kateryna@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    loyaltyTier: 'Gold Level • 25% Cashback',
    bonusPoints: 450,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'client-user-1',
            email: 'maria@example.com',
            user_metadata: {
              first_name: 'Марія',
              last_name: 'Франко',
              payment_methods: [{ type: 'apple_pay' }, { type: 'card', last4: '7788' }],
            },
          },
        },
      },
      error: null,
    });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              full_name: 'Марія Франко',
              phone: '+380 50 999 88 77',
              discount_pct: 15,
            },
            error: null,
          }),
        };
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });
  });

  it('renders complete profile screen matching Figma frame 680:2061 hierarchy', () => {
    render(<ProfileScreen initialUser={mockUser} />);

    expect(screen.getByTestId('profile-tab-content')).toBeInTheDocument();
    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('profile-greeting-text')).toHaveTextContent(
      'Вітаємо, Катерина! 👋'
    );
    expect(
      screen.getByTestId('profile-notifications-button')
    ).toBeInTheDocument();

    expect(screen.getByTestId('profile-user-card')).toBeInTheDocument();
    expect(screen.getByTestId('profile-user-name')).toHaveTextContent(
      'Катерина Шевченко'
    );
    expect(screen.getByTestId('profile-user-phone')).toHaveTextContent(
      '+380 97 123 45 67'
    );
    expect(screen.getByTestId('profile-avatar-image')).toBeInTheDocument();

    expect(screen.getByTestId('profile-loyalty-section')).toBeInTheDocument();
    expect(screen.getByTestId('profile-loyalty-tier')).toHaveTextContent(
      'Gold Level • 25% Cashback'
    );
    expect(screen.getByTestId('profile-bonus-points')).toHaveTextContent('450');
    expect(screen.getByText('бонусів')).toBeInTheDocument();

    expect(screen.getByTestId('heading-profile')).toHaveTextContent('Профіль');
    expect(screen.getByTestId('setting-item-personal_info')).toBeInTheDocument();
    expect(screen.getByText('Особисті дані')).toBeInTheDocument();
    expect(screen.getByText("Ім'я, телефон, email")).toBeInTheDocument();

    expect(screen.getByTestId('setting-item-addresses')).toBeInTheDocument();
    expect(screen.getByText('Мої адреси')).toBeInTheDocument();
    expect(screen.getByText('Дім, Офіс')).toBeInTheDocument();

    expect(screen.getByTestId('setting-item-payment_methods')).toBeInTheDocument();
    expect(screen.getByText('Способи оплати')).toBeInTheDocument();

    expect(screen.getByTestId('setting-item-notifications')).toBeInTheDocument();
    expect(screen.getByText('Налаштування сповіщень')).toBeInTheDocument();

    expect(screen.getByTestId('heading-help')).toHaveTextContent('Допомога та інфо');
    expect(screen.getByTestId('setting-item-support')).toBeInTheDocument();
    expect(screen.getByText('Підтримка')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByTestId('support-online-badge')).toBeInTheDocument();

    expect(screen.getByTestId('setting-item-faq')).toBeInTheDocument();
    expect(screen.getByText('Часті запитання (FAQ)')).toBeInTheDocument();

    expect(screen.getByTestId('setting-item-privacy_policy')).toBeInTheDocument();
    expect(screen.getByText('Політика конфіденційності')).toBeInTheDocument();

    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    expect(screen.getByText('Вийти з акаунту')).toBeInTheDocument();
  });

  it('renders fallback avatar and "Номер не вказано" when user lacks avatar and phone', () => {
    const userWithoutPhone = {
      name: 'Іван',
      phone: '',
      avatarUrl: null,
      loyaltyTier: 'Bronze Level • 10% Cashback',
      bonusPoints: 0,
    };
    render(<ProfileScreen initialUser={userWithoutPhone} />);

    expect(screen.getByTestId('profile-default-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('profile-user-phone')).toHaveTextContent(
      'Номер не вказано'
    );
  });

  it('calls onLogout when logout button is pressed', () => {
    const onLogout = vi.fn();
    render(<ProfileScreen initialUser={mockUser} onLogout={onLogout} />);

    fireEvent.click(screen.getByTestId('logout-button'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onLoyaltyPress when loyalty section is clicked', () => {
    const onLoyaltyPress = vi.fn();
    render(
      <ProfileScreen initialUser={mockUser} onLoyaltyPress={onLoyaltyPress} />
    );

    fireEvent.click(screen.getByTestId('loyalty-card-button'));
    expect(onLoyaltyPress).toHaveBeenCalledTimes(1);
  });

  it('calls settings and help callbacks when clicked', () => {
    const onPersonalInfoPress = vi.fn();
    const onAddressesPress = vi.fn();
    const onPaymentMethodsPress = vi.fn();
    const onNotificationsSettingsPress = vi.fn();
    const onSupportPress = vi.fn();
    const onFaqPress = vi.fn();
    const onPrivacyPolicyPress = vi.fn();

    render(
      <ProfileScreen
        initialUser={mockUser}
        onPersonalInfoPress={onPersonalInfoPress}
        onAddressesPress={onAddressesPress}
        onPaymentMethodsPress={onPaymentMethodsPress}
        onNotificationsSettingsPress={onNotificationsSettingsPress}
        onSupportPress={onSupportPress}
        onFaqPress={onFaqPress}
        onPrivacyPolicyPress={onPrivacyPolicyPress}
      />
    );

    fireEvent.click(screen.getByTestId('setting-item-personal_info'));
    expect(onPersonalInfoPress).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('setting-item-addresses'));
    expect(onAddressesPress).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('setting-item-payment_methods'));
    expect(onPaymentMethodsPress).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('setting-item-notifications'));
    expect(onNotificationsSettingsPress).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('setting-item-support'));
    expect(onSupportPress).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('setting-item-faq'));
    expect(onFaqPress).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('setting-item-privacy_policy'));
    expect(onPrivacyPolicyPress).toHaveBeenCalledTimes(1);
  });

  it('fetches profile data from Supabase and avoids static Figma placeholders', async () => {
    render(<ProfileScreen userEmail="maria@example.com" />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-greeting-text')).toHaveTextContent(
        'Вітаємо, Марія! 👋'
      );
      expect(screen.getByTestId('profile-user-name')).toHaveTextContent(
        'Марія Франко'
      );
      expect(screen.getByTestId('profile-user-phone')).toHaveTextContent(
        '+380 50 999 88 77'
      );
    });

    expect(screen.queryByText('+380 (97) *** ** 42')).not.toBeInTheDocument();
  });
});
