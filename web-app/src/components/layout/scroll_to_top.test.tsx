import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

describe('ScrollToTop', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
  });

  it('scrolls to top on mount and pathname change', async () => {
    function TestNavigationComponent() {
      const navigate = useNavigate();
      return (
        <div>
          <ScrollToTop />
          <button type="button" onClick={() => navigate('/quick-schedule')}>
            Перейти
          </button>
        </div>
      );
    }

    const { getByRole } = render(
      <MemoryRouter initialEntries={['/']}>
        <TestNavigationComponent />
      </MemoryRouter>
    );

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    vi.mocked(window.scrollTo).mockClear();

    const btn = getByRole('button', { name: 'Перейти' });
    await act(async () => {
      btn.click();
    });

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  });
});
