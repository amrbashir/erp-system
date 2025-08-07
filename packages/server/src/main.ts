import { serveDir, serveFile } from "@std/http/file-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { handleHealthCheck } from "./health/index.ts";

import "@erp-system/utils/super-json-ext.ts";

import { createContext } from "./trpc/index.ts";
import { appRouter } from "./trpc/router.ts";

export default {
  async fetch(req) {
    // Serve static files from the ../web/dist directory
    const response = await serveDir(req, { fsRoot: "../web/dist" });

    // If the requested file is not found, serve index.html for SPA routing
    if (response.status === 404) {
      return await serveFile(req, "./dist/index.html");
    }

    const { pathname } = new URL(req.url);

    if (pathname.startsWith("/api/health")) {
      return handleHealthCheck();
    }

    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext,
    });
  },
} satisfies Deno.ServeDefaultExport;
