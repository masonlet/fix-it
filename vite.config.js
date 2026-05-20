import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    root: 'src',
    publicDir: '../public',
    base: './',

    logLevel: isProd ? 'warning' : 'info',
    esbuild: isProd ? {
      legalComments: 'none'
    } : {},

    build: {
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            phaser: ['phaser']
          }
        }
      }
    },
    server: {
      port: 8080
    }
  };
});
