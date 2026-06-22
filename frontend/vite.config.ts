import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/backend-api": {
        target:
          "https://21b6303d-55a8-42a9-b60f-a7f8c63d1ab1-dev.e1-us-east-azure.choreoapis.dev/test/backend/v1.0",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend-api/, ""),
        secure: true,
      },
    },
  },
  build: {
    outDir: "build",
  },
  resolve: {
    alias: {
      "@root": resolve(__dirname, "."),
      "@src": resolve(__dirname, "src"),
      "@app": resolve(__dirname, "src/app"),
      "@assets": resolve(__dirname, "src/assets"),
      "@component": resolve(__dirname, "src/component"),
      "@config": resolve(__dirname, "src/config"),
      "@context": resolve(__dirname, "src/context"),
      "@layout": resolve(__dirname, "src/layout"),
      "@slices": resolve(__dirname, "src/slices"),
      "@view": resolve(__dirname, "src/view"),
      "@utils": resolve(__dirname, "src/utils"),
      "@services": resolve(__dirname, "src/services"),
      "@/types": resolve(__dirname, "src/types"),
    },
  },
});
