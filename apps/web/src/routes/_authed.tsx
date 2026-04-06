import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.server";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
	component: () => <Outlet />,
});
