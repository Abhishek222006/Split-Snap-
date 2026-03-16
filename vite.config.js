import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    sourcemap: false, // disable in prod for smaller bundles
    rollupOptions: {
      output: {
        // bundle-dynamic-imports: split heavy chunks
        manualChunks: {
          vendor: ["react", "react-dom"],
          motion: ["framer-motion"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Avoids CORS in local dev — all /api calls go to backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
