export const STAFF_ROLES = ['admin', 'receptionist', 'master'] as const;

export function getStaffAppUrl(): string {
  if (typeof window !== 'undefined' && (window as any).__STAFF_APP_URL__) {
    return (window as any).__STAFF_APP_URL__;
  }
  if (import.meta.env.VITE_STAFF_APP_URL) {
    return import.meta.env.VITE_STAFF_APP_URL;
  }
  if (typeof process !== 'undefined' && process.env?.STAFF_APP_URL) {
    return process.env.STAFF_APP_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    window.location.port === '3000'
  ) {
    return 'http://localhost:5174';
  }
  return '/staff';
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'receptionist' || role === 'master';
}

export function redirectToStaffApp(role?: string | null): boolean {
  if (isStaffRole(role)) {
    const url = getStaffAppUrl();
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
    return true;
  }
  return false;
}
