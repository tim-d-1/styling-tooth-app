export type LandingSectionId = 'services' | 'about' | 'contacts' | 'home';

export const LANDING_SECTION_IDS: readonly LandingSectionId[] = [
  'services',
  'about',
  'contacts',
  'home',
];

export function isLandingSection(id: string): id is LandingSectionId {
  return LANDING_SECTION_IDS.includes(id as LandingSectionId);
}

export function scrollToSection(sectionId: string): boolean {
  if (typeof window === 'undefined') return false;

  if (sectionId === 'home') {
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return true;
  }

  if (typeof document === 'undefined') return false;
  const element = document.getElementById(sectionId);
  if (element) {
    if (typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    return true;
  }
  return false;
}

export function navigateToSection(
  sectionId: string,
  navigate?: (path: string) => void,
  isLoggedIn = false
): void {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  const isLanding = currentPath === '/landing' || (currentPath === '/' && !isLoggedIn);

  if (sectionId === 'home') {
    if (isLanding) {
      scrollToSection('home');
      try {
        window.history.replaceState(null, '', currentPath);
      } catch {
        void 0;
      }
    } else if (navigate) {
      navigate(isLoggedIn ? '/main' : '/');
    } else {
      window.location.href = isLoggedIn ? '/main' : '/';
    }
    return;
  }

  if (isLanding) {
    const scrolled = scrollToSection(sectionId);
    if (scrolled) {
      try {
        window.history.replaceState(null, '', `#${sectionId}`);
      } catch {
        void 0;
      }
    }
  } else {
    const targetUrl = `/landing#${sectionId}`;
    if (navigate) {
      navigate(targetUrl);
    } else {
      window.location.href = targetUrl;
    }
  }
}
