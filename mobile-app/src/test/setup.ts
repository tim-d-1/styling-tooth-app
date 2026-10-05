import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

(globalThis as any).__DEV__ = true;

vi.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaProvider: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'safe-area-provider' }, children),
    SafeAreaView: ({ children, style, testID, ...rest }: any) =>
      React.createElement('div', { 'data-testid': testID, style, ...rest }, children),
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 393, height: 852 }),
  };
});

vi.mock('react-native-svg', () => {
  const React = require('react');
  const SvgMock = ({ children, ...props }: any) => React.createElement('svg', props, children);
  const PathMock = (props: any) => React.createElement('path', props);
  const GMock = ({ children, ...props }: any) => React.createElement('g', props, children);
  return {
    __esModule: true,
    default: SvgMock,
    Svg: SvgMock,
    Path: PathMock,
    G: GMock,
  };
});

vi.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: vi.fn(),
  openAuthSessionAsync: vi.fn().mockResolvedValue({
    type: 'success',
    url: 'stylingtooth://?code=mock-oauth-code',
  }),
}));

vi.mock('expo-auth-session', () => ({
  makeRedirectUri: vi.fn().mockReturnValue('stylingtooth://auth/callback'),
}));

vi.mock('expo-linking', () => ({
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  getInitialURL: vi.fn().mockResolvedValue(null),
  createURL: vi.fn((path) => `stylingtooth://${path || ''}`),
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(null),
    removeItem: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://mock-avatar.jpg' }],
  }),
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
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'mock-new-user-id', email: 'newuser@example.com' } },
          error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
          error: null,
        }),
        signInWithOAuth: vi.fn().mockResolvedValue({
          data: { url: 'https://oauth.example.com' },
          error: null,
        }),
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'mock-user-id', email: 'google-user@example.com' } } },
          error: null,
        }),
        setSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'mock-user-id', email: 'google-user@example.com' } } },
          error: null,
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
        resend: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/mock.jpg' } }),
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  };
});
