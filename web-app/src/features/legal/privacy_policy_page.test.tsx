import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import type { PrivacyPolicyData } from './legal_types';

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.location.hash = '';
  });

  it('renders breadcrumbs and triggers navigation callbacks', () => {
    const handleHomeClick = vi.fn();
    render(<PrivacyPolicyPage onHomeClick={handleHomeClick} />);

    const breadcrumbsNav = screen.getByRole('navigation', {
      name: 'Навігація хлібними крихтами',
    });
    expect(breadcrumbsNav).toBeDefined();

    const homeBtn = screen.getByRole('button', { name: 'Головна' });
    fireEvent.click(homeBtn);
    expect(handleHomeClick).toHaveBeenCalledTimes(1);

    expect(within(breadcrumbsNav).getByText('Політика конфіденційності')).toBeDefined();
  });

  it('renders metadata row with last updated date and reading time badge', () => {
    render(<PrivacyPolicyPage />);

    expect(
      screen.getByText('Останнє оновлення: 15 серпня 2026 року')
    ).toBeDefined();
    expect(screen.getByText('6 хв читання')).toBeDefined();
  });

  it('renders summary highlight card with title and four checkmark bullet points matching Figma 1017:2181', () => {
    render(<PrivacyPolicyPage />);

    const summarySection = screen.getByRole('region', {
      name: 'Коротко про головне',
    });
    expect(summarySection).toBeDefined();
    expect(screen.getByText('Коротко про головне 🛡')).toBeDefined();

    expect(
      screen.getByText(
        'Ми збираємо лише необхідні дані для надання якісних послуг вашим улюбленцям.'
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        'Ваші дані надійно захищені та не передаються третім особам без вашої згоди.'
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        'Медичні дані тварин зберігаються у зашифрованому вигляді.'
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        'Ви можете у будь-який момент запросити видалення вашого профілю.'
      )
    ).toBeDefined();
  });

  it('renders sticky table of contents sidebar with three anchors matching sections', () => {
    render(<PrivacyPolicyPage />);

    const tocAside = screen.getByRole('complementary', {
      name: 'Зміст документа',
    });
    expect(tocAside).toBeDefined();
    expect(tocAside.className).toContain('lg:w-[24.1875rem]');

    const tocLinks = screen.getAllByRole('link');
    const tocTitles = [
      '1. Загальні положення',
      '2. Збір та використання даних',
      '3. Інформація про ваших улюбленців',
    ];

    tocTitles.forEach((title) => {
      const link = tocLinks.find((l) => l.textContent?.includes(title));
      expect(link).toBeDefined();
    });

    const expectedAnchors = [
      '#general-provisions',
      '#data-collection-use',
      '#pets-information',
    ];

    expectedAnchors.forEach((href) => {
      const anchorElement = tocLinks.find(
        (l) => l.getAttribute('href') === href
      );
      expect(anchorElement).toBeDefined();
      const targetId = href.replace('#', '');
      const targetSection = document.getElementById(targetId);
      expect(targetSection).not.toBeNull();
    });
  });

  it('handles click on TOC link and scrolls to target section', () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(<PrivacyPolicyPage />);

    const link = screen.getByRole('link', {
      name: /2\. Збір та використання даних/i,
    });
    fireEvent.click(link);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it('renders detailed content sections in right column with responsive dimensions', () => {
    const { container } = render(<PrivacyPolicyPage />);

    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    expect(article?.className).toContain('lg:w-[49.5625rem]');

    expect(
      screen.getByRole('heading', { level: 2, name: '1. Загальні положення' })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: '2. Збір та використання даних',
      })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: '3. Інформація про ваших улюбленців',
      })
    ).toBeDefined();

    expect(
      screen.getByText(/Прізвище, ім’я та по батькові клієнта;/i)
    ).toBeDefined();
    expect(
      screen.getByText(
        /Кличка, вид, порода, вік, стать та вага тварини;/i
      )
    ).toBeDefined();
  });

  it('passes authentication props and action callbacks to Header', () => {
    const handleLogin = vi.fn();
    const handleRegister = vi.fn();

    render(
      <PrivacyPolicyPage
        isLoggedIn={false}
        onLoginClick={handleLogin}
        onRegisterClick={handleRegister}
      />
    );

    const loginBtn = screen.getByRole('button', { name: 'Вхід / Реєстрація' });
    fireEvent.click(loginBtn);
    expect(handleLogin).toHaveBeenCalledTimes(1);

    const registerBtn = screen.getByRole('button', { name: 'Зареєструватися' });
    fireEvent.click(registerBtn);
    expect(handleRegister).toHaveBeenCalledTimes(1);
  });

  it('renders custom data when provided via props', () => {
    const customData: PrivacyPolicyData = {
      title: 'Спеціальна політика',
      breadcrumbs: [
        { label: 'Головна', href: '/' },
        { label: 'Спеціальна політика' },
      ],
      lastUpdated: '01 січня 2027 року',
      readingTime: '3 хв читання',
      summary: {
        title: 'Швидкий огляд',
        items: ['Пункт 1', 'Пункт 2'],
      },
      toc: [
        {
          id: 'custom-sec',
          number: '1',
          title: '1. Розділ спеціальний',
          href: '#custom-sec',
        },
      ],
      sections: [
        {
          id: 'custom-sec',
          number: '1',
          title: '1. Розділ спеціальний',
          intro: 'Вступний текст спеціального розділу.',
        },
      ],
    };

    render(<PrivacyPolicyPage data={customData} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Спеціальна політика' })
    ).toBeDefined();
    expect(
      screen.getByText('Останнє оновлення: 01 січня 2027 року')
    ).toBeDefined();
    expect(screen.getByText('3 хв читання')).toBeDefined();
    expect(screen.getByText('Швидкий огляд')).toBeDefined();
    expect(screen.getByText('Пункт 1')).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: '1. Розділ спеціальний' })
    ).toBeDefined();
    expect(
      screen.getByText('Вступний текст спеціального розділу.')
    ).toBeDefined();
  });
});
