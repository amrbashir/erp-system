import type { ContractRouterClient } from "@orpc/contract";
import { createRouterClient } from "@orpc/server";
import { getRequest } from "@tanstack/react-start/server";
import type { contract } from "@workspace/server/orpc/contract";
import { buildContext } from "@workspace/server/orpc/context";
import { router } from "@workspace/server/orpc/router";

type AppContract = typeof contract;

/** In-process dispatch - no HTTP round-trip. Context factory binds the live Request via getRequest(). */
export function createServerClient(): ContractRouterClient<AppContract> {
	return createRouterClient(router, {
		context: () => buildContext(getRequest()),
	}) as ContractRouterClient<AppContract>;
}
