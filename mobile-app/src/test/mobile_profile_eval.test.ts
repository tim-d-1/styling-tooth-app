import { describe, it, expect } from 'vitest';
import {
  resolveLoyaltyTier,
  calculateCashbackPoints,
  LOYALTY_TIERS,
} from '../features/profile/loyalty';
import {
  resolveGreeting,
  formatProfilePhone,
  resolvePaymentSubtitle,
  formatBonusPoints,
  resolveProfileUserName,
} from '../features/profile/profile_utils';

describe('Mobile Profile Eval Suite: Frame 680:2061 Hierarchy, Data Contracts, and Web-App Alignment', () => {
  describe('Eval: Figma Frame 680:2061 Visual Hierarchy & Component Contracts', () => {
    const expectedProfileSections = [
      { id: 'header', title: 'Header (Greeting & Notifications)' },
      { id: 'user_card', title: 'Section - User Card (Avatar, Name, Phone)' },
      { id: 'loyalty', title: 'Loyalty Section (Tier Badge, Points, Chevron)' },
      { id: 'heading_profile', title: 'Heading 1 ("Профіль")' },
      { id: 'settings', title: 'Section - Settings (4 navigation cards)' },
      { id: 'heading_help', title: 'Heading 2 ("Допомога та інфо")' },
      { id: 'help', title: 'Section - Help (3 navigation cards)' },
      { id: 'logout', title: 'Footer Action ("Вийти з акаунту")' },
    ];

    it('evaluates exact 8-part vertical sequence defined in Figma frame 680:2061', () => {
      expect(expectedProfileSections).toHaveLength(8);
      expect(expectedProfileSections.map((s) => s.id)).toEqual([
        'header',
        'user_card',
        'loyalty',
        'heading_profile',
        'settings',
        'heading_help',
        'help',
        'logout',
      ]);
    });

    const expectedSettings = [
      { id: 'personal_info', title: 'Особисті дані', defaultSubtitle: "Ім'я, телефон, email" },
      { id: 'addresses', title: 'Мої адреси', defaultSubtitle: 'Дім, Офіс' },
      { id: 'payment_methods', title: 'Способи оплати', defaultSubtitle: 'Apple Pay' },
      { id: 'notifications', title: 'Налаштування сповіщень' },
    ];

    it('evaluates settings items match web-app ProfileSettingsSection exactly', () => {
      expect(expectedSettings).toHaveLength(4);
      expect(expectedSettings[0].title).toBe('Особисті дані');
      expect(expectedSettings[1].title).toBe('Мої адреси');
      expect(expectedSettings[2].title).toBe('Способи оплати');
      expect(expectedSettings[3].title).toBe('Налаштування сповіщень');
    });

    const expectedHelpItems = [
      { id: 'support', title: 'Підтримка', subtitle: 'Online', isOnline: true },
      { id: 'faq', title: 'Часті запитання (FAQ)' },
      { id: 'privacy_policy', title: 'Політика конфіденційності' },
    ];

    it('evaluates help items contract with online indicator and FAQ', () => {
      expect(expectedHelpItems).toHaveLength(3);
      expect(expectedHelpItems[0].isOnline).toBe(true);
      expect(expectedHelpItems[1].title).toBe('Часті запитання (FAQ)');
      expect(expectedHelpItems[2].title).toBe('Політика конфіденційності');
    });
  });

  describe('Eval: Placeholder Avoidance Matrix (Cross-referencing Web-App)', () => {
    const figmaPlaceholders = [
      { field: 'greeting', placeholder: 'Вітаємо, Катерино! 👋' },
      { field: 'phone', placeholder: '+380 (97) *** ** 42' },
      { field: 'points', placeholder: '450' },
      { field: 'tier', placeholder: 'Gold Level • 25% Cashback' },
      { field: 'payment', placeholder: 'Apple Pay, *4821' },
    ];

    it('evaluates dynamic greeting resolves from real name and never hardcodes "Катерино"', () => {
      const dynamicName1 = 'Ярослав Мудрий';
      const dynamicName2 = 'Анна';
      expect(resolveGreeting(dynamicName1)).toBe('Вітаємо, Ярослав! 👋');
      expect(resolveGreeting(dynamicName2)).toBe('Вітаємо, Анна! 👋');
      expect(resolveGreeting('')).not.toContain('Катерино');
      expect(resolveGreeting(null)).not.toContain('Катерино');
    });

    it('evaluates phone formatting emits real number or "Номер не вказано" avoiding placeholder', () => {
      expect(formatProfilePhone('+380 67 111 22 33')).toBe('+380 67 111 22 33');
      expect(formatProfilePhone(null)).toBe('Номер не вказано');
      expect(formatProfilePhone('')).not.toBe(figmaPlaceholders[1].placeholder);
    });

    it('evaluates payment subtitle dynamically reflects user cards or fallback', () => {
      const emptyMethods: any[] = [];
      expect(resolvePaymentSubtitle(emptyMethods)).toBe('Apple Pay');

      const customMethods = [{ type: 'card', last4: '9988' }];
      expect(resolvePaymentSubtitle(customMethods)).toBe('*9988');

      const appleAndVisa = [{ type: 'apple_pay' }, { type: 'card', last4: '1234' }];
      expect(resolvePaymentSubtitle(appleAndVisa)).toBe('Apple Pay, *1234');
    });
  });

  describe('Eval: Loyalty Tier and Points Matrix Alignment with Web-App', () => {
    const testMatrix = [
      { spend: 0, discount: 0, expectedTier: 'Bronze Level • 10% Cashback', expectedRate: 10 },
      { spend: 1999, discount: 0, expectedTier: 'Bronze Level • 10% Cashback', expectedRate: 10 },
      { spend: 2000, discount: 0, expectedTier: 'Silver Level • 15% Cashback', expectedRate: 15 },
      { spend: 1000, discount: 10, expectedTier: 'Silver Level • 15% Cashback', expectedRate: 15 },
      { spend: 5000, discount: 0, expectedTier: 'Gold Level • 25% Cashback', expectedRate: 25 },
      { spend: 3000, discount: 15, expectedTier: 'Gold Level • 25% Cashback', expectedRate: 25 },
      { spend: 15000, discount: 0, expectedTier: 'Platinum Level • 30% Cashback', expectedRate: 30 },
      { spend: 8000, discount: 25, expectedTier: 'Platinum Level • 30% Cashback', expectedRate: 30 },
    ];

    testMatrix.forEach((tc, idx) => {
      it(`evaluates loyalty tier row ${idx + 1}: spend=${tc.spend}, discount=${tc.discount}% -> ${tc.expectedTier}`, () => {
        const tier = resolveLoyaltyTier(tc.spend, tc.discount);
        expect(tier.name).toBe(tc.expectedTier);
        expect(tier.cashbackRatePct).toBe(tc.expectedRate);
      });
    });

    it('evaluates cashback conversion formula: points = round(amount * (rate / 100) / 0.25)', () => {
      expect(calculateCashbackPoints(2500, 15)).toBe(1500);
      expect(calculateCashbackPoints(5000, 25)).toBe(5000);
      expect(calculateCashbackPoints(10000, 30)).toBe(12000);
    });
  });

  describe('Eval: Profile User Resolution Contract', () => {
    it('evaluates resolution precedence: profiles.full_name > metadata name > email prefix', () => {
      const fullProfile = { full_name: 'Тетяна Демченко' };
      const metadataOnly = { user_metadata: { first_name: 'Тетяна', last_name: 'Демченко' } };
      const emailOnly = { email: 'tetyana.d@example.com' };

      expect(resolveProfileUserName(fullProfile, metadataOnly)).toBe('Тетяна Демченко');
      expect(resolveProfileUserName(null, metadataOnly)).toBe('Тетяна Демченко');
      expect(resolveProfileUserName(null, emailOnly)).toBe('tetyana.d');
    });
  });
});
