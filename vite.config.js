import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    root: 'src',
    publicDir: '../public',
    base: './',
    logLevel: isProd ? 'warning' : 'info',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            phaser: ['phaser']
          }
        }
      },
      minify: isProd ? 'terser' : false,
      terserOptions: isProd ? {
        compress: { passes: 2 },
        mangle: true,
        format: { comments: false }
      } : undefined
    },
    server: {
      port: 8080
    }
  };
});
