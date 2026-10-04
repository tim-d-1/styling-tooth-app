import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders loading screen with logo and centered 2-line title', () => {
    render(<LoadingScreen />);

    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
    expect(screen.getByText(/СТИЛЬНИЙ/i)).toBeInTheDocument();
    expect(screen.getByText(/ЗУБЕЦЬ/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Логотип Стильний Зубець')).toBeInTheDocument();
  });
});
