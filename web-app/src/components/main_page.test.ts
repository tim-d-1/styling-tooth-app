import Header from './Header';
import LocationBar from './LocationBar';
import UpcomingVisitCard from './UpcomingVisitCard';
import PromoBannersGrid from './PromoBannersGrid';
import ExpertAdviceGrid from './ExpertAdviceGrid';

export function calculateTotalPrice(basePrice: number, transferPrice: number, transferEnabled: boolean): number {
  return basePrice + (transferEnabled ? transferPrice : 0);
}

export function sanitizeStringProp(value: string | undefined, defaultValue: string): string {
  return value?.trim() || defaultValue;
}

export function runMainPageSuite(): boolean {
  const components = [Header, LocationBar, UpcomingVisitCard, PromoBannersGrid, ExpertAdviceGrid];
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

  return true;
}

runMainPageSuite();
