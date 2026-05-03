import { defineEventHandler } from "h3";

import { buildContext, rpcHandler } from "@workspace/server/orpc/handler";

/**
 * Catch-all oRPC mount at /rpc/*. The fetch adapter handles request
 * decoding/dispatch; we hand it `event.req` (a Web Request) and forward
 * its `Response`. `prefix` strips `/rpc` before the router match.
 *
 * `buildContext(event)` produces the per-request context: services +
 * the h3 event so middleware can read cookies/headers and write cookies.
 */
export default defineEventHandler(async (event) => {
	const { matched, response } = await rpcHandler.handle(event.req, {
		prefix: "/rpc",
		context: buildContext(event),
	});

	if (!matched) {
		event.res.status = 404;
		return { error: "Not Found" };
	}

	return response;
});
