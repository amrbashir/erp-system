import { registerSuperJsonExtensions } from "@erp-system/utils/super-json-ext.ts";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { serveDir, serveFile } from "@std/http/file-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { handleHealthCheck } from "./health/index.ts";
import { toOtelException } from "./otel/otel-exception.ts";
import { createContext } from "./trpc/index.ts";
import { appRouter } from "./trpc/router.ts";

registerSuperJsonExtensions();

async function fetchHandler(req: Request, pathname: string): Promise<Response> {
  // Handle API requests
  if (pathname.startsWith("/api")) {
    // Handle health check endpoint separately from tRPC requests
    if (pathname.startsWith("/api/health")) {
      return handleHealthCheck();
    }

    // tRPC request handling
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext,
    });
  }

  // Serve static files for all other requests
  // Serve static files from the packages/web/dist directory
  const staticFile = await serveDir(req, {
    fsRoot: import.meta.dirname + "/../../web/dist",
    urlRoot: "",
  });

  // If not found, fallback to index.html for SPA routing
  if (staticFile.status === 404) {
    return await serveFile(req, import.meta.dirname + "/../../web/dist/index.html");
  }

  return staticFile;
}

export default {
  async fetch(req) {
    const { pathname } = new URL(req.url);

    // Update the active span name to match the request path
    const span = trace.getActiveSpan();
    span?.updateName(pathname);

    // Catch and record any errors that occur during request handling
    try {
      const response = await fetchHandler(req, pathname);
      span?.setStatus({
        code: response.ok ? SpanStatusCode.OK : SpanStatusCode.ERROR,
        message: response.statusText,
      });
      return response;
    } catch (error) {
      span?.setStatus({ code: SpanStatusCode.ERROR });
      span?.recordException(toOtelException(error));
      return new Response("Internal Server Error", {
        status: 500,
        statusText: error instanceof Error ? error.message : String(error),
      });
    }
  },
} satisfies Deno.ServeDefaultExport;
