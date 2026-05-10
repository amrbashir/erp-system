import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { type AppContext, buildContext } from "@workspace/server/orpc/context";
import { adminRouter, router } from "@workspace/server/orpc/router";
import { defineEventHandler } from "h3";

// Nitro routes more-specific paths first, so /api/health + /api/auth/* keep their dedicated handlers.
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
