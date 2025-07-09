import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-oxc";
import { defineConfig, loadEnv } from "vite";

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

    build: {
      target: "esnext",
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    clearScreen: false, // don't clear the console
    server: {
      port: Number(env.VITE_DEV_PORT),
      strictPort: true,

      watch: {
        usePolling: !!process.env.DOCKER,
      },

      proxy: {
        "/api": {
          target: `${env.BACKEND_HOST || "http://localhost"}:${env.NESTJS_SERVER_PORT}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});

function manualChunks(id: string) {
  // Split shadcn components into a separate chunk
  if (id.includes("shadcn/components/ui")) {
    return "vendor/shadcn-" + id.toString().split("shadcn/components/ui")[1].split("/")[1];
  }

  // Split i18next into a separate chunk
  if (id.includes("i18next")) {
    return "vendor/i18next";
  }

  // Split @tanstack/react-query into a separate chunk
  if (id.includes("@tanstack/react-query")) {
    return "vendor/react-query";
  }

  // Split @tanstack/form into a separate chunk
  if (id.includes("@tanstack/form")) {
    return "vendor/react-form";
  }

  // Split @radix-ui into a separate chunk
  if (id.includes("@radix-ui")) {
    return "vendor/radix-" + id.toString().split("@radix-ui/")[1].split("/")[0];
  }

  // Split react-router into a separate chunk
  if (id.includes("@tanstack/react-router")) {
    return "vendor/react-router";
  }

  // Split lucide-react into a separate chunk
  if (id.includes("lucide-react")) {
    return "vendor/lucide-react";
  }
}
