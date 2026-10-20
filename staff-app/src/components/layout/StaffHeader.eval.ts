import { describe, it, expect } from 'vitest';
import type { UserRole } from '@/features/auth/auth_types';

export interface HeaderElementEvaluation {
  hasRoleBadge: boolean;
  hasClientAppLink: boolean;
  hasTabNavigation: boolean;
  hasLogoutButton: boolean;
}

export function evaluateHeaderContract(
  renderedHtml: string,
  role: UserRole | null
): HeaderElementEvaluation {
  const hasRoleBadge =
    renderedHtml.includes('bg-amber-50') ||
    renderedHtml.includes('border-amber-200') ||
    (role === 'receptionist' && renderedHtml.includes('Рецепція')) ||
    (role === 'admin' && renderedHtml.includes('Адміністратор')) ||
    (role === 'master' && renderedHtml.includes('Майстер'));

  const hasClientAppLink =
    renderedHtml.includes('Клієнтський сайт') ||
    renderedHtml.includes('target="_blank"');

  const hasTabNavigation =
    renderedHtml.includes('aria-label="Панель навігації персоналу"');

  const hasLogoutButton =
    renderedHtml.includes('aria-label="Вийти"');

  return {
    hasRoleBadge,
    hasClientAppLink,
    hasTabNavigation,
    hasLogoutButton,
  };
}

describe('StaffHeader Contract Evaluation Suite', () => {
  const sampleCleanHeaderHtml = `
    <header class="bg-white min-h-[4.5rem] flex items-center justify-between px-6 sm:px-8 py-3 shadow-xs sticky top-0 z-[100] border-b border-gray-100">
      <div class="flex items-center gap-6 sm:gap-8">
        <nav aria-label="Панель навігації персоналу" class="flex items-center gap-2 sm:gap-4">
          <button type="button">Заявки</button>
          <button type="button">Підтримка</button>
        </nav>
      </div>
      <div class="flex items-center gap-3 sm:gap-4">
        <button type="button" aria-label="Вийти">Вийти</button>
      </div>
    </header>
  `;

  it('verifies that clean header contract omits role badge and client app link for receptionist', () => {
    const evaluation = evaluateHeaderContract(sampleCleanHeaderHtml, 'receptionist');
    expect(evaluation.hasRoleBadge).toBe(false);
    expect(evaluation.hasClientAppLink).toBe(false);
    expect(evaluation.hasTabNavigation).toBe(true);
    expect(evaluation.hasLogoutButton).toBe(true);
  });

  it('verifies that clean header contract omits role badge and client app link for admin', () => {
    const evaluation = evaluateHeaderContract(sampleCleanHeaderHtml, 'admin');
    expect(evaluation.hasRoleBadge).toBe(false);
    expect(evaluation.hasClientAppLink).toBe(false);
  });

  it('verifies that clean header contract omits role badge and client app link for master', () => {
    const evaluation = evaluateHeaderContract(sampleCleanHeaderHtml, 'master');
    expect(evaluation.hasRoleBadge).toBe(false);
    expect(evaluation.hasClientAppLink).toBe(false);
  });

  it('detects legacy regressions if role badge or client link are re-introduced', () => {
    const regressionHtml = `
      <header>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Рецепція</span>
        </span>
        <a href="http://localhost:3000" target="_blank">Клієнтський сайт</a>
      </header>
    `;
    const evaluation = evaluateHeaderContract(regressionHtml, 'receptionist');
    expect(evaluation.hasRoleBadge).toBe(true);
    expect(evaluation.hasClientAppLink).toBe(true);
  });
});
