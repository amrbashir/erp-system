import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [vue()],

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
