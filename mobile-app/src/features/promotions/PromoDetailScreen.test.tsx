import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PromoDetailScreen } from './PromoDetailScreen';
import { PROMOS_REGISTRY } from './promo_types';

describe('PromoDetailScreen', () => {
  it('renders default promo content when no id or promo is provided', () => {
    render(<PromoDetailScreen />);

    expect(screen.getByTestId('promo-detail-screen')).toBeInTheDocument();
    expect(screen.getByTestId('promo-detail-back-button')).toBeInTheDocument();
    expect(screen.getByText('Спеціальна пропозиція')).toBeInTheDocument();
    expect(screen.getByText('Безкоштовне')).toBeInTheDocument();
    expect(
      screen.getByText('підстригання кігтів при комплексному грумінгу')
    ).toBeInTheDocument();
    expect(screen.getByTestId('promo-quick-book-button')).toBeInTheDocument();
  });

  it('renders specific promo data by promoId', () => {
    render(<PromoDetailScreen promoId="first-grooming" />);

    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.getByText('на перший грумінг')).toBeInTheDocument();
    expect(screen.getByText('Умови акції')).toBeInTheDocument();
    expect(screen.getByText('Діє для нових клієнтів салону.')).toBeInTheDocument();
  });

  it('triggers onBack when back button is pressed', () => {
    const onBack = vi.fn();
    render(<PromoDetailScreen onBack={onBack} />);

    fireEvent.click(screen.getByTestId('promo-detail-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('triggers onBook when quick book button is pressed', () => {
    const onBook = vi.fn();
    render(<PromoDetailScreen onBook={onBook} />);

    fireEvent.click(screen.getByTestId('promo-quick-book-button'));
    expect(onBook).toHaveBeenCalledTimes(1);
  });
});
