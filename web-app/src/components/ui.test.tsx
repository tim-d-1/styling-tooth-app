import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  Tabs,
  TagGroup,
  FilterPills,
} from './ui';

describe('UI Component Library', () => {
  describe('Tabs', () => {
    const mockItems = [
      { id: 'tab1', label: 'Вкладка 1', count: 3 },
      { id: 'tab2', label: 'Вкладка 2', count: 5 },
      { id: 'tab3', label: 'Вкладка 3', disabled: true },
    ];

    it('renders tabs and selects default value', () => {
      render(<Tabs items={mockItems} defaultValue="tab2" />);
      const tab2 = screen.getByRole('tab', { name: /Вкладка 2/i });
      expect(tab2.getAttribute('aria-selected')).toBe('true');
      expect(tab2.getAttribute('tabIndex')).toBe('0');
    });

    it('handles tab click and calls onChange', () => {
      const handleChange = vi.fn();
      render(<Tabs items={mockItems} onChange={handleChange} />);
      const tab2 = screen.getByRole('tab', { name: /Вкладка 2/i });
      fireEvent.click(tab2);
      expect(handleChange).toHaveBeenCalledWith('tab2');
    });

    it('handles keyboard navigation with arrow keys and home/end', () => {
      const handleChange = vi.fn();
      render(<Tabs items={mockItems} onChange={handleChange} />);
      const tab1 = screen.getByRole('tab', { name: /Вкладка 1/i });
      
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('tab2');

      fireEvent.keyDown(tab1, { key: 'Home' });
      expect(handleChange).toHaveBeenCalledWith('tab1');

      fireEvent.keyDown(tab1, { key: 'End' });
      expect(handleChange).toHaveBeenCalledWith('tab2');
    });

    it('renders fallback when items array is empty', () => {
      render(<Tabs items={[]} />);
      expect(screen.getByText('Немає доступних вкладок')).toBeDefined();
    });
  });

  describe('TagGroup & FilterPills', () => {
    const mockTags = [
      { id: 'tag1', label: 'Тег 1' },
      { id: 'tag2', label: 'Тег 2' },
      { id: 'tag3', label: 'Тег 3' },
    ];

    it('toggles selection in uncontrolled TagGroup', () => {
      const handleToggle = vi.fn();
      render(<TagGroup tags={mockTags} defaultSelectedIds={['tag1']} onToggle={handleToggle} />);
      const tag1 = screen.getByRole('button', { name: 'Тег 1' });
      const tag2 = screen.getByRole('button', { name: 'Тег 2' });

      expect(tag1.getAttribute('aria-pressed')).toBe('true');
      expect(tag2.getAttribute('aria-pressed')).toBe('false');

      fireEvent.click(tag2);
      expect(handleToggle).toHaveBeenCalledWith('tag2');
    });

    it('renders FilterPills with shared toggle logic', () => {
      const handleToggle = vi.fn();
      render(<FilterPills tags={mockTags} selectedIds={['tag2']} onToggle={handleToggle} />);
      const tag2 = screen.getByRole('button', { name: 'Тег 2' });
      expect(tag2.getAttribute('aria-pressed')).toBe('true');
      fireEvent.click(tag2);
      expect(handleToggle).toHaveBeenCalledWith('tag2');
    });

    it('renders fallback when tags array is empty', () => {
      render(<TagGroup tags={[]} />);
      expect(screen.getByText('Немає доступних тегів')).toBeDefined();
    });
  });

  describe('Accordion', () => {
    const mockAccordionItems = [
      { id: 'item1', title: 'Заголовок 1', content: 'Контент 1' },
      { id: 'item2', title: 'Заголовок 2', content: 'Контент 2' },
    ];

    it('renders accordion items and toggles panel on header click', () => {
      const handleToggle = vi.fn();
      render(<Accordion items={mockAccordionItems} defaultExpandedIds={['item1']} onToggle={handleToggle} />);

      const button1 = screen.getByRole('button', { name: /Заголовок 1/i });
      const button2 = screen.getByRole('button', { name: /Заголовок 2/i });

      expect(button1.getAttribute('aria-expanded')).toBe('true');
      expect(button2.getAttribute('aria-expanded')).toBe('false');
      expect(screen.getByText('Контент 1')).toBeDefined();

      fireEvent.click(button2);
      expect(handleToggle).toHaveBeenCalledWith('item2');
    });

    it('renders fallback when accordion items is empty', () => {
      render(<Accordion items={[]} />);
      expect(screen.getByText('Немає елементів акордеону')).toBeDefined();
    });
  });

  describe('AddressTags', () => {
    const mockAddressTags = [
      { id: 'home', label: 'Дім' },
      { id: 'office', label: 'Офіс' },
    ];

    it('renders address tags and handles selection', () => {
      const handleChange = vi.fn();
      render(<AddressTags options={mockAddressTags} selectedId="home" onChange={handleChange} />);
      const homeTag = screen.getByRole('button', { name: 'Дім' });
      expect(homeTag.getAttribute('aria-pressed')).toBe('true');

      const officeTag = screen.getByRole('button', { name: 'Офіс' });
      fireEvent.click(officeTag);
      expect(handleChange).toHaveBeenCalledWith('office');
    });

    it('renders fallback on empty options', () => {
      render(<AddressTags options={[]} />);
      expect(screen.getByText('Немає доступних адресних тегів')).toBeDefined();
    });
  });

  describe('PaymentMethodsList', () => {
    const mockMethods = [
      { id: 'apple-pay', type: 'apple-pay' as const, title: 'Apple Pay', subtitle: 'Основний', isPrimary: true },
      { id: 'card-1', type: 'card' as const, title: 'Mastercard •••• 4421', subtitle: 'Додатковий' },
    ];

    it('renders payment methods and handles select and delete', () => {
      const handleSelect = vi.fn();
      const handleDelete = vi.fn();
      render(<PaymentMethodsList methods={mockMethods} selectedId="apple-pay" onSelect={handleSelect} onDelete={handleDelete} />);

      expect(screen.getByText('Apple Pay')).toBeDefined();
      expect(screen.getByText('Mastercard •••• 4421')).toBeDefined();

      const deleteButton = screen.getByRole('button', { name: /Видалити збережений спосіб оплати: Mastercard/i });
      fireEvent.click(deleteButton);
      expect(handleDelete).toHaveBeenCalledWith('card-1');
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it('renders fallback on empty methods', () => {
      render(<PaymentMethodsList methods={[]} />);
      expect(screen.getByText('Немає збережених способів оплати')).toBeDefined();
    });
  });

  describe('TransactionHistory', () => {
    const mockTransactions = [
      { id: '1', title: 'Грумінг', date: '18.07.2026', amount: 240, icon: 'fi-rr-paw', type: 'earned' as const },
      { id: '2', title: 'Стрижка', date: '19.07.2026', amount: -100, icon: 'fi-rr-scissors', type: 'spent' as const },
    ];

    it('filters transactions by type', () => {
      render(<TransactionHistory items={mockTransactions} />);
      expect(screen.getByText('Грумінг')).toBeDefined();
      expect(screen.getByText('Стрижка')).toBeDefined();

      const earnedTab = screen.getByRole('tab', { name: 'Нараховано' });
      fireEvent.click(earnedTab);
      expect(screen.getByText('Грумінг')).toBeDefined();
      expect(screen.queryByText('Стрижка')).toBeNull();
    });

    it('renders fallback on empty transactions', () => {
      render(<TransactionHistory items={[]} />);
      expect(screen.getByText('Історія операцій порожня')).toBeDefined();
    });
  });

  describe('AddressList', () => {
    const mockAddresses = [
      { id: 'addr1', title: 'вул. Соборна, 15', subtitle: 'м. Запоріжжя', badge: 'Дім' },
    ];

    it('renders address item as button and triggers selection', () => {
      const handleSelect = vi.fn();
      render(<AddressList items={mockAddresses} onSelect={handleSelect} />);
      const addressBtn = screen.getByRole('button', { name: /вул. Соборна, 15/i });
      fireEvent.click(addressBtn);
      expect(handleSelect).toHaveBeenCalledWith(mockAddresses[0]);
    });

    it('renders fallback on empty items', () => {
      render(<AddressList items={[]} />);
      expect(screen.getByText('Список адрес порожній')).toBeDefined();
    });
  });

  describe('FilterMenu', () => {
    const mockOptions = [
      { id: 'opt1', label: 'Опція 1' },
      { id: 'opt2', label: 'Опція 2' },
    ];

    it('opens dropdown and selects option', () => {
      const handleSelect = vi.fn();
      render(<FilterMenu options={mockOptions} onSelect={handleSelect} />);
      const trigger = screen.getByRole('button', { name: /Меню вибору фільтра/i });
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      const option2 = screen.getByRole('option', { name: 'Опція 2' });
      fireEvent.click(option2);
      expect(handleSelect).toHaveBeenCalledWith(mockOptions[1]);
    });
  });

  describe('ClipMenu', () => {
    const mockClipItems = [
      { id: 'photo', label: 'Фотографія', icon: 'fi-rr-picture' as const },
    ];

    it('opens clip menu and selects item', () => {
      const handleSelect = vi.fn();
      render(<ClipMenu items={mockClipItems} onSelect={handleSelect} />);
      const trigger = screen.getByRole('button', { name: /Меню швидких дій/i });
      fireEvent.click(trigger);

      const menuItem = screen.getByRole('menuitem', { name: 'Фотографія' });
      fireEvent.click(menuItem);
      expect(handleSelect).toHaveBeenCalledWith(mockClipItems[0]);
    });
  });

  describe('NavTabs', () => {
    const mockNav = [
      { id: 'home', label: 'Головна', icon: 'fi-rr-home' },
      { id: 'account', label: 'Кабінет', icon: 'fi-rr-user' },
    ];

    it('renders nav tabs and highlights active page', () => {
      const handleChange = vi.fn();
      render(<NavTabs tabs={mockNav} activeTab="home" onChange={handleChange} />);
      const homeBtn = screen.getByRole('button', { name: 'Головна' });
      expect(homeBtn.getAttribute('aria-current')).toBe('page');

      const accountBtn = screen.getByRole('button', { name: 'Кабінет' });
      fireEvent.click(accountBtn);
      expect(handleChange).toHaveBeenCalledWith('account');
    });
  });

  describe('UserProfileCard', () => {
    it('handles card click and edit button click', () => {
      const handleClick = vi.fn();
      const handleEdit = vi.fn();
      render(<UserProfileCard name="Анна Ткаченко" roleLabel="Клієнт" onClick={handleClick} onEdit={handleEdit} />);

      const card = screen.getByRole('button', { name: /Картка профілю користувача: Анна Ткаченко/i });
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalled();

      const editBtn = screen.getByRole('button', { name: /Редагувати профіль користувача/i });
      fireEvent.click(editBtn);
      expect(handleEdit).toHaveBeenCalled();
    });
  });

  describe('Interactive Controls & Primitives', () => {
    it('handles Button clicks and loading state', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} isLoading={false}>Натиснути</Button>);
      const btn = screen.getByRole('button', { name: 'Натиснути' });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalled();
    });

    it('handles Checkbox toggle and keyboard events', () => {
      const handleChange = vi.fn();
      render(<Checkbox checked={false} onChange={handleChange} label="Погодитися" />);
      const checkbox = screen.getByRole('checkbox', { name: 'Погодитися' });
      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);

      fireEvent.keyDown(checkbox, { key: ' ' });
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('handles Switch toggle', () => {
      const handleChange = vi.fn();
      render(<Switch checked={false} onChange={handleChange} label="Сповіщення" />);
      const switchBtn = screen.getByRole('switch', { name: 'Сповіщення' });
      fireEvent.click(switchBtn);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('handles Rating interactive mode', () => {
      const handleChange = vi.fn();
      render(<Rating value={3} readOnly={false} onChange={handleChange} />);
      const star4 = screen.getByRole('radio', { name: 'Оцінити 4 зірок' });
      fireEvent.click(star4);
      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('renders Input with accessible helper and error states', () => {
      render(<Input label="Електронна пошта" error="Невірний формат" />);
      const input = screen.getByRole('textbox', { name: 'Електронна пошта' });
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByRole('alert').textContent).toBe('Невірний формат');
    });

    it('renders NotificationBell and NotificationCard', () => {
      const handleBell = vi.fn();
      render(<NotificationBell hasBadge={true} onClick={handleBell} />);
      const bell = screen.getByRole('button', { name: /Центр сповіщень: є нові сповіщення/i });
      fireEvent.click(bell);
      expect(handleBell).toHaveBeenCalled();

      render(<NotificationCard title="Нова послуга" message="Знижка 10%" read={false} />);
      expect(screen.getByText('Нова послуга')).toBeDefined();
    });

    it('renders Logo, SocialIcon and Icon cleanly', () => {
      render(<Logo variant="mark-transparent" alt="Логотип" />);
      expect(screen.getByAltText('Логотип')).toBeDefined();

      render(<SocialIcon platform="Telegram" alt="Телеграм" />);
      expect(screen.getByAltText('Телеграм')).toBeDefined();

      render(<Icon name="fi-rr-paw" data-testid="paw-icon" />);
      expect(screen.getByTestId('paw-icon')).toBeDefined();
    });
  });
});
