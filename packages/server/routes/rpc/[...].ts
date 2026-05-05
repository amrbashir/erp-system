import { adminRpcHandler, buildContext, rpcHandler } from "@workspace/server/orpc/handler";
import { defineEventHandler } from "h3";

/**
 * Catch-all oRPC mount at /rpc/*. Picks AdminRouter when this build is
 * the admin deployment (DEPLOY_TARGET=admin) so `activations.list` /
 * `activations.toggleStatus` are never reachable from the public web
 * surface — that's the whole point of the split.
 */
const handler = process.env.DEPLOY_TARGET === "admin" ? adminRpcHandler : rpcHandler;

export default defineEventHandler(async (event) => {
	const { matched, response } = await handler.handle(event.req, {
		prefix: "/rpc",
		context: buildContext(event),
	});

	if (!matched) {
		event.res.status = 404;
		return { error: "Not Found" };
	}

	return response;
});
