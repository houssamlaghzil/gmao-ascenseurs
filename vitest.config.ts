import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Les tests portent sur la logique métier et la structure du dépôt, pas sur
    // le DOM : 'jsdom' rendait toute la suite inexécutable (dépendance absente).
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
