import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    root: 'src',
    publicDir: '../public',
    base: './',

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
