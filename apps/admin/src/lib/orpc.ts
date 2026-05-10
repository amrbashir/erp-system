import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { adminContract } from "@workspace/server/orpc/contract";

import { createServerClient } from "./orpc.server";

type AdminContract = typeof adminContract;

/** Same-origin `/api` - admin Nitro server mounts AdminRouter there (gated by DEPLOY_TARGET=admin). */
function createBrowserClient(): ContractRouterClient<AdminContract> {
	const link = new OpenAPILink(adminContract, {
		url: `${window.location.origin}/api`,
	});
	return createORPCClient<ContractRouterClient<AdminContract>>(link);
}

// Start compiler eliminates `createServerClient` from the client bundle.
const getClient = createIsomorphicFn()
	.server(() => createServerClient())
	.client(() => createBrowserClient());

export const client: ContractRouterClient<AdminContract> = getClient();

export const orpc = createTanstackQueryUtils(client);
