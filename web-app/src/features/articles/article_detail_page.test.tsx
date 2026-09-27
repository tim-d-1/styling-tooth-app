import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArticleDetailPage from './ArticleDetailPage';

describe('ArticleDetailPage', () => {
  it('renders default shampoo guide article content matching Figma 1055:2958', () => {
    render(<ArticleDetailPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Як обрати правильний шампунь?' })
    ).toBeDefined();
    expect(
      screen.getByText(/Шкіра собак і котів має інший рівень pH/i)
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'На що звернути увагу?' })
    ).toBeDefined();
    expect(
      screen.getByText(/Тип шерсті — коротка, довга або кучерява/i)
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Поради' })
    ).toBeDefined();
    expect(
      screen.getByText(/✔️ Добре змивайте шампунь після купання/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Правильно підібраний шампунь — запорука здорової шкіри/i)
    ).toBeDefined();
    expect(
      screen.getByText('Оцініть, наскільки корисною була ця інформація')
    ).toBeDefined();
  });

  it('handles interactive paw rating and fires callbacks', () => {
    const handleRate = vi.fn();
    const handleToast = vi.fn();

    render(<ArticleDetailPage onRate={handleRate} onToast={handleToast} />);

    const paw4 = screen.getByRole('radio', { name: 'Оцінити 4 лапок' });
    fireEvent.click(paw4);

    expect(handleRate).toHaveBeenCalledWith(4);
    expect(handleToast).toHaveBeenCalledWith('Дякуємо за вашу оцінку: 4 з 5!');
  });

  it('triggers onBackClick when clicking back button', () => {
    const handleBack = vi.fn();
    render(<ArticleDetailPage onBackClick={handleBack} />);

    const backBtn = screen.getByRole('button', { name: 'Назад' });
    fireEvent.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders custom article data when provided', () => {
    const customArticle = {
      id: 'custom-article',
      title: 'Секрети правильного догляду',
      intro: 'Вступ до статті.',
      sections: [
        {
          title: 'Розділ 1',
          items: ['Пункт 1', 'Пункт 2'],
        },
      ],
      summary: 'Підсумок статті.',
    };

    render(<ArticleDetailPage article={customArticle} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Секрети правильного догляду' })
    ).toBeDefined();
    expect(screen.getByText('Вступ до статті.')).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Розділ 1' })
    ).toBeDefined();
    expect(screen.getByText('Пункт 1')).toBeDefined();
    expect(screen.getByText('Підсумок статті.')).toBeDefined();
  });
});
