import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TermsOfUsePage from './TermsOfUsePage';
import type { TermsOfUseData } from './legal_types';

describe('TermsOfUsePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.location.hash = '';
  });

  it('renders breadcrumbs and triggers navigation callbacks', () => {
    const handleHomeClick = vi.fn();
    render(<TermsOfUsePage onHomeClick={handleHomeClick} />);

    const breadcrumbsNav = screen.getByRole('navigation', {
      name: 'Навігація хлібними крихтами',
    });
    expect(breadcrumbsNav).toBeDefined();

    const homeBtn = screen.getByRole('button', { name: 'Головна' });
    fireEvent.click(homeBtn);
    expect(handleHomeClick).toHaveBeenCalledTimes(1);

    expect(within(breadcrumbsNav).getByText('Умови використання')).toBeDefined();
  });

  it('renders metadata row with last updated date and 8 min reading time badge', () => {
    render(<TermsOfUsePage />);

    expect(
      screen.getByText('Останнє оновлення: 15 серпня 2026 року')
    ).toBeDefined();
    expect(screen.getByText('8 хв читання')).toBeDefined();
  });

  it('renders summary card with four rule cards matching Figma 1031:3157', () => {
    const { container } = render(<TermsOfUsePage />);

    const summarySection = screen.getByRole('region', {
      name: 'Головні правила сервісу',
    });
    expect(summarySection).toBeDefined();
    expect(screen.getByText('Головні правила сервісу 📜')).toBeDefined();

    expect(screen.getByText('Скасування візиту')).toBeDefined();
    expect(
      screen.getByText('Безкоштовне скасування не пізніше ніж за 3 години')
    ).toBeDefined();

    expect(screen.getByText('Поведінка тварини')).toBeDefined();
    expect(
      screen.getByText('Повідомляйте про стрес або агресію')
    ).toBeDefined();

    expect(screen.getByText('Вакцинація')).toBeDefined();
    expect(
      screen.getByText(
        "Обов'язкова наявність ветпаспорта з вакцинацією від сказу"
      )
    ).toBeDefined();

    expect(screen.getByText('Програма лояльності')).toBeDefined();
    expect(screen.getByText('Накопичення бонусів та знижки')).toBeDefined();

    expect(container.querySelector('.fi-rr-calendar')).not.toBeNull();
    expect(container.querySelector('.fi-rr-paw')).not.toBeNull();
    expect(container.querySelector('.fi-rr-shield-check')).not.toBeNull();
    expect(container.querySelector('.fi-rr-gift')).not.toBeNull();
  });

  it('renders sticky table of contents sidebar with anchor links matching all sections', () => {
    render(<TermsOfUsePage />);

    const tocAside = screen.getByRole('complementary', {
      name: 'Зміст документа',
    });
    expect(tocAside).toBeDefined();
    expect(tocAside.className).toContain('lg:w-[24.1875rem]');

    const tocLinks = screen.getAllByRole('link');
    const expectedAnchors = [
      '#acceptance',
      '#booking-cancellation',
      '#pet-health-safety',
      '#payments-loyalty',
      '#liabilities',
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

  it('renders 15-minute late arrival callout box inside booking and cancellation section', () => {
    render(<TermsOfUsePage />);

    const callout = screen.getByRole('note', {
      name: 'Увага: правило 15 хвилин',
    });
    expect(callout).toBeDefined();
    expect(
      screen.getByText(
        /Запізнення на візит понад 15 хвилин може призвести до скорочення тривалості процедури/i
      )
    ).toBeDefined();
  });

  it('handles click on TOC link and triggers scroll', () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(<TermsOfUsePage />);

    const link = screen.getByRole('link', {
      name: /2\. Правила бронювання та скасування/i,
    });
    fireEvent.click(link);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it('renders detailed content sections in right column with responsive dimensions', () => {
    const { container } = render(<TermsOfUsePage />);

    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    expect(article?.className).toContain('lg:w-[49.5625rem]');

    expect(
      screen.getByRole('heading', { level: 2, name: '1. Прийняття умов' })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: '2. Правила бронювання та скасування',
      })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: "3. Здоров'я та безпека тварин",
      })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: '4. Оплата та програма лояльності',
      })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: '5. Відповідальність сторін',
      })
    ).toBeDefined();
  });

  it('passes authentication props and action callbacks to Header', () => {
    const handleLogin = vi.fn();
    const handleRegister = vi.fn();

    render(
      <TermsOfUsePage
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

  it('renders custom terms data when provided via props', () => {
    const customTerms: TermsOfUseData = {
      title: 'Спеціальні умови',
      breadcrumbs: [
        { label: 'Головна', href: '/' },
        { label: 'Спеціальні умови' },
      ],
      lastUpdated: '01 лютого 2027 року',
      readingTime: '5 хв читання',
      summary: {
        title: 'Спеціальні правила',
        rules: [
          {
            id: 'rule-special',
            title: 'Правило 1',
            description: 'Опис спеціального правила',
            iconName: 'fi-rr-paw',
          },
        ],
      },
      toc: [
        {
          id: 'custom-terms-sec',
          number: '1',
          title: '1. Розділ спеціальних умов',
          href: '#custom-terms-sec',
        },
      ],
      sections: [
        {
          id: 'custom-terms-sec',
          number: '1',
          title: '1. Розділ спеціальних умов',
          intro: 'Текст вступу спеціальних умов.',
        },
      ],
    };

    render(<TermsOfUsePage data={customTerms} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Спеціальні умови' })
    ).toBeDefined();
    expect(
      screen.getByText('Останнє оновлення: 01 лютого 2027 року')
    ).toBeDefined();
    expect(screen.getByText('5 хв читання')).toBeDefined();
    expect(screen.getByText('Спеціальні правила')).toBeDefined();
    expect(screen.getByText('Правило 1')).toBeDefined();
    expect(
      screen.getByText('Опис спеціального правила')
    ).toBeDefined();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: '1. Розділ спеціальних умов',
      })
    ).toBeDefined();
    expect(
      screen.getByText('Текст вступу спеціальних умов.')
    ).toBeDefined();
  });
});
