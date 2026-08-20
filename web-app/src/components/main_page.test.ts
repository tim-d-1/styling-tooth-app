import Header from './Header';
import LocationBar from './LocationBar';
import UpcomingVisitCard from './UpcomingVisitCard';
import PromoBannersGrid from './PromoBannersGrid';
import ExpertAdviceGrid from './ExpertAdviceGrid';
import VisitSection from './VisitSection';

export function calculateTotalPrice(basePrice: number, transferPrice: number, transferEnabled: boolean): number {
  return basePrice + (transferEnabled ? transferPrice : 0);
}

export function sanitizeStringProp(value: string | undefined, defaultValue: string): string {
  return value?.trim() || defaultValue;
}

export type VisitSectionState = 'guest_banner' | 'empty_state' | 'visit_card';

export function resolveVisitSectionState(isLoggedIn: boolean, hasVisit: boolean): VisitSectionState {
  if (!isLoggedIn) {
    return 'guest_banner';
  }
  if (!hasVisit) {
    return 'empty_state';
  }
  return 'visit_card';
}

export type HeaderActionState = 'login_button' | 'user_profile';

export function resolveHeaderActionState(isLoggedIn: boolean): HeaderActionState {
  return isLoggedIn ? 'user_profile' : 'login_button';
}

export function runMainPageSuite(): boolean {
  const components = [Header, LocationBar, UpcomingVisitCard, PromoBannersGrid, ExpertAdviceGrid, VisitSection];
  for (const comp of components) {
    if (!comp) {
      throw new Error('Main page component export missing');
    }
  }

  const basePrice = 1300;
  const transferPrice = 100;

  const priceWithoutTransfer = calculateTotalPrice(basePrice, transferPrice, false);
  if (priceWithoutTransfer !== 1300) {
    throw new Error(`Expected price without transfer to be 1300, got ${priceWithoutTransfer}`);
  }

  const priceWithTransfer = calculateTotalPrice(basePrice, transferPrice, true);
  if (priceWithTransfer !== 1400) {
    throw new Error(`Expected price with transfer to be 1400, got ${priceWithTransfer}`);
  }

  const fallbackTest = sanitizeStringProp('   ', 'СЕР');
  if (fallbackTest !== 'СЕР') {
    throw new Error(`Expected fallback value 'СЕР', got '${fallbackTest}'`);
  }

  const guestState = resolveVisitSectionState(false, false);
  if (guestState !== 'guest_banner') {
    throw new Error(`Expected guest_banner for logged out user, got ${guestState}`);
  }

  const guestStateWithVisit = resolveVisitSectionState(false, true);
  if (guestStateWithVisit !== 'guest_banner') {
    throw new Error(`Expected guest_banner when logged out even with visit data, got ${guestStateWithVisit}`);
  }

  const emptyState = resolveVisitSectionState(true, false);
  if (emptyState !== 'empty_state') {
    throw new Error(`Expected empty_state for logged in user without visit, got ${emptyState}`);
  }

  const visitState = resolveVisitSectionState(true, true);
  if (visitState !== 'visit_card') {
    throw new Error(`Expected visit_card for logged in user with visit, got ${visitState}`);
  }

  const loggedOutHeader = resolveHeaderActionState(false);
  if (loggedOutHeader !== 'login_button') {
    throw new Error(`Expected login_button for unauthenticated header, got ${loggedOutHeader}`);
  }

  const loggedInHeader = resolveHeaderActionState(true);
  if (loggedInHeader !== 'user_profile') {
    throw new Error(`Expected user_profile for authenticated header, got ${loggedInHeader}`);
  }

  return true;
}

runMainPageSuite();
