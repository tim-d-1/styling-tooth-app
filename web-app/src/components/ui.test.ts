import {
  Button,
  Switch,
  Checkbox,
  Rating,
  NotificationCard,
  FilterMenu,
  Input,
  AddressList,
  Icon,
  ClipMenu,
  NavTabs,
  Accordion,
  TransactionHistory,
  PaymentMethodsList,
  UserProfileCard,
  AddressTags,
  NotificationBell,
  Logo,
  SocialIcon,
} from './ui';

export function runComponentSuite(): boolean {
  const components = [
    Button,
    Switch,
    Checkbox,
    Rating,
    NotificationCard,
    FilterMenu,
    Input,
    AddressList,
    Icon,
    ClipMenu,
    NavTabs,
    Accordion,
    TransactionHistory,
    PaymentMethodsList,
    UserProfileCard,
    AddressTags,
    NotificationBell,
    Logo,
    SocialIcon,
  ];

  for (const component of components) {
    if (!component) {
      throw new Error('Component export missing');
    }
  }

  const mockAddressTags = [
    { id: 'home', label: 'Дім' },
    { id: 'office', label: 'Офіс' },
  ];
  if (mockAddressTags.length !== 2) {
    throw new Error('Address tags mock invalid');
  }

  const mockPaymentMethods = [
    { id: 'apple-pay', type: 'apple-pay' as const, title: 'Apple Pay', subtitle: 'Основний' },
  ];
  if (mockPaymentMethods.length !== 1) {
    throw new Error('Payment methods mock invalid');
  }

  const mockTransactions = [
    { id: '1', title: 'Грумінг', date: '18.07.2026', amount: 240, icon: 'fi-rr-paw', type: 'earned' as const },
  ];
  if (mockTransactions.length !== 1) {
    throw new Error('Transactions mock invalid');
  }

  return true;
}

runComponentSuite();
