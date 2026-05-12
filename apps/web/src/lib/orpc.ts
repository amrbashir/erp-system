import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { IS_DESKTOP, SIDECAR_URL } from "@workspace/desktop";
import { contract } from "@workspace/server/orpc/contract";

import { createServerClient } from "./orpc.server";

type AppContract = typeof contract;

/** Desktop: sidecar URL + `credentials: include` for cross-origin cookies (SameSite=None+Secure+Partitioned). Web: same-origin `/api`. */
function createBrowserClient(): ContractRouterClient<AppContract> {
	const link = IS_DESKTOP
		? new OpenAPILink(contract, {
				url: `${SIDECAR_URL}/api`,
				fetch: (request, init) => fetch(request, { ...init, credentials: "include" }),
			})
		: new OpenAPILink(contract, { url: `${window.location.origin}/api` });
	return createORPCClient<ContractRouterClient<AppContract>>(link);
}

// Start compiler eliminates `createServerClient` (and its `.server.ts`) from the client bundle.
const getClient = createIsomorphicFn()
	.server(() => createServerClient())
	.client(() => createBrowserClient());

export const client: ContractRouterClient<AppContract> = getClient();

export const orpc = createTanstackQueryUtils(client);
