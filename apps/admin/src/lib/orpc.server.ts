import type { ContractRouterClient } from "@orpc/contract";
import { createRouterClient } from "@orpc/server";
import { getRequest } from "@tanstack/react-start/server";
import type { adminContract } from "@workspace/server/orpc/contract";
import { buildContext } from "@workspace/server/orpc/context";
import { adminRouter } from "@workspace/server/orpc/router";

type AdminContract = typeof adminContract;

/**
 * SSR-side admin client. `context` is a factory so each procedure call
 * binds the live Request via `getRequest()`. `.server.ts` filename is
 * stripped from the client bundle by the isomorphic chain in `orpc.ts`.
 */
export function createServerClient(): ContractRouterClient<AdminContract> {
	return createRouterClient(adminRouter, {
		context: () => buildContext(getRequest()),
	}) as ContractRouterClient<AdminContract>;
}
