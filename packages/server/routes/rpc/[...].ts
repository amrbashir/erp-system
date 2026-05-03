import { defineEventHandler } from "h3";

import { rpcHandler } from "@workspace/server/orpc/handler";

/**
 * Catch-all oRPC mount at /rpc/*. The fetch adapter handles request
 * decoding/dispatch; we hand it `event.req` (a Web Request) and forward
 * its `Response`. `prefix` strips `/rpc` before the router match.
 *
 * Anything not matched (404 from oRPC) propagates as a 404 to the client.
 */
export default defineEventHandler(async (event) => {
	const { matched, response } = await rpcHandler.handle(event.req, {
		prefix: "/rpc",
		context: { event },
	});

	if (!matched) {
		event.res.status = 404;
		return { error: "Not Found" };
	}

	return response;
});
