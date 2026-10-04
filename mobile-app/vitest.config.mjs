import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', '*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'expo-linear-gradient': path.resolve(import.meta.dirname, './src/test/mocks/linearGradientMock.tsx'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
