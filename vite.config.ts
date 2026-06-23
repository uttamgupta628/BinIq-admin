import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: "./postcss.config.js",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/", // Adjust to '/my-app/' if deploying to a subfolder
  build: {
    outDir: "dist", // Default output directory
    minify: true, // Enable minification for production
    sourcemap: false, // Disable sourcemaps in production for smaller builds
    target: "esnext", // Target modern browsers (adjust if needed for older browsers)
  },
});
