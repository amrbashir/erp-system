import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { contract } from "@workspace/server/orpc/contract";

import { isDesktop } from "./activation";
import { getStoredToken } from "./api-fetch";
import { createServerClient } from "./orpc.server";
import { SIDECAR_URL } from "./sidecar";

type AppContract = typeof contract;

/**
 * Browser-side link.
 *  - web: same-origin `/api` (cookies travel for free)
 *  - desktop: sidecar URL + Bearer token (org scope is in the URL path)
 *
 * `OpenAPILink` needs the contract at runtime to look up each procedure's
 * REST method + path — that's why we import the browser-safe contract
 * module rather than the server router.
 */
function createBrowserClient(): ContractRouterClient<AppContract> {
	const link = new OpenAPILink(contract, {
		url: () => (isDesktop() ? `${SIDECAR_URL}/api` : `${window.location.origin}/api`),
		headers: () => {
			if (!isDesktop()) return {};
			const token = getStoredToken();
			return token ? { Authorization: `Bearer ${token}` } : {};
		},
	});
	return createORPCClient<ContractRouterClient<AppContract>>(link);
}

// The Start compiler rewrites this whole chain to just the per-env impl, so
// in the client bundle the `createServerClient` reference (and its `.server.ts`
// module) are statically eliminated — passing import-protection cleanly.
const getClient = createIsomorphicFn()
	.server(() => createServerClient())
	.client(() => createBrowserClient());

export const client: ContractRouterClient<AppContract> = getClient();

export const orpc = createTanstackQueryUtils(client);
