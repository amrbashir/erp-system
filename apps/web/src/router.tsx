import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { createDesktopRoutes } from "@workspace/desktop/routes";

import { Route as rootRoute } from "./routes/__root";
import { routeTree as fileRouteTree } from "./routeTree.gen";

// Desktop-only routes (/activation, /setup) injected at runtime - source lives in @workspace/desktop.
const routeTree = fileRouteTree.addChildren([
	...((fileRouteTree.children ?? []) as never[]),
	...createDesktopRoutes(rootRoute),
]);

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
		notFoundMode: "root",
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
