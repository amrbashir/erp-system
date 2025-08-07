import deno from "@deno/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      addExtensions: true,
      routeTreeFileHeader: ["// deno-lint-ignore-file no-explicit-any"],
    }),
    react(),
    tailwindcss(),
    deno(),
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
      "@": "./src",
    },
  },

  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), // remove /api prefix
      },
    },
  },
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
