import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

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
