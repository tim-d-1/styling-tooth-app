import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LANDING_SECTION_IDS,
  isLandingSection,
  scrollToSection,
  navigateToSection,
} from './section_navigation';

describe('Section Navigation Evaluation Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('Eval 1: Section ID and Mapping Contract', () => {
    it('validates supported section IDs match navbar item specifications', () => {
      expect(LANDING_SECTION_IDS).toEqual(['services', 'about', 'contacts', 'home']);
      expect(isLandingSection('services')).toBe(true);
      expect(isLandingSection('about')).toBe(true);
      expect(isLandingSection('contacts')).toBe(true);
      expect(isLandingSection('home')).toBe(true);
      expect(isLandingSection('random')).toBe(false);
    });
  });

  describe('Eval 2: In-Page DOM Scroll Execution', () => {
    it('scrolls target element into view smoothly when target exists in DOM', () => {
      const section = document.createElement('section');
      section.id = 'services';
      const scrollSpy = vi.fn();
      section.scrollIntoView = scrollSpy;
      document.body.appendChild(section);

      const result = scrollToSection('services');
      expect(result).toBe(true);
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('returns false gracefully when target section does not exist in DOM', () => {
      const result = scrollToSection('nonexistent');
      expect(result).toBe(false);
    });

    it('scrolls window to top when home section is requested', () => {
      const windowScrollSpy = vi.fn();
      window.scrollTo = windowScrollSpy;

      const result = scrollToSection('home');
      expect(result).toBe(true);
      expect(windowScrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Eval 3: Cross-Route Navigation Target Resolution', () => {
    it('navigates to /landing#<section> when called outside of landing page', () => {
      window.history.pushState(null, '', '/main');
      const navigateSpy = vi.fn();

      navigateToSection('services', navigateSpy, true);
      expect(navigateSpy).toHaveBeenCalledWith('/landing#services');

      navigateToSection('about', navigateSpy, true);
      expect(navigateSpy).toHaveBeenCalledWith('/landing#about');

      navigateToSection('contacts', navigateSpy, true);
      expect(navigateSpy).toHaveBeenCalledWith('/landing#contacts');
    });

    it('resolves home navigation according to auth session state when outside landing', () => {
      window.history.pushState(null, '', '/profile');
      const navigateSpy = vi.fn();

      navigateToSection('home', navigateSpy, true);
      expect(navigateSpy).toHaveBeenCalledWith('/main');

      navigateToSection('home', navigateSpy, false);
      expect(navigateSpy).toHaveBeenCalledWith('/');
    });

    it('performs in-page smooth scroll and hash synchronization when already on landing page', () => {
      window.history.pushState(null, '', '/landing');
      const section = document.createElement('section');
      section.id = 'services';
      section.scrollIntoView = vi.fn();
      document.body.appendChild(section);

      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      const navigateSpy = vi.fn();

      navigateToSection('services', navigateSpy, false);
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#services');
    });
  });
});
