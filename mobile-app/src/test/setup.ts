import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(null),
    removeItem: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
          error: null,
        }),
        signInWithOAuth: vi.fn().mockResolvedValue({
          data: { url: 'https://oauth.example.com' },
          error: null,
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  };
});
