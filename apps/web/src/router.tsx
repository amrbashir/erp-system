import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// SSR-friendly: loaders prefetch with `ensureQueryData`; client
				// hydrates without re-fetching. Stale on focus, not on mount.
				staleTime: 30_000,
				refetchOnMount: false,
			},
		},
	});

	const router = createTanStackRouter({
		routeTree,
		context: { queryClient },

		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
