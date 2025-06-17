import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    clearScreen: false, // don't clear the console, for Tauri]
    server: {
      port: Number(env.VITE_DEV_PORT),
      strictPort: true, // for Tauri

      proxy: {
        "/api": {
          target: `http://localhost:${env.NESTJS_SERVER_PORT}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
