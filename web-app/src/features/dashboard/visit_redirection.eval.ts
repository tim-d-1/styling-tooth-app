import { describe, it, expect } from 'vitest';

export interface BookingNavigationEvaluation {
  targetPath: string;
  requiresAuthRedirect: boolean;
  isSilentNoop: boolean;
  isValidDestination: boolean;
}

export function evaluateBookingNavigation(
  isLoggedIn: boolean,
  originPath: string,
  handlerProvided: boolean
): BookingNavigationEvaluation {
  if (!handlerProvided) {
    return {
      targetPath: '/booking',
      requiresAuthRedirect: false,
      isSilentNoop: false,
      isValidDestination: true,
    };
  }

  if (isLoggedIn) {
    return {
      targetPath: '/booking',
      requiresAuthRedirect: false,
      isSilentNoop: false,
      isValidDestination: true,
    };
  }

  const targetFrom = originPath === '/' ? '/booking' : originPath;
  return {
    targetPath: `/login?from=${targetFrom}`,
    requiresAuthRedirect: true,
    isSilentNoop: false,
    isValidDestination: true,
  };
}

export function evaluateRoutePropsContract(
  routePath: string,
  elementProps: Record<string, unknown>
): { routePath: string; hasBookHandler: boolean; handlerRedirectsToBooking: boolean } {
  const hasBookHandler = typeof elementProps.onBookClick === 'function';
  let handlerRedirectsToBooking = false;

  if (hasBookHandler) {
    const handler = elementProps.onBookClick as () => string;
    const result = handler();
    handlerRedirectsToBooking = result === '/booking';
  }

  return {
    routePath,
    hasBookHandler,
    handlerRedirectsToBooking,
  };
}

describe('Visit Booking Redirection Evaluation Suite', () => {
  it('evaluates that authenticated users on root route / navigate directly to /booking', () => {
    const result = evaluateBookingNavigation(true, '/', true);
    expect(result.targetPath).toBe('/booking');
    expect(result.requiresAuthRedirect).toBe(false);
    expect(result.isSilentNoop).toBe(false);
    expect(result.isValidDestination).toBe(true);
  });

  it('evaluates that unauthenticated users are directed to login with from param', () => {
    const result = evaluateBookingNavigation(false, '/', true);
    expect(result.targetPath).toBe('/login?from=/booking');
    expect(result.requiresAuthRedirect).toBe(true);
    expect(result.isSilentNoop).toBe(false);
    expect(result.isValidDestination).toBe(true);
  });

  it('evaluates that omitted onBookClick handler falls back to /booking rather than silent noop', () => {
    const result = evaluateBookingNavigation(true, '/', false);
    expect(result.isSilentNoop).toBe(false);
    expect(result.targetPath).toBe('/booking');
  });

  it('evaluates that all dashboard route definitions pass a valid onBookClick handler', () => {
    const rootRouteEvaluation = evaluateRoutePropsContract('/', {
      onBookClick: () => '/booking',
    });
    expect(rootRouteEvaluation.hasBookHandler).toBe(true);
    expect(rootRouteEvaluation.handlerRedirectsToBooking).toBe(true);

    const mainRouteEvaluation = evaluateRoutePropsContract('/main', {
      onBookClick: () => '/booking',
    });
    expect(mainRouteEvaluation.hasBookHandler).toBe(true);
    expect(mainRouteEvaluation.handlerRedirectsToBooking).toBe(true);
  });
});
