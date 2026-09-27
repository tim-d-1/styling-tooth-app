import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DetailCardLayout from './DetailCardLayout';

describe('DetailCardLayout', () => {
  it('renders children, header, footer and handles back click', () => {
    const handleBack = vi.fn();
    const handleLogin = vi.fn();

    render(
      <DetailCardLayout
        onBackClick={handleBack}
        onLoginClick={handleLogin}
        isLoggedIn={false}
      >
        <div data-testid="test-content">Тестовий вміст картки</div>
      </DetailCardLayout>
    );

    expect(screen.getByTestId('test-content')).toBeDefined();
    expect(screen.getByRole('button', { name: /Вхід \/ Реєстрація/i })).toBeDefined();
    expect(screen.getByText('© 2026 Стильний зубець. Усі права захищено.')).toBeDefined();

    const backButton = screen.getByRole('button', { name: 'Назад' });
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders without back button if onBackClick is omitted', () => {
    render(
      <DetailCardLayout>
        <div>Вміст без кнопки назад</div>
      </DetailCardLayout>
    );

    expect(screen.queryByRole('button', { name: 'Назад' })).toBeNull();
  });
});
