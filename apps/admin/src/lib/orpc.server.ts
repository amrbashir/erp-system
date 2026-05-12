import type { ContractRouterClient } from "@orpc/contract";
import { createRouterClient } from "@orpc/server";
import { getRequest } from "@tanstack/react-start/server";
import { buildContext } from "@workspace/server/orpc/context";
import type { adminContract } from "@workspace/server/orpc/contract";
import { adminRouter } from "@workspace/server/orpc/router";

type AdminContract = typeof adminContract;

/** Context is a factory so each call binds the live Request via getRequest(). */
export function createServerClient(): ContractRouterClient<AdminContract> {
	return createRouterClient(adminRouter, {
		context: () => buildContext(getRequest()),
	}) as ContractRouterClient<AdminContract>;
}
