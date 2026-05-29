import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      react(),
      isAnalyze &&
        visualizer({
          filename: 'dist/stats.html',
          template: 'treemap',
          gzipSize: true,
          brotliSize: true,
          open: true,
        }),
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    build: {
      rollupOptions: {
        output: {
          // No `manualChunks` — Vite 8 / Rolldown's auto-splitter does a
          // better job than our hand-rolled rules did. Dynamic imports
          // (e.g. `await import("@sentry/react")` in src/core/sentry) get
          // their own chunk automatically, which is what we wanted from
          // the old `sentry-*` chunk rules anyway.
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
        // Externalize virtual modules in production
        external: isDev ? [] : ['virtual:*'],
      },
      // Optimize chunk size thresholds
      chunkSizeWarningLimit: 500, // Warn about chunks larger than 500kb
      target: 'esnext', // Use modern JS for smaller bundles
      minify: isDev ? false : 'terser', // Only minify in production
      sourcemap: isDev ? true : false, // Source maps only in dev
      cssCodeSplit: true, // Split CSS into separate files
    },
    // Enable gzip compression
    server: {
      host: true,
    },
  };
});
