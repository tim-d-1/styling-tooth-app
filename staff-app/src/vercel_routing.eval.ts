import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function resolveVercelRoute(
  pathname: string,
  rewrites: Array<{ source: string; destination: { service: string; path?: string } }>
) {
  for (const rule of rewrites) {
    const regexPattern = '^' + rule.source.replace(/\(\.\*\)/g, '(.*)') + '$';
    const regex = new RegExp(regexPattern);
    const match = pathname.match(regex);
    if (match) {
      let destPath = rule.destination.path;
      if (destPath && match[1] !== undefined) {
        destPath = destPath.replace('$1', match[1]);
      }
      return {
        service: rule.destination.service,
        path: destPath,
      };
    }
  }
  return null;
}

describe('Vercel Routing Security & Edge Cases Eval', () => {
  const vercelJsonPath = path.resolve(import.meta.dirname, '../../vercel.json');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

  const staffSubroutes = [
    '/staff/requests',
    '/staff/requests/detail/123',
    '/staff/support',
    '/staff/support/chat',
    '/staff/support/ticket/456',
    '/staff/login',
    '/staff/admin',
    '/staff/settings',
  ];

  it('evaluates all staff subroutes map to index.html with 100% precision', () => {
    for (const subroute of staffSubroutes) {
      const match = resolveVercelRoute(subroute, vercelConfig.rewrites);
      expect(match).toEqual({
        service: 'staff-app',
        path: '/index.html',
      });
    }
  });

  const staffAssetPatterns = [
    { input: '/staff/assets/main.js', expected: '/assets/main.js' },
    { input: '/staff/assets/chunk-123.css', expected: '/assets/chunk-123.css' },
    { input: '/staff/assets/fonts/font.woff2', expected: '/assets/fonts/font.woff2' },
    { input: '/staff/assets/images/pet.webp', expected: '/assets/images/pet.webp' },
    { input: '/staff/assets/logos/logo.svg', expected: '/assets/logos/logo.svg' },
  ];

  it('evaluates asset path stripping preserves nested directory structures', () => {
    for (const { input, expected } of staffAssetPatterns) {
      const match = resolveVercelRoute(input, vercelConfig.rewrites);
      expect(match).toEqual({
        service: 'staff-app',
        path: expected,
      });
    }
  });

  const webRoutes = [
    '/',
    '/booking',
    '/booking/confirmation',
    '/account',
    '/profile',
    '/profile/addresses',
    '/profile/loyalty',
    '/faq',
    '/assets/logos/logo-mark.svg',
    '/assets/icons/fi-rr-paw.svg',
  ];

  it('evaluates web customer routes never route to staff-app', () => {
    for (const webRoute of webRoutes) {
      const match = resolveVercelRoute(webRoute, vercelConfig.rewrites);
      expect(match?.service).toBe('web-app');
    }
  });

  it('evaluates that no circular service bindings exist', () => {
    const services = vercelConfig.services;
    for (const [srvName, srvObj] of Object.entries<any>(services)) {
      const callerBindings = srvObj.bindings || [];
      for (const binding of callerBindings) {
        const target = services[binding.service];
        const targetBindings = target?.bindings || [];
        const circular = targetBindings.some((b: any) => b.service === srvName);
        expect(circular).toBe(false);
      }
    }
  });
});
