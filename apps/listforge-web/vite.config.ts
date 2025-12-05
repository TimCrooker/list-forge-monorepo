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
      include: [/api-types/, /api-rtk/, /node_modules/],
    },
  },
  optimizeDeps: {
    include: ['sonner', '@listforge/api-types'],
    exclude: ['@listforge/api-rtk'], // Exclude from pre-bundling to always use latest workspace version
  },
  server: {
    port: 3000,
  },
});
