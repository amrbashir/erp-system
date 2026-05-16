import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app";

export const Route = createFileRoute("/_authed/_app")({
	component: () => (
		<AppLayout>
			<Outlet />
		</AppLayout>
	),
});
