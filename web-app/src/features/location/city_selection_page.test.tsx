import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CitySelectionPage from './CitySelectionPage';
import { CITY_STORAGE_KEY } from './city_types';

describe('CitySelectionPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders heading and 10 cities matching Figma frame 1056:3257', () => {
    render(<CitySelectionPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Оберіть своє місто' })
    ).toBeDefined();

    expect(screen.getByRole('radio', { name: 'Біла Церква' })).toBeDefined();
    expect(screen.getAllByRole('radio', { name: 'Дніпро' })).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Київ' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Запоріжжя' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Львів' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Одеса' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Полтава' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Харків' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Хмельницький' })).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Підтвердити' })
    ).toBeDefined();
  });

  it('selects Kyiv by default', () => {
    render(<CitySelectionPage />);

    const kyivBtn = screen.getByRole('radio', { name: 'Київ' });
    expect(kyivBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('allows selecting another city and confirms selection', () => {
    const handleConfirm = vi.fn();
    const handleBack = vi.fn();

    render(
      <CitySelectionPage onConfirm={handleConfirm} onBackClick={handleBack} />
    );

    const lvivBtn = screen.getByRole('radio', { name: 'Львів' });
    fireEvent.click(lvivBtn);

    expect(lvivBtn.getAttribute('aria-checked')).toBe('true');
    const kyivBtn = screen.getByRole('radio', { name: 'Київ' });
    expect(kyivBtn.getAttribute('aria-checked')).toBe('false');

    const confirmBtn = screen.getByRole('button', { name: 'Підтвердити' });
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith('Львів');
    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(CITY_STORAGE_KEY)).toBe('Львів');
  });

  it('respects initialCity prop', () => {
    render(<CitySelectionPage initialCity="Одеса" />);

    const odesaBtn = screen.getByRole('radio', { name: 'Одеса' });
    expect(odesaBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('reads initial city from localStorage if present', () => {
    localStorage.setItem(CITY_STORAGE_KEY, 'Харків');
    render(<CitySelectionPage />);

    const kharkivBtn = screen.getByRole('radio', { name: 'Харків' });
    expect(kharkivBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('calls onBackClick when clicking back arrow', () => {
    const handleBack = vi.fn();
    render(<CitySelectionPage onBackClick={handleBack} />);

    const backBtn = screen.getByRole('button', { name: 'Назад' });
    fireEvent.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('supports custom cities list', () => {
    const customCities = [
      { id: 'city-1', name: 'Ужгород' },
      { id: 'city-2', name: 'Чернівці' },
    ];

    render(<CitySelectionPage cities={customCities} initialCity="Чернівці" />);

    expect(screen.getByRole('radio', { name: 'Ужгород' })).toBeDefined();
    const chernivtsiBtn = screen.getByRole('radio', { name: 'Чернівці' });
    expect(chernivtsiBtn.getAttribute('aria-checked')).toBe('true');
  });
});
