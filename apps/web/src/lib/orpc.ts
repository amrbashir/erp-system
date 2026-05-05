import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouter } from "@workspace/server/orpc/router";

import { isDesktop } from "./activation";
import { getStoredToken } from "./api-fetch";
import { SIDECAR_URL } from "./sidecar";

/**
 * Browser-side link.
 *  - web: same-origin `/rpc` (cookies travel for free)
 *  - desktop: sidecar URL + Bearer token + X-Org-Id from localStorage
 */
function createBrowserClient(): RouterClient<AppRouter> {
	const link = new RPCLink({
		url: () => (isDesktop() ? `${SIDECAR_URL}/rpc` : `${window.location.origin}/rpc`),
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
	return createORPCClient(link);
}

/**
 * SSR-side client: dispatches procedures in-process via `createRouterClient`
 * — no HTTP round-trip. Reads the current Request from TanStack Start so
 * middleware can resolve session/cookies.
 *
 * The deep proxy defers the dynamic imports until the first procedure call
 * (any depth: `client.ping`, `client.orgs.list`, …) so server-only modules
 * never reach the browser bundle.
 */
function createServerClient(): RouterClient<AppRouter> {
	type AnyFn = (...args: unknown[]) => unknown;
	type Nested = { [k: string]: AnyFn | Nested };

	function deepProxy(path: string[]): unknown {
		const fn = () => {};
		return new Proxy(fn, {
			get(_t, p) {
				if (typeof p === "symbol") return undefined;
				if (p === "then") return undefined;
				return deepProxy([...path, p]);
			},
			apply: async (_t, _thisArg, args) => {
				const [{ getRequest }, { createSSRClient }] = await Promise.all([
					import("@tanstack/react-start/server"),
					import("@workspace/server/orpc/server-client"),
				]);
				let target: Nested = createSSRClient(getRequest()) as unknown as Nested;
				for (const seg of path.slice(0, -1)) target = target[seg] as Nested;
				return (target[path[path.length - 1]] as AnyFn)(...args);
			},
		});
	}
	return deepProxy([]) as RouterClient<AppRouter>;
}

export const client: RouterClient<AppRouter> =
	typeof window === "undefined" ? createServerClient() : createBrowserClient();

export const orpc = createTanstackQueryUtils(client);
