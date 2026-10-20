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

describe('Vercel Services Routing Configuration', () => {
  const vercelJsonPath = path.resolve(import.meta.dirname, '../../vercel.json');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

  it('declares staff-app and web-app services with vite framework', () => {
    expect(vercelConfig.services).toBeDefined();
    expect(vercelConfig.services['staff-app']).toBeDefined();
    expect(vercelConfig.services['staff-app'].root).toBe('staff-app');
    expect(vercelConfig.services['staff-app'].framework).toBe('vite');

    expect(vercelConfig.services['web-app']).toBeDefined();
    expect(vercelConfig.services['web-app'].root).toBe('web-app');
    expect(vercelConfig.services['web-app'].framework).toBe('vite');
  });

  it('configures SPA fallback rewrites within each service', () => {
    expect(vercelConfig.services['staff-app'].rewrites).toEqual([
      { source: '/(.*)', destination: '/index.html' },
    ]);
    expect(vercelConfig.services['web-app'].rewrites).toEqual([
      { source: '/(.*)', destination: '/index.html' },
    ]);
  });

  it('binds staff-app to web-app with STAFF_APP_URL', () => {
    const bindings = vercelConfig.services['web-app'].bindings;
    expect(bindings).toContainEqual({
      type: 'service',
      service: 'staff-app',
      format: 'url',
      env: 'STAFF_APP_URL',
    });
  });

  it('routes /staff and /staff/ to staff-app index.html', () => {
    const resExact = resolveVercelRoute('/staff', vercelConfig.rewrites);
    expect(resExact).toEqual({
      service: 'staff-app',
      path: '/index.html',
    });

    const resSlash = resolveVercelRoute('/staff/', vercelConfig.rewrites);
    expect(resSlash).toEqual({
      service: 'staff-app',
      path: '/index.html',
    });
  });

  it('routes /staff client-side subroutes to staff-app index.html', () => {
    const resLogin = resolveVercelRoute('/staff/login', vercelConfig.rewrites);
    expect(resLogin).toEqual({
      service: 'staff-app',
      path: '/index.html',
    });

    const resRequests = resolveVercelRoute('/staff/requests', vercelConfig.rewrites);
    expect(resRequests).toEqual({
      service: 'staff-app',
      path: '/index.html',
    });

    const resSupport = resolveVercelRoute('/staff/support', vercelConfig.rewrites);
    expect(resSupport).toEqual({
      service: 'staff-app',
      path: '/index.html',
    });
  });

  it('routes /staff/assets/* to staff-app assets without /staff prefix', () => {
    const resJs = resolveVercelRoute('/staff/assets/index-BkleKGAD.js', vercelConfig.rewrites);
    expect(resJs).toEqual({
      service: 'staff-app',
      path: '/assets/index-BkleKGAD.js',
    });

    const resCss = resolveVercelRoute('/staff/assets/index-CJDHW2vl.css', vercelConfig.rewrites);
    expect(resCss).toEqual({
      service: 'staff-app',
      path: '/assets/index-CJDHW2vl.css',
    });

    const resLogo = resolveVercelRoute(
      '/staff/assets/logos/logo-mark-transparent.svg',
      vercelConfig.rewrites
    );
    expect(resLogo).toEqual({
      service: 'staff-app',
      path: '/assets/logos/logo-mark-transparent.svg',
    });
  });

  it('routes non-staff paths to web-app', () => {
    const resRoot = resolveVercelRoute('/', vercelConfig.rewrites);
    expect(resRoot?.service).toBe('web-app');

    const resBooking = resolveVercelRoute('/booking', vercelConfig.rewrites);
    expect(resBooking?.service).toBe('web-app');

    const resProfile = resolveVercelRoute('/profile/addresses', vercelConfig.rewrites);
    expect(resProfile?.service).toBe('web-app');

    const resWebAssets = resolveVercelRoute(
      '/assets/icons/fi-rr-paw.svg',
      vercelConfig.rewrites
    );
    expect(resWebAssets?.service).toBe('web-app');
  });

  it('orders rewrites with assets before catch-all and web-app last', () => {
    const sources = vercelConfig.rewrites.map(
      (r: { source: string }) => r.source
    );
    const assetIdx = sources.indexOf('/staff/assets/(.*)');
    const staffCatchAllIdx = sources.indexOf('/staff/(.*)');
    const webCatchAllIdx = sources.indexOf('/(.*)');

    expect(assetIdx).toBeGreaterThanOrEqual(0);
    expect(staffCatchAllIdx).toBeGreaterThan(assetIdx);
    expect(webCatchAllIdx).toBeGreaterThan(staffCatchAllIdx);
  });
});
