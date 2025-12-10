import { defineConfig } from 'tsup';
import path from 'node:path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      skipLibCheck: true,
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'tailwindcss',
    '@radix-ui/*',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'cmdk',
    'date-fns',
    'lucide-react',
    'react-day-picker',
    'tailwindcss-animate',
    'react-hook-form',
    '@hookform/resolvers',
    'zod',
  ],
  esbuildOptions(options) {
    options.alias = {
      '@': path.resolve(__dirname, 'src'),
    };
  },
  treeshake: true,
  minify: true,
});

