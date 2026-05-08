import type { ContractRouterClient } from "@orpc/contract";
import { getRequest } from "@tanstack/react-start/server";
import { adminContract } from "@workspace/server/orpc/contract";
import { createAdminSSRClient } from "@workspace/server/orpc/server-client";

type AdminContract = typeof adminContract;

/**
 * SSR-side admin client. Self-denied on the client by the import-protection
 * plugin (matches `**\/*.server.*`); browser code never reaches this code
 * path because `orpc.ts` gates it on `typeof window === "undefined"`.
 *
 * Deep proxy defers `createAdminSSRClient(getRequest())` until first call so
 * each request gets its own bound client.
 */
export function createServerClient(): ContractRouterClient<AdminContract> {
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
			apply: (_t, _thisArg, args) => {
				let target: Nested = createAdminSSRClient(getRequest()) as unknown as Nested;
				for (const seg of path.slice(0, -1)) target = target[seg] as Nested;
				return (target[path[path.length - 1]] as AnyFn)(...args);
			},
		});
	}
	return deepProxy([]) as ContractRouterClient<AdminContract>;
}
