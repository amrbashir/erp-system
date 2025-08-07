import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { handleHealthCheck } from "./health/index.ts";

import "@erp-system/utils/super-json-ext.ts";

import { createContext } from "./trpc/index.ts";
import { appRouter } from "./trpc/router.ts";

export default {
  async fetch(req) {
    const { pathname } = new URL(req.url);

    if (pathname.startsWith("/health")) {
      return handleHealthCheck();
    }

    return await fetchRequestHandler({
      endpoint: "/trpc",
      req,
      router: appRouter,
      createContext,
    });
  },
} satisfies Deno.ServeDefaultExport;
