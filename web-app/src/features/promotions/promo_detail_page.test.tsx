import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PromoDetailPage from './PromoDetailPage';

describe('PromoDetailPage', () => {
  it('renders default promo content matching Figma frame 1056:3124', () => {
    render(<PromoDetailPage />);

    expect(screen.getByText('Безкоштовне')).toBeDefined();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'підстригання кігтів при комплексному грумінгу',
      })
    ).toBeDefined();
    expect(
      screen.getByText(/Подаруйте своєму улюбленцю ще більше турботи/i)
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Що входить до акції' })
    ).toBeDefined();
    expect(screen.getByText('Безкоштовне підстригання кігтів.')).toBeDefined();
    expect(
      screen.getByText('Послуга виконується під час комплексного грумінгу.')
    ).toBeDefined();
    expect(screen.getByText('Для собак і котів усіх порід.')).toBeDefined();
    expect(screen.getByText('Професійний та безпечний догляд.')).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Швидкий запис' })
    ).toBeDefined();
  });

  it('triggers onQuickBookClick when clicking CTA button', () => {
    const handleQuickBook = vi.fn();
    render(<PromoDetailPage onQuickBookClick={handleQuickBook} />);

    const bookBtn = screen.getByRole('button', { name: 'Швидкий запис' });
    fireEvent.click(bookBtn);

    expect(handleQuickBook).toHaveBeenCalledTimes(1);
  });

  it('triggers onBackClick when clicking back button', () => {
    const handleBack = vi.fn();
    render(<PromoDetailPage onBackClick={handleBack} />);

    const backBtn = screen.getByRole('button', { name: 'Назад' });
    fireEvent.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders custom promo data when provided', () => {
    const customPromo = {
      id: 'custom-promo',
      highlightPrefix: 'Знижка 30%',
      highlightTitle: 'на спа-процедури',
      description: 'Опис акції.',
      sectionTitle: 'Умови участі',
      items: ['Умова 1', 'Умова 2'],
      buttonText: 'Записатись зі знижкою',
    };

    render(<PromoDetailPage promo={customPromo} />);

    expect(screen.getByText('Знижка 30%')).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 1, name: 'на спа-процедури' })
    ).toBeDefined();
    expect(screen.getByText('Опис акції.')).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Умови участі' })
    ).toBeDefined();
    expect(screen.getByText('Умова 1')).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Записатись зі знижкою' })
    ).toBeDefined();
  });
});
