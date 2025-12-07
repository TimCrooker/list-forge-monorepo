import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      routeFileIgnorePrefix: '-',
      quoteStyle: 'single',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    commonjsOptions: {
      include: [/api-types/, /api-rtk/, /socket-types/, /node_modules/],
    },
  },
  optimizeDeps: {
    include: ['sonner', '@listforge/api-types'],
    exclude: ['@listforge/api-rtk', '@listforge/socket-types'], // Exclude workspace packages from pre-bundling
  },
  server: {
    port: 3000,
  },
});
