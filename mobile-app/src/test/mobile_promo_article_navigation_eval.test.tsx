import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../../App';
import { supabase } from '../lib/supabase';
import { PROMOS_REGISTRY } from '../features/promotions/promo_types';
import { ARTICLES_REGISTRY } from '../features/articles/article_types';

describe('Mobile Promo & Expert Advice Navigation Eval Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'eval-user-1',
            email: 'eval@example.com',
          },
        },
      },
      error: null,
    });
    (supabase.from as any).mockImplementation((_table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }));
  });

  it('evaluates promo registry completeness with required marketing attributes', () => {
    const requiredPromos = ['first-grooming', 'free-nail-trimming', 'weekday-grooming'];
    for (const promoId of requiredPromos) {
      const promo = PROMOS_REGISTRY[promoId];
      expect(promo, `Promo ${promoId} must exist in registry`).toBeDefined();
      expect(promo.highlightPrefix.trim().length).toBeGreaterThan(0);
      expect(promo.highlightTitle.trim().length).toBeGreaterThan(0);
      expect(promo.description.trim().length).toBeGreaterThan(20);
      expect(promo.items.length).toBeGreaterThanOrEqual(3);
      expect(promo.buttonText).toBe('Швидкий запис');
    }
  });

  it('evaluates articles registry completeness with structured expert content', () => {
    const requiredArticles = ['shampoo-guide', 'paws-care'];
    for (const articleId of requiredArticles) {
      const article = ARTICLES_REGISTRY[articleId];
      expect(article, `Article ${articleId} must exist in registry`).toBeDefined();
      expect(article.title.trim().length).toBeGreaterThan(5);
      expect(article.intro.trim().length).toBeGreaterThan(20);
      expect(article.sections.length).toBeGreaterThanOrEqual(2);
      for (const section of article.sections) {
        expect(section.title.trim().length).toBeGreaterThan(0);
        expect(section.items.length).toBeGreaterThanOrEqual(2);
      }
      expect(article.summary.trim().length).toBeGreaterThan(15);
    }
  });

  it('evaluates deep-linking to promo_detail screen state via AppProps', async () => {
    render(
      <App
        initialScreen="promo_detail"
        initialPromoId="first-grooming"
        skipSessionCheck
      />
    );

    expect(screen.getByTestId('home-promo-detail-container')).toBeInTheDocument();
    expect(screen.getByTestId('promo-detail-screen')).toBeInTheDocument();
    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.getByText('на перший грумінг')).toBeInTheDocument();
  });

  it('evaluates deep-linking to article_detail screen state via AppProps', async () => {
    render(
      <App
        initialScreen="article_detail"
        initialArticleId="shampoo-guide"
        skipSessionCheck
      />
    );

    expect(screen.getByTestId('home-article-detail-container')).toBeInTheDocument();
    expect(screen.getByTestId('article-detail-screen')).toBeInTheDocument();
    expect(screen.getByText('Як обрати правильний шампунь?')).toBeInTheDocument();
  });

  it('evaluates tab switching from promo detail screen cleanly navigates and resets', () => {
    render(
      <App
        initialScreen="promo_detail"
        initialPromoId="free-nail-trimming"
        skipSessionCheck
      />
    );

    expect(screen.getByTestId('promo-detail-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tab-pets'));
    expect(screen.getByTestId('pets-tab-container')).toBeInTheDocument();
    expect(screen.queryByTestId('promo-detail-screen')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tab-home'));
    expect(screen.queryByTestId('promo-detail-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('promo-discount-card')).toBeInTheDocument();
  });
});
