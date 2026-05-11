import { ORPCError } from "@orpc/client";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ context, location }) => {
		const session = await context.queryClient.ensureQueryData(orpc.session.get.queryOptions());
		if (!session) {
			throw redirect({ to: "/login", search: { redirect: location.pathname } });
		}

		let orgs;
		try {
			orgs = await context.queryClient.ensureQueryData(orpc.orgs.list.queryOptions());
		} catch (e) {
			if (e instanceof ORPCError && e.code === "UNAUTHORIZED") {
				throw redirect({ to: "/login", search: { redirect: location.pathname } });
			}
			throw e;
		}

		if (orgs.length === 0 && location.pathname !== "/onboarding") {
			throw redirect({ to: "/onboarding" });
		}

		return { session, orgs };
	},
	component: Outlet,
});
