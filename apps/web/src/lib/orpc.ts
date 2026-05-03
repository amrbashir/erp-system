import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@workspace/server/orpc/router";

import { isDesktop } from "./activation";
import { getStoredToken } from "./api-fetch";

const SIDECAR_URL = (import.meta as any).env?.VITE_SIDECAR_URL || "http://localhost:11435";

/**
 * RPCLink — picks transport based on platform.
 * - web: same-origin `/rpc` (cookies travel for free)
 * - desktop: sidecar URL + Bearer token + X-Org-Id from localStorage
 *
 * Headers run per-request so we always read the freshest token/org id.
 */
const link = new RPCLink({
	url: () => (isDesktop() ? `${SIDECAR_URL}/rpc` : "/rpc"),
	headers: () => {
		if (!isDesktop()) return {};
		const token = getStoredToken();
		const orgId =
			typeof localStorage === "undefined" ? null : localStorage.getItem("current_org_id");
		const h: Record<string, string> = {};
		if (token) h.Authorization = `Bearer ${token}`;
		if (orgId) h["X-Org-Id"] = orgId;
		return h;
	},
});

/** Plain typed client — `client.ping()`, `client.orgs.create({...})` etc. */
export const client: RouterClient<AppRouter> = createORPCClient(link);

/** TanStack Query utils — `orpc.ping.queryOptions()`, `orpc.orgs.create.mutationOptions()` etc. */
export const orpc = createTanstackQueryUtils(client);
