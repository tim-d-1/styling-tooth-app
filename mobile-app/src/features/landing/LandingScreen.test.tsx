import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LandingScreen } from './LandingScreen';

describe('LandingScreen', () => {
  it('renders landing hero content matching Figma frame 579:3061', () => {
    render(<LandingScreen />);

    expect(screen.getByTestId('landing-screen')).toBeInTheDocument();
    expect(screen.getByText(/ПРЕМІУМ/i)).toBeInTheDocument();
    expect(screen.getByText(/ГРУМІНГ/i)).toBeInTheDocument();
    expect(screen.getByText(/без черг і дзвінків/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Реєстрація' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Увійти' })).toBeInTheDocument();
  });

  it('triggers onRegisterClick and onLoginClick callbacks when pressed', () => {
    const onRegister = vi.fn();
    const onLogin = vi.fn();

    render(<LandingScreen onRegisterClick={onRegister} onLoginClick={onLogin} />);

    fireEvent.click(screen.getByRole('button', { name: 'Реєстрація' }));
    expect(onRegister).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Увійти' }));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});
