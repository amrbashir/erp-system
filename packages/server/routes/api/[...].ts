import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { type AppContext, buildContext } from "@workspace/server/orpc/context";
import { adminRouter, router } from "@workspace/server/orpc/router";
import { defineEventHandler } from "h3";

/**
 * Catch-all OpenAPI mount at /api/*. Routes carry their own paths via
 * `.route({ method, path })` metadata. Picks AdminRouter when this
 * build is the admin deployment (DEPLOY_TARGET=admin) so admin-only
 * procedures are never reachable from the public surface.
 *
 * Nitro routes more-specific paths first, so /api/health and
 * /api/auth/* still hit their dedicated handlers; this catch-all only
 * fires for everything else.
 */
const apiHandler = new OpenAPIHandler<AppContext>(router);
const adminApiHandler = new OpenAPIHandler<AppContext>(adminRouter);

const handler = process.env.DEPLOY_TARGET === "admin" ? adminApiHandler : apiHandler;

export default defineEventHandler(async (event) => {
	const { matched, response } = await handler.handle(event.req, {
		prefix: "/api",
		context: buildContext(event.req),
	});

	if (!matched) {
		event.res.status = 404;
		return { error: "Not Found" };
	}

	return response;
});
