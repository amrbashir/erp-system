import { serveDir, serveFile } from "@std/http/file-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { handleHealthCheck } from "./health/index.ts";

import "@erp-system/utils/super-json-ext.ts";

import { createContext } from "./trpc/index.ts";
import { appRouter } from "./trpc/router.ts";

Deno.cron("Delete non-persistent organizations", { hour: { every: 1 } }, () => {
  console.log("This Delete non-persistent organizations");
});

export default {
  async fetch(req) {
    const { pathname } = new URL(req.url);

    // Handle API requests
    if (pathname.startsWith("/api")) {
      if (pathname.startsWith("/api/health")) {
        return handleHealthCheck();
      }

      return await fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext,
      });
    }

    // Serve static files from the ../web/dist directory
    const response = await serveDir(req, {
      fsRoot: import.meta.dirname + "/../../web/dist",
      urlRoot: "",
    });

    // If the requested file is not found, serve index.html for SPA routing
    if (response.status === 404) {
      return await serveFile(req, import.meta.dirname + "/../../web/dist/index.html");
    }

    return response;
  },
} satisfies Deno.ServeDefaultExport;
