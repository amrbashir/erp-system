import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AdminRouter } from "@workspace/server/orpc/admin-router";

/**
 * Browser-side link: same-origin `/rpc` (cookies travel for free). The
 * admin Nitro server mounts `AdminRouter` at `/rpc` (gated by
 * DEPLOY_TARGET=admin), so the same path serves admin procedures here.
 */
function createBrowserClient(): RouterClient<AdminRouter> {
	const link = new RPCLink({ url: "/rpc" });
	return createORPCClient(link);
}

/**
 * SSR-side client: dispatches procedures in-process via `createRouterClient`
 * — no HTTP round-trip. Reads the current Request from TanStack Start so
 * middleware can resolve session/cookies.
 *
 * Deep proxy defers the dynamic imports until first call so server-only
 * modules never reach the browser bundle.
 */
function createServerClient(): RouterClient<AdminRouter> {
	function deepProxy(path: string[]): any {
		const fn = () => {};
		return new Proxy(fn, {
			get(_t, p) {
				if (typeof p === "symbol") return undefined;
				if (p === "then") return undefined;
				return deepProxy([...path, p]);
			},
			apply: async (_t, _thisArg, args) => {
				const [{ getRequest }, { createAdminSSRClient }] = await Promise.all([
					import("@tanstack/react-start/server"),
					import("@workspace/server/orpc/server-client"),
				]);
				let target: any = createAdminSSRClient(getRequest());
				for (const seg of path.slice(0, -1)) target = target[seg];
				return target[path[path.length - 1]](...args);
			},
		});
	}
	return deepProxy([]) as RouterClient<AdminRouter>;
}

export const client: RouterClient<AdminRouter> =
	typeof window === "undefined" ? createServerClient() : createBrowserClient();

export const orpc = createTanstackQueryUtils(client);
