import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ArticleDetailScreen } from './ArticleDetailScreen';
import { ARTICLES_REGISTRY } from './article_types';

describe('ArticleDetailScreen', () => {
  it('renders default shampoo guide article content', () => {
    render(<ArticleDetailScreen />);

    expect(screen.getByTestId('article-detail-screen')).toBeInTheDocument();
    expect(screen.getByTestId('article-detail-back-button')).toBeInTheDocument();
    expect(screen.getByText('Порада експерта')).toBeInTheDocument();
    expect(screen.getByText('Як обрати правильний шампунь?')).toBeInTheDocument();
    expect(
      screen.getByText(/Шкіра собак і котів має інший рівень pH/i)
    ).toBeInTheDocument();
    expect(screen.getByText('На що звернути увагу?')).toBeInTheDocument();
    expect(screen.getByText('Висновок')).toBeInTheDocument();
  });

  it('renders paws care article content when articleId is paws-care', () => {
    render(<ArticleDetailScreen articleId="paws-care" />);

    expect(screen.getByText('5 порад для здорових лап')).toBeInTheDocument();
    expect(
      screen.getByText(/Лапи тварин щодня піддаються навантаженням/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Щоденні правила')).toBeInTheDocument();
  });

  it('triggers onBack when back button is pressed', () => {
    const onBack = vi.fn();
    render(<ArticleDetailScreen onBack={onBack} />);

    fireEvent.click(screen.getByTestId('article-detail-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('triggers onBook when quick book button is pressed', () => {
    const onBook = vi.fn();
    render(<ArticleDetailScreen onBook={onBook} />);

    const bookBtn = screen.getByTestId('article-quick-book-button');
    expect(bookBtn).toBeInTheDocument();
    fireEvent.click(bookBtn);
    expect(onBook).toHaveBeenCalledTimes(1);
  });
});
