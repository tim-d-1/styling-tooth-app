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
} from './components/ui';

export default function App() {
  return (
    <div>
      <Button variant="primary">Далі</Button>
      <Button variant="outline">Додати нового улюбленця</Button>
      <Button variant="secondary">Ні, залишити</Button>
      <Button variant="ghost">Так, скасувати</Button>

      <Switch checked={true} onChange={() => {}} />
      <Switch checked={false} onChange={() => {}} />

      <Checkbox checked={true} onChange={() => {}} />
      <Checkbox checked={false} onChange={() => {}} />

      <Rating value={1} />
      <Rating value={2} />
      <Rating value={3} />
      <Rating value={4} />
      <Rating value={5} />

      <ClipMenu />

      <NotificationCard
        title="Обробка від кліщів"
        message="Через 14 днів настає термін обробки препаратом Bravecto для Барона."
        timeAgo="10 хв тому"
        unread={true}
      />
      <NotificationCard
        title="Обробка від кліщів"
        message="Через 14 днів настає термін обробки препаратом Bravecto для Барона."
        timeAgo="10 хв тому"
        unread={false}
        read={true}
      />
      <NotificationCard
        title="Обробка від кліщів"
        message="Через 14 днів настає термін обробки препаратом Bravecto для Барона."
        timeAgo="10 хв тому"
        compact={true}
      />

      <NotificationCard
        title="Найближча обробка"
        message="Обробка від кліщів (Bravecto) через 14 днів — 15 Серпня 2026"
        icon={<Icon name="fi-rr-alarm-clock" size={20} color="var(--color-content-primary)" />}
        unread={true}
      />
      <NotificationCard
        title="Найближча обробка"
        message="Обробка від кліщів (Bravecto) через 14 днів — 15 Серпня 2026"
        icon={<Icon name="fi-rr-alarm-clock" size={20} color="var(--color-content-primary)" />}
        unread={false}
        read={true}
      />

      <Input placeholder="Напишіть повідомлення..." />
      <Input
        placeholder="Пошук запитання або послуги..."
        rightIcon={<Icon name="fi-rr-search" size={16} color="var(--color-content-primary)" />}
      />
      <Input value="вул. Хрещатик, 15" readOnly />
      <Input
        value="0000 0000 0000 0000"
        readOnly
        rightIcon={<Icon name="fi-rr-credit-card" size={20} color="var(--color-content-primary)" />}
      />

      <NavTabs activeTab="home" />
      <NavTabs activeTab="booking" />
      <NavTabs activeTab="pets" />
      <NavTabs activeTab="account" />

      <Accordion title="Як підготувати собаку до першого візиту?">
        Для першого візиту важливо, щоб ваш улюбленець був спокійним. Рекомендуємо не годувати собаку за 2 години до процедури та обов'язково вигуляти.
      </Accordion>
      <Accordion title="Як підготувати собаку до першого візиту?" defaultExpanded={true}>
        Для першого візиту важливо, щоб ваш улюбленець був спокійним. Рекомендуємо не годувати собаку за 2 години до процедури та обов'язково вигуляти.
      </Accordion>

      <TransactionHistory />

      <PaymentMethodsList selectedId="apple-pay" />
      <PaymentMethodsList selectedId="mastercard-4821" />

      <UserProfileCard />
      <UserProfileCard isSelected={true} />

      <AddressTags selectedId="home" />
      <AddressTags selectedId="office" />

      <NotificationBell hasBadge={true} />
      <NotificationBell hasBadge={false} />

      <FilterMenu
        options={[
          { id: '1', label: 'Всі послуги грумінгу' },
          { id: '2', label: 'Стрижка та купання' },
        ]}
      />

      <AddressList
        items={[
          {
            id: '1',
            title: 'Салон на Хрещатику',
            subtitle: 'м. Київ, вул. Хрещатик, 15',
          },
        ]}
      />

      <Logo variant="logo-without-fon-01" height={40} />
      <Logo variant="logo-without-fon-02" height={40} />

      <SocialIcon platform="Telegram" size={24} />
      <SocialIcon platform="Instagram" size={24} />
    </div>
  );
}
