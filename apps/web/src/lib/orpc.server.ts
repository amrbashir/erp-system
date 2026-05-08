import type { ContractRouterClient } from "@orpc/contract";
import { getRequest } from "@tanstack/react-start/server";
import { contract } from "@workspace/server/orpc/contract";
import { createSSRClient } from "@workspace/server/orpc/server-client";

type AppContract = typeof contract;

/**
 * SSR-side client: dispatches procedures in-process via `createRouterClient`
 * — no HTTP round-trip. Reads the current Request from TanStack Start so
 * middleware can resolve session/cookies.
 *
 * Lives in a `.server.ts` so the import-protection plugin self-denies it on
 * the client (the import resolves to a safe Proxy mock that's never called,
 * since `orpc.ts` gates this behind `typeof window === "undefined"`).
 *
 * The deep proxy defers `createSSRClient(getRequest())` until the first
 * procedure call so each request gets its own bound client.
 */
export function createServerClient(): ContractRouterClient<AppContract> {
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
				let target: Nested = createSSRClient(getRequest()) as unknown as Nested;
				for (const seg of path.slice(0, -1)) target = target[seg] as Nested;
				return (target[path[path.length - 1]] as AnyFn)(...args);
			},
		});
	}
	return deepProxy([]) as ContractRouterClient<AppContract>;
}
