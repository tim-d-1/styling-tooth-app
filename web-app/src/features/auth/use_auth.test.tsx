import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

function TestConsumer() {
  const { role, isLoggedIn, isStaff, isAdmin, isReceptionist, isMaster, isClient } = useAuth();
  return (
    <div>
      <div data-testid="role">{role}</div>
      <div data-testid="isLoggedIn">{String(isLoggedIn)}</div>
      <div data-testid="isStaff">{String(isStaff)}</div>
      <div data-testid="isAdmin">{String(isAdmin)}</div>
      <div data-testid="isReceptionist">{String(isReceptionist)}</div>
      <div data-testid="isMaster">{String(isMaster)}</div>
      <div data-testid="isClient">{String(isClient)}</div>
    </div>
  );
}

describe('useAuth and AuthProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides initial role when specified', () => {
    render(
      <AuthProvider initialRole="admin">
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('role').textContent).toBe('admin');
    expect(screen.getByTestId('isAdmin').textContent).toBe('true');
    expect(screen.getByTestId('isStaff').textContent).toBe('true');
    expect(screen.getByTestId('isClient').textContent).toBe('false');
  });

  it('correctly resolves receptionist privileges', () => {
    render(
      <AuthProvider initialRole="receptionist">
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('role').textContent).toBe('receptionist');
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
    expect(screen.getByTestId('isReceptionist').textContent).toBe('true');
    expect(screen.getByTestId('isStaff').textContent).toBe('true');
    expect(screen.getByTestId('isClient').textContent).toBe('false');
  });

  it('correctly resolves master staff privileges', () => {
    render(
      <AuthProvider initialRole="master">
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('role').textContent).toBe('master');
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
    expect(screen.getByTestId('isMaster').textContent).toBe('true');
    expect(screen.getByTestId('isStaff').textContent).toBe('true');
  });

  it('defaults unauthenticated state to client', () => {
    render(
      <AuthProvider initialRole="client" initialProfile={null}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('role').textContent).toBe('client');
    expect(screen.getByTestId('isClient').textContent).toBe('true');
    expect(screen.getByTestId('isStaff').textContent).toBe('false');
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
  });
});
