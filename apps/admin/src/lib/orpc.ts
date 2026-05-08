import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { adminContract } from "@workspace/server/orpc/contract";

import { createServerClient } from "./orpc.server";

type AdminContract = typeof adminContract;

/**
 * Browser-side link: same-origin `/api` (cookies travel for free). The
 * admin Nitro server mounts `AdminRouter` at `/api` (gated by
 * DEPLOY_TARGET=admin), so the same path serves admin procedures here.
 */
function createBrowserClient(): ContractRouterClient<AdminContract> {
	const link = new OpenAPILink(adminContract, {
		url: `${window.location.origin}/api`,
	});
	return createORPCClient<ContractRouterClient<AdminContract>>(link);
}

// The Start compiler rewrites this chain to just the per-env impl, so the
// `createServerClient` import vanishes from the client bundle before tree
// shaking — keeps import-protection happy.
const getClient = createIsomorphicFn()
	.server(() => createServerClient())
	.client(() => createBrowserClient());

export const client: ContractRouterClient<AdminContract> = getClient();

export const orpc = createTanstackQueryUtils(client);
