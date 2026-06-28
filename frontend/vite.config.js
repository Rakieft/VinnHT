import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          marketplace: ["swiper", "swiper/react", "swiper/modules"],
          visuals: ["lucide-react", "react-countup"],
          http: ["axios"],
        },
      },
    },
  },
});
