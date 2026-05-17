import { Outlet, createFileRoute } from "@tanstack/react-router";

import { PublicLayout } from "@/layouts/public";

export const Route = createFileRoute("/_pub")({
	component: PubLayout,
});

function PubLayout() {
	return (
		<PublicLayout>
			<Outlet />
		</PublicLayout>
	);
}
