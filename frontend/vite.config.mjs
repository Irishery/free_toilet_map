import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // <-- важно для правильных путей к статике
  server: {
    proxy: {
      "/toilets": {
        target: process.env.VITE_API_URL || "http://localhost:8080",
        changeOrigin: true,
      },
      "/user": {
        target: process.env.VITE_API_URL || "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
