import type { ContractRouterClient } from "@orpc/contract";
import { createRouterClient } from "@orpc/server";
import { getRequest } from "@tanstack/react-start/server";
import type { contract } from "@workspace/server/orpc/contract";
import { buildContext } from "@workspace/server/orpc/context";
import { router } from "@workspace/server/orpc/router";

type AppContract = typeof contract;

/**
 * SSR-side client: dispatches procedures in-process — no HTTP round-trip.
 * `context` is a factory so each procedure call binds the live Request
 * (cookies/auth) via `getRequest()`.
 *
 * `.server.ts` filename: import-protection denies on the client; the
 * isomorphic chain in `orpc.ts` strips this import from the client bundle.
 */
export function createServerClient(): ContractRouterClient<AppContract> {
	return createRouterClient(router, {
		context: () => buildContext(getRequest()),
	}) as ContractRouterClient<AppContract>;
}
