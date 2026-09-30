import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import FaqPage from './FaqPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('FaqPage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('renders breadcrumbs, title, search input, and category pills', () => {
    render(
      <MemoryRouter>
        <FaqPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Навігація хлібними крихтами' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Часті запитання (FAQ)' })).toBeDefined();
    expect(screen.getByPlaceholderText('Пошук запитання або послуги...')).toBeDefined();

    expect(screen.getByRole('tab', { name: 'Всі запитання' })).toBeDefined();
    expect(screen.getByRole('tab', { name: '✂️ Грумінг' })).toBeDefined();
    expect(screen.getByRole('tab', { name: '🫧 СПА & Догляд' })).toBeDefined();
    expect(screen.getByRole('tab', { name: '🚗 Pet-трансфер' })).toBeDefined();
    expect(screen.getByRole('tab', { name: '💳 Оплата та Бонуси' })).toBeDefined();
  });

  it('filters FAQ items by search input', () => {
    render(
      <MemoryRouter>
        <FaqPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Пошук запитання або послуги...');
    fireEvent.change(searchInput, { target: { value: 'озонової ванни' } });

    expect(screen.getByText('Що включає процедура озонової ванни з гідромасажем?')).toBeDefined();
    expect(screen.queryByText('Як підготувати собаку до першого візиту?')).toBeNull();

    const clearButton = screen.getByLabelText('Очистити пошук');
    fireEvent.click(clearButton);

    expect(screen.getByText('Як підготувати собаку до першого візиту?')).toBeDefined();
  });

  it('filters FAQ items by category tab pills', () => {
    render(
      <MemoryRouter>
        <FaqPage />
      </MemoryRouter>
    );

    const transferTab = screen.getByRole('tab', { name: '🚗 Pet-трансфер' });
    fireEvent.click(transferTab);

    expect(screen.getByText('Як працює послуга Pet-трансферу?')).toBeDefined();
    expect(screen.getByText('Чи безпечний Pet-трансфер для котів та тривожних тварин?')).toBeDefined();
    expect(screen.queryByText('Що входить у вартість комплексного грумінгу?')).toBeNull();

    const paymentTab = screen.getByRole('tab', { name: '💳 Оплата та Бонуси' });
    fireEvent.click(paymentTab);

    expect(screen.getByText('Як накопичувати та витрачати бонуси?')).toBeDefined();
    expect(screen.queryByText('Як працює послуга Pet-трансферу?')).toBeNull();
  });

  it('renders empty state when search yields no matches', () => {
    render(
      <MemoryRouter>
        <FaqPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Пошук запитання або послуги...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent-query-xyz' } });

    expect(screen.getByTestId('faq-empty-state')).toBeDefined();
    expect(screen.getByText('Нічого не знайдено')).toBeDefined();
  });

  it('toggles accordion items expansion and accessibility attributes', () => {
    render(
      <MemoryRouter>
        <FaqPage defaultExpandedIds={[]} />
      </MemoryRouter>
    );

    const firstQuestionBtn = screen.getByRole('button', {
      name: /Як підготувати собаку до першого візиту\?/i,
    });
    expect(firstQuestionBtn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/Для першого візиту рекомендуємо вигуляти/i)).toBeNull();

    fireEvent.click(firstQuestionBtn);
    expect(firstQuestionBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/Для першого візиту рекомендуємо вигуляти/i)).toBeDefined();

    fireEvent.click(firstQuestionBtn);
    expect(firstQuestionBtn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/Для першого візиту рекомендуємо вигуляти/i)).toBeNull();
  });

  it('renders contact support card and triggers onContactSupport callback', () => {
    const handleContactSupport = vi.fn();
    render(
      <MemoryRouter>
        <FaqPage onContactSupport={handleContactSupport} />
      </MemoryRouter>
    );

    expect(screen.getByText('Не знайшли відповіді?')).toBeDefined();
    expect(
      screen.getByText('Наш адміністратор відповість на будь-які ваші питання в чаті')
    ).toBeDefined();

    const supportBtn = screen.getByRole('button', { name: 'Написати в підтримку' });
    fireEvent.click(supportBtn);

    expect(handleContactSupport).toHaveBeenCalledTimes(1);
  });

  it('propagates navigation callbacks for home, login, register, and profile', () => {
    const handleHome = vi.fn();
    const handleLogin = vi.fn();
    const handleRegister = vi.fn();
    const handleProfile = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <FaqPage
          isLoggedIn={false}
          onHomeClick={handleHome}
          onLoginClick={handleLogin}
          onRegisterClick={handleRegister}
          onProfileClick={handleProfile}
        />
      </MemoryRouter>
    );

    const breadcrumbHome = screen.getByRole('button', { name: 'Головна' });
    fireEvent.click(breadcrumbHome);
    expect(handleHome).toHaveBeenCalledTimes(1);

    const loginBtn = screen.getByRole('button', { name: 'Вхід / Реєстрація' });
    fireEvent.click(loginBtn);
    expect(handleLogin).toHaveBeenCalledTimes(1);

    const registerBtn = screen.getByRole('button', { name: 'Зареєструватися' });
    fireEvent.click(registerBtn);
    expect(handleRegister).toHaveBeenCalledTimes(1);

    rerender(
      <MemoryRouter>
        <FaqPage
          isLoggedIn={true}
          onHomeClick={handleHome}
          onProfileClick={handleProfile}
        />
      </MemoryRouter>
    );

    const profileBtn = screen.getByRole('button', {
      name: /Особистий профіль користувача/i,
    });
    fireEvent.click(profileBtn);
    expect(handleProfile).toHaveBeenCalledTimes(1);
  });
});
