import Header from './Header';
import LocationBar from './LocationBar';
import GuestBanner from './GuestBanner';
import VisitSection from './VisitSection';
import UpcomingVisitCard from './UpcomingVisitCard';
import PromoBannersGrid from './PromoBannersGrid';
import ExpertAdviceGrid from './ExpertAdviceGrid';

export function calculateTotalPrice(basePrice: number, transferPrice: number, transferEnabled: boolean): number {
  return basePrice + (transferEnabled ? transferPrice : 0);
}

export function sanitizeStringProp(value: string | undefined, defaultValue: string): string {
  return value?.trim() || defaultValue;
}

export type MainPageView = 'guest_banner' | 'empty_visits' | 'active_visit';

export function resolveMainPageView(isLoggedIn: boolean, hasVisit: boolean): MainPageView {
  if (!isLoggedIn) {
    return 'guest_banner';
  }
  if (!hasVisit) {
    return 'empty_visits';
  }
  return 'active_visit';
}

export type HeaderActionState = 'login_button' | 'user_profile';

export function resolveHeaderActionState(isLoggedIn: boolean): HeaderActionState {
  return isLoggedIn ? 'user_profile' : 'login_button';
}

export function runMainPageSuite(): boolean {
  const components = [
    Header,
    LocationBar,
    GuestBanner,
    VisitSection,
    UpcomingVisitCard,
    PromoBannersGrid,
    ExpertAdviceGrid,
  ];
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

  const locationFallback = sanitizeStringProp('', 'м. Запоріжжя');
  if (locationFallback !== 'м. Запоріжжя') {
    throw new Error(`Expected location fallback value 'м. Запоріжжя', got '${locationFallback}'`);
  }

  const guestView = resolveMainPageView(false, false);
  if (guestView !== 'guest_banner') {
    throw new Error(`Expected guest_banner for logged out user, got ${guestView}`);
  }

  const guestViewWithVisit = resolveMainPageView(false, true);
  if (guestViewWithVisit !== 'guest_banner') {
    throw new Error(`Expected guest_banner when logged out even with visit data, got ${guestViewWithVisit}`);
  }

  const emptyVisitView = resolveMainPageView(true, false);
  if (emptyVisitView !== 'empty_visits') {
    throw new Error(`Expected empty_visits for logged in user without visit, got ${emptyVisitView}`);
  }

  const activeVisitView = resolveMainPageView(true, true);
  if (activeVisitView !== 'active_visit') {
    throw new Error(`Expected active_visit for logged in user with visit, got ${activeVisitView}`);
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
