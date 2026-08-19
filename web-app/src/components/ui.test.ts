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

  return true;
}

runComponentSuite();
